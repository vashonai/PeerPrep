import { PERMISSIONS, can } from '../../config/roles'
import { LOG_ACTIONS, VERIFICATION_STATUS } from '../../data/models'
import { excerpt, fullName } from '../../utils/format'
import { hasErrors, validateAnswer } from '../../utils/validation'
import { commit, getDb, newId, nowIso } from './db'
import { authorize, forbid, latency, notFound, requireUser } from './server'
import { logModeration, questionSummary, sanitizeAttachments, serializeAnswer, validationError } from './shared'

export async function listAnswers(questionId) {
  await latency()
  const db = getDb()
  if (!db.questions.some((q) => q.id === questionId)) throw notFound('This question')
  return db.answers
    .filter((a) => a.questionId === questionId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((a) => serializeAnswer(db, a))
}

export async function listMyAnswers() {
  const user = requireUser()
  await latency()
  const db = getDb()
  return db.answers
    .filter((a) => a.authorId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => ({ ...serializeAnswer(db, a), question: questionSummary(db, a.questionId) }))
}

export async function createAnswer(questionId, input) {
  const user = requireUser()
  authorize(user, PERMISSIONS.ANSWER_CREATE, 'Post answer')
  await latency(450)

  const db = getDb()
  if (!db.questions.some((q) => q.id === questionId)) throw notFound('This question')
  const errors = validateAnswer(input)
  if (hasErrors(errors)) throw validationError(errors)

  const now = nowIso()
  const answer = {
    id: newId('a'),
    questionId,
    authorId: user.id,
    content: input.content.trim(),
    attachments: sanitizeAttachments(input.attachments, user),
    verificationStatus: VERIFICATION_STATUS.UNVERIFIED,
    verifiedBy: null,
    verifiedAt: null,
    createdAt: now,
    updatedAt: now,
  }
  db.answers.push(answer)
  commit()
  return serializeAnswer(db, answer)
}

/**
 * Editing a verified answer's content resets it to Unverified: the reviewer
 * judged the old text, not the new one. The reset is kept in the history.
 */
export async function updateAnswer(id, input) {
  const user = requireUser()
  await latency(400)
  const db = getDb()
  const answer = db.answers.find((a) => a.id === id)
  if (!answer) throw notFound('This answer')
  if (answer.authorId !== user.id || !can(user, PERMISSIONS.CONTENT_EDIT_OWN))
    forbid(user, 'answer:update', `Answer ${answer.id}`, 'You can only edit answers you wrote.')

  const errors = validateAnswer(input)
  if (hasErrors(errors)) throw validationError(errors)

  const content = input.content.trim()
  const now = nowIso()
  if (content !== answer.content && answer.verificationStatus !== VERIFICATION_STATUS.UNVERIFIED) {
    db.verifications.push({
      id: newId('v'),
      kind: 'reset',
      answerId: answer.id,
      questionId: answer.questionId,
      reviewerId: null,
      status: VERIFICATION_STATUS.UNVERIFIED,
      previousStatus: answer.verificationStatus,
      isOverride: false,
      note: 'Status reset because the author edited the answer.',
      createdAt: now,
    })
    Object.assign(answer, { verificationStatus: VERIFICATION_STATUS.UNVERIFIED, verifiedBy: null, verifiedAt: null })
  }
  Object.assign(answer, { content, attachments: sanitizeAttachments(input.attachments, user, answer.attachments), updatedAt: now })
  commit()
  return serializeAnswer(db, answer)
}

/** Authors may delete their own answer; StudentAdmins may delete any (logged). */
export async function deleteAnswer(id, { reason = '' } = {}) {
  const user = requireUser()
  await latency(350)
  const db = getDb()
  const answer = db.answers.find((a) => a.id === id)
  if (!answer) throw notFound('This answer')

  const isOwner = answer.authorId === user.id && can(user, PERMISSIONS.CONTENT_EDIT_OWN)
  if (!isOwner) {
    authorize(user, PERMISSIONS.CONTENT_MODERATE, `Delete answer ${answer.id}`)
    const author = db.users.find((u) => u.id === answer.authorId)
    logModeration(db, user, {
      action: LOG_ACTIONS.ANSWER_DELETED,
      targetType: 'answer',
      targetId: answer.id,
      summary: `"${excerpt(answer.content, 60)}" by ${fullName(author)}`,
      reason,
    })
  }

  db.answers = db.answers.filter((a) => a.id !== id)
  commit()
}
