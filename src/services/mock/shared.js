import { ATTACHMENT_RULES, VERIFICATION_STATUS } from '../../data/models'
import { ApiError } from '../errors'
import { newId, nowIso } from './db'

/** Response serializers and shared write helpers for the mock services. */

export function publicUser(db, id) {
  const user = db.users.find((u) => u.id === id)
  return user ? { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role } : null
}

export function serializeQuestion(db, question) {
  const answers = db.answers.filter((a) => a.questionId === question.id)
  return {
    ...question,
    course: db.courses.find((c) => c.id === question.courseId) ?? null,
    topic: db.topics.find((t) => t.id === question.topicId) ?? null,
    author: publicUser(db, question.authorId),
    answerCount: answers.length,
    verifiedAnswerCount: answers.filter((a) => a.verificationStatus === VERIFICATION_STATUS.CORRECT).length,
  }
}

export function serializeVerification(db, record) {
  return { ...record, reviewer: record.reviewerId ? publicUser(db, record.reviewerId) : null }
}

export function serializeAnswer(db, answer) {
  return {
    ...answer,
    author: publicUser(db, answer.authorId),
    reviewer: answer.verifiedBy ? publicUser(db, answer.verifiedBy) : null,
    verificationHistory: db.verifications
      .filter((v) => v.answerId === answer.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((v) => serializeVerification(db, v)),
  }
}

export function questionSummary(db, questionId) {
  const question = db.questions.find((q) => q.id === questionId)
  if (!question) return null
  return {
    id: question.id,
    title: question.title,
    course: db.courses.find((c) => c.id === question.courseId) ?? null,
    topic: db.topics.find((t) => t.id === question.topicId) ?? null,
  }
}

/**
 * Server-side attachment validation. Keeps attachments that already exist on
 * the record and validates new uploads against the allowed types and sizes.
 */
export function sanitizeAttachments(drafts = [], user, existing = []) {
  if (!Array.isArray(drafts)) throw new ApiError('VALIDATION', 'Attachments are invalid.')
  if (drafts.length > ATTACHMENT_RULES.maxFiles)
    throw new ApiError('VALIDATION', `You can attach up to ${ATTACHMENT_RULES.maxFiles} files.`, { attachments: `Attach up to ${ATTACHMENT_RULES.maxFiles} files.` })

  return drafts.map((draft) => {
    const kept = existing.find((e) => e.id === draft.id)
    if (kept) return kept
    const valid =
      ATTACHMENT_RULES.mimeTypes.includes(draft.mimeType) &&
      draft.size > 0 &&
      draft.size <= ATTACHMENT_RULES.maxBytes &&
      typeof draft.url === 'string' &&
      draft.url.startsWith(`data:${draft.mimeType};base64,`)
    if (!valid) throw new ApiError('VALIDATION', `"${draft.fileName}" was rejected. Only PDF, JPG and PNG files up to 5 MB are allowed.`, { attachments: 'One or more attachments were rejected.' })
    return {
      id: newId('att'),
      fileName: String(draft.fileName).slice(0, 120),
      mimeType: draft.mimeType,
      size: draft.size,
      url: draft.url,
      uploadedBy: user.id,
      uploadedAt: nowIso(),
    }
  })
}

export function logModeration(db, actor, { action, targetType, targetId, summary, reason = '' }) {
  db.moderationLogs.unshift({ id: newId('m'), actorId: actor.id, action, targetType, targetId, summary, reason: reason.trim(), createdAt: nowIso() })
}

export function validationError(fieldErrors) {
  return new ApiError('VALIDATION', 'Please correct the highlighted fields.', fieldErrors)
}
