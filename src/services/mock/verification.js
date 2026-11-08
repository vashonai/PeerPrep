import { PERMISSIONS } from '../../config/roles'
import { VERIFICATION_STATUS } from '../../data/models'
import { tokenize } from '../../utils/search'
import { ApiError } from '../errors'
import { commit, getDb, newId, nowIso } from './db'
import { authorize, forbid, latency, notFound, requireUser } from './server'
import { questionSummary, serializeAnswer, serializeVerification } from './shared'

/**
 * Answers for reviewers. `pending` lists unverified answers oldest first;
 * `reviewed` lists verified answers, most recently decided first. A reviewer's
 * own answers never appear in their queue.
 */
export async function listVerificationQueue({ status = 'pending', courseId = '', q = '' } = {}) {
  const user = requireUser()
  authorize(user, PERMISSIONS.ANSWER_VERIFY, 'Verification queue')
  await latency()

  const db = getDb()
  const tokens = tokenize(q)
  const pending = status === 'pending'
  return db.answers
    .filter((a) => a.authorId !== user.id)
    .filter((a) => (a.verificationStatus === VERIFICATION_STATUS.UNVERIFIED) === pending)
    .map((a) => ({ ...serializeAnswer(db, a), question: questionSummary(db, a.questionId) }))
    .filter((a) => a.question && (!courseId || a.question.course?.id === courseId))
    .filter((a) => {
      if (!tokens.length) return true
      const text = `${a.question.title} ${a.content}`.toLowerCase()
      return tokens.every((t) => text.includes(t))
    })
    .sort((a, b) => (pending ? a.createdAt.localeCompare(b.createdAt) : b.verifiedAt.localeCompare(a.verifiedAt)))
}

/**
 * Records a verification decision. Changing an existing decision is an
 * override and must be explicitly confirmed by the caller.
 */
export async function verifyAnswer(answerId, { status, note = '', confirmOverride = false }) {
  const user = requireUser()
  authorize(user, PERMISSIONS.ANSWER_VERIFY, `Verify answer ${answerId}`)
  await latency(400)

  const db = getDb()
  const answer = db.answers.find((a) => a.id === answerId)
  if (!answer) throw notFound('This answer')
  if (![VERIFICATION_STATUS.CORRECT, VERIFICATION_STATUS.INCORRECT].includes(status))
    throw new ApiError('VALIDATION', 'Choose Correct or Incorrect.')
  if (answer.authorId === user.id)
    forbid(user, 'answer:verify-own', `Answer ${answer.id}`, 'You cannot verify your own answer.')
  if (answer.verificationStatus === status)
    throw new ApiError('CONFLICT', 'This answer already has that verification status.')

  const isOverride = answer.verificationStatus !== VERIFICATION_STATUS.UNVERIFIED
  if (isOverride) {
    authorize(user, PERMISSIONS.VERIFICATION_OVERRIDE, `Override verification of answer ${answer.id}`)
    if (!confirmOverride) throw new ApiError('CONFLICT', 'Overriding an existing decision requires confirmation.')
  }

  const now = nowIso()
  const record = {
    id: newId('v'),
    kind: 'review',
    answerId: answer.id,
    questionId: answer.questionId,
    reviewerId: user.id,
    status,
    previousStatus: answer.verificationStatus,
    isOverride,
    note: note.trim().slice(0, 500),
    createdAt: now,
  }
  db.verifications.push(record)
  Object.assign(answer, { verificationStatus: status, verifiedBy: user.id, verifiedAt: now })
  commit()
  return serializeAnswer(db, answer)
}

/** Most recent verification decisions across the platform. */
export async function listVerificationActivity({ limit = 50, reviewerId = '' } = {}) {
  const user = requireUser()
  authorize(user, PERMISSIONS.ANSWER_VERIFY, 'Verification activity')
  await latency()
  const db = getDb()
  return db.verifications
    .filter((v) => v.kind === 'review' && (!reviewerId || v.reviewerId === reviewerId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((v) => ({
      ...serializeVerification(db, v),
      question: questionSummary(db, v.questionId),
      answerExists: db.answers.some((a) => a.id === v.answerId),
    }))
}
