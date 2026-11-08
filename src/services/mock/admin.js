import { DEMO_MODE } from '../../config/env'
import { PERMISSIONS, ROLES, ROLE_LABELS } from '../../config/roles'
import { LOG_ACTIONS, VERIFICATION_STATUS } from '../../data/models'
import { fullName } from '../../utils/format'
import { tokenize } from '../../utils/search'
import { ApiError } from '../errors'
import { commit, getDb, resetDb } from './db'
import { isDemoEmail } from './demoAccounts'
import { authorize, latency, logUnauthorized, notFound, requireUser } from './server'
import { endSession } from './session'
import { logModeration, publicUser, questionSummary, serializeQuestion } from './shared'

const WEEK_MS = 7 * 24 * 3600 * 1000

export async function getAdminOverview() {
  const user = requireUser()
  authorize(user, PERMISSIONS.CONTENT_MODERATE, 'Administration overview')
  await latency()
  const db = getDb()
  const since = new Date(Date.now() - WEEK_MS).toISOString()
  return {
    users: db.users.length,
    questions: db.questions.length,
    answers: db.answers.length,
    pendingVerification: db.answers.filter((a) => a.verificationStatus === VERIFICATION_STATUS.UNVERIFIED).length,
    newContentThisWeek: db.questions.filter((q) => q.createdAt >= since).length + db.answers.filter((a) => a.createdAt >= since).length,
    accessDeniedThisWeek: db.accessLogs.filter((l) => l.createdAt >= since).length,
  }
}

/** Newest questions and answers first, for moderators to review and remove. */
export async function listModerationQueue({ type = 'all', q = '' } = {}) {
  const user = requireUser()
  authorize(user, PERMISSIONS.CONTENT_MODERATE, 'Moderation queue')
  await latency()
  const db = getDb()
  const tokens = tokenize(q)
  const matches = (text) => tokens.every((t) => text.toLowerCase().includes(t))

  const questions = type === 'answer' ? [] : db.questions.map((question) => ({
    type: 'question',
    id: question.id,
    questionId: question.id,
    title: question.title,
    body: question.content,
    author: publicUser(db, question.authorId),
    createdAt: question.createdAt,
    meta: serializeQuestion(db, question),
  }))
  const answers = type === 'question' ? [] : db.answers.map((answer) => {
    const question = questionSummary(db, answer.questionId)
    return {
      type: 'answer',
      id: answer.id,
      questionId: answer.questionId,
      title: question?.title ?? 'Deleted question',
      body: answer.content,
      author: publicUser(db, answer.authorId),
      createdAt: answer.createdAt,
      meta: { verificationStatus: answer.verificationStatus, course: question?.course },
    }
  })

  return [...questions, ...answers]
    .filter((item) => !tokens.length || matches(`${item.title} ${item.body} ${fullName(item.author)}`))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function listUsers({ q = '', role = '' } = {}) {
  const user = requireUser()
  authorize(user, PERMISSIONS.ROLE_MANAGE, 'User management')
  await latency()
  const tokens = tokenize(q)
  return getDb()
    .users.filter((u) => !role || u.role === role)
    .filter((u) => tokens.every((t) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(t)))
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map(({ id, firstName, lastName, email, role: r, createdAt }) => ({
      id, firstName, lastName, email, role: r, createdAt,
      isDemo: isDemoEmail(email),
      isSelf: id === user.id,
    }))
}

export async function changeUserRole(userId, { role, reason = '' }) {
  const actor = requireUser()
  authorize(actor, PERMISSIONS.ROLE_MANAGE, `Change role of user ${userId}`)
  await latency(400)
  if (!Object.values(ROLES).includes(role)) throw new ApiError('VALIDATION', 'Choose a valid role.')

  const db = getDb()
  const target = db.users.find((u) => u.id === userId)
  if (!target) throw notFound('This user')
  if (target.id === actor.id) throw new ApiError('CONFLICT', 'You cannot change your own role. Ask another administrator.')
  if (isDemoEmail(target.email)) throw new ApiError('CONFLICT', 'Demo account roles are fixed so each role can always be tested.')
  if (target.role === role) throw new ApiError('CONFLICT', `${fullName(target)} is already a ${ROLE_LABELS[role]}.`)

  logModeration(db, actor, {
    action: LOG_ACTIONS.ROLE_CHANGED,
    targetType: 'user',
    targetId: target.id,
    summary: `${fullName(target)}: ${ROLE_LABELS[target.role]} → ${ROLE_LABELS[role]}`,
    reason,
  })
  target.role = role
  commit()
  return { ...target }
}

export async function listModerationLogs() {
  const user = requireUser()
  authorize(user, PERMISSIONS.LOGS_VIEW, 'Moderation logs')
  await latency()
  const db = getDb()
  return [...db.moderationLogs]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((log) => ({ ...log, actor: publicUser(db, log.actorId) }))
}

export async function listAccessLogs() {
  const user = requireUser()
  authorize(user, PERMISSIONS.LOGS_VIEW, 'Unauthorized-access logs')
  await latency()
  const db = getDb()
  return [...db.accessLogs]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((log) => ({ ...log, user: publicUser(db, log.userId) }))
}

/** Called by route guards when a signed-in user opens a page their role cannot access. */
export async function reportAccessDenied(resource, action) {
  const user = requireUser()
  logUnauthorized(user, action, resource)
}

/** Demo mode only: restores the seed data and signs everyone out. */
export async function resetDemoData() {
  if (!DEMO_MODE) throw new ApiError('FORBIDDEN', 'Resetting data is only available in demo mode.')
  await latency(300)
  resetDb()
  endSession()
}
