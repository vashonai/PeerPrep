import { PERMISSIONS } from '../../config/roles'
import { getAnswer } from './answers'
import { supabase } from './client'
import { authorize, isUuid, mapAnswer, notFound, requireUser, rpc, unwrap } from './shared'

/** PostgREST `or` filters use commas and parentheses as syntax, so strip them from user input. */
const safeTerm = (q) => q.replace(/[^\p{L}\p{N}\s'-]+/gu, ' ').trim()

/**
 * `pending`: unverified answers, oldest first. `reviewed`: verified answers,
 * most recent decision first. A reviewer's own answers are excluded.
 */
export async function listVerificationQueue({ status = 'pending', courseId = '', q = '' } = {}) {
  const user = await requireUser()
  await authorize(user, PERMISSIONS.ANSWER_VERIFY, 'Verification queue')

  let query = supabase().from('answer_feed').select('*').limit(100)
  query = status === 'pending'
    ? query.eq('verification_status', 'Unverified').order('created_at', { ascending: true })
    : query.neq('verification_status', 'Unverified').order('verified_at', { ascending: false })
  if (courseId && isUuid(courseId)) query = query.eq('course_id', courseId)
  const term = safeTerm(q)
  if (term) query = query.or(`content.ilike.*${term}*,question_title.ilike.*${term}*`)

  const rows = await unwrap(query)
  return rows.filter((row) => row.author_id !== user.id).map(mapAnswer)
}

export async function verifyAnswer(answerId, { status, note = '', confirmOverride = false }) {
  await requireUser()
  if (!isUuid(answerId)) throw notFound('This answer')
  await rpc('verify_answer', { p_answer_id: answerId, p_status: status, p_note: note, p_confirm_override: confirmOverride })
  return getAnswer(answerId)
}

export async function listVerificationActivity({ limit = 50, reviewerId = '' } = {}) {
  const user = await requireUser()
  await authorize(user, PERMISSIONS.ANSWER_VERIFY, 'Verification activity')
  let query = supabase().from('verification_activity').select('*').eq('kind', 'review').order('created_at', { ascending: false }).limit(limit)
  if (reviewerId) query = query.eq('reviewer_id', reviewerId)
  const rows = await unwrap(query)
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    answerId: row.answer_id,
    questionId: row.question_id,
    reviewerId: row.reviewer_id,
    status: row.status,
    previousStatus: row.previous_status,
    isOverride: row.is_override,
    note: row.note,
    createdAt: row.created_at,
    reviewer: row.reviewer,
    question: row.question,
    answerExists: row.answer_exists,
  }))
}
