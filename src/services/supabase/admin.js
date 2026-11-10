import { PERMISSIONS } from '../../config/roles'
import { fullName } from '../../utils/format'
import { tokenize } from '../../utils/search'
import { ApiError } from '../errors'
import { supabase } from './client'
import { authorize, mapAnswer, mapQuestion, requireUser, rpc, unwrap } from './shared'

const QUEUE_LIMIT = 200

export async function getAdminOverview() {
  await requireUser()
  return (await rpc('admin_overview')).overview
}

/** Newest questions and answers first, for moderators to review and remove. */
export async function listModerationQueue({ type = 'all', q = '' } = {}) {
  const user = await requireUser()
  await authorize(user, PERMISSIONS.CONTENT_MODERATE, 'Moderation queue')

  const [questions, answers] = await Promise.all([
    type === 'answer' ? [] : unwrap(supabase().from('question_feed').select('*').order('created_at', { ascending: false }).limit(QUEUE_LIMIT)),
    type === 'question' ? [] : unwrap(supabase().from('answer_feed').select('*').order('created_at', { ascending: false }).limit(QUEUE_LIMIT)),
  ])

  const items = [
    ...questions.map(mapQuestion).map((question) => ({
      type: 'question', id: question.id, questionId: question.id, title: question.title, body: question.content,
      author: question.author, createdAt: question.createdAt, meta: question,
    })),
    ...answers.map(mapAnswer).map((answer) => ({
      type: 'answer', id: answer.id, questionId: answer.questionId, title: answer.question?.title ?? 'Deleted question', body: answer.content,
      author: answer.author, createdAt: answer.createdAt, meta: { verificationStatus: answer.verificationStatus, course: answer.question?.course },
    })),
  ]

  const tokens = tokenize(q)
  return items
    .filter((item) => tokens.every((t) => `${item.title} ${item.body} ${fullName(item.author)}`.toLowerCase().includes(t)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function listUsers({ q = '', role = '' } = {}) {
  const user = await requireUser()
  const result = await rpc('admin_list_users', { p_q: q, p_role: role || null })
  return result.users.map((u) => ({ ...u, isSelf: u.id === user.id }))
}

export async function changeUserRole(userId, { role, reason = '' }) {
  await requireUser()
  await rpc('admin_change_role', { p_user_id: userId, p_role: role, p_reason: reason })
}

const camelize = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_(\w)/g, (_, c) => c.toUpperCase()), value]))

export async function listModerationLogs() {
  const user = await requireUser()
  await authorize(user, PERMISSIONS.LOGS_VIEW, 'Moderation logs')
  const rows = await unwrap(supabase().from('moderation_log_feed').select('*').order('created_at', { ascending: false }).limit(QUEUE_LIMIT))
  return rows.map(camelize)
}

export async function listAccessLogs() {
  const user = await requireUser()
  await authorize(user, PERMISSIONS.LOGS_VIEW, 'Unauthorized-access logs')
  const rows = await unwrap(supabase().from('access_log_feed').select('*').order('created_at', { ascending: false }).limit(QUEUE_LIMIT))
  return rows.map(camelize)
}

/** Called by route guards when a signed-in user opens a page their role cannot access. */
export async function reportAccessDenied(resource, action) {
  await supabase().rpc('log_access_denied', { p_resource: resource, p_action: action })
}

export async function resetDemoData() {
  throw new ApiError('FORBIDDEN', 'Shared Supabase data cannot be reset from the browser. Run `npm run seed -- --reset` instead.')
}
