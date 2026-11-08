import { PERMISSIONS, can } from '../../config/roles'
import { LOG_ACTIONS } from '../../data/models'
import { fullName } from '../../utils/format'
import { relevanceScore, tokenize } from '../../utils/search'
import { hasErrors, validateQuestion } from '../../utils/validation'
import { commit, getDb, newId, nowIso } from './db'
import { authorize, forbid, latency, notFound, requireUser } from './server'
import { logModeration, sanitizeAttachments, serializeQuestion, validationError } from './shared'

export async function listQuestions({ q = '', courseId = '', topicId = '', difficulty = '', sort = 'recent', page = 1, pageSize = 8, authorId = '' } = {}) {
  await latency()
  const db = getDb()
  const tokens = tokenize(q)

  let rows = db.questions.filter(
    (question) =>
      (!courseId || question.courseId === courseId) &&
      (!topicId || question.topicId === topicId) &&
      (!difficulty || question.difficulty === difficulty) &&
      (!authorId || question.authorId === authorId),
  )

  const scores = new Map()
  if (tokens.length) {
    for (const question of rows) {
      const course = db.courses.find((c) => c.id === question.courseId)
      const score = relevanceScore(tokens, {
        title: question.title,
        content: question.content,
        courseText: course ? `${course.code} ${course.title}` : '',
        topicText: db.topics.find((t) => t.id === question.topicId)?.name ?? '',
        answerText: db.answers.filter((a) => a.questionId === question.id).map((a) => a.content).join(' '),
      })
      if (score > 0) scores.set(question.id, score)
    }
    rows = rows.filter((question) => scores.has(question.id))
  }

  rows.sort((a, b) =>
    sort === 'relevance' && tokens.length
      ? scores.get(b.id) - scores.get(a.id) || b.createdAt.localeCompare(a.createdAt)
      : b.createdAt.localeCompare(a.createdAt),
  )

  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, Number(page) || 1), totalPages)
  const items = rows.slice((current - 1) * pageSize, current * pageSize).map((question) => serializeQuestion(db, question))
  return { items, total, page: current, pageSize, totalPages }
}

export async function getQuestion(id) {
  await latency()
  const db = getDb()
  const question = db.questions.find((q) => q.id === id)
  if (!question) throw notFound('This question')
  return serializeQuestion(db, question)
}

export async function listMyQuestions() {
  const user = requireUser()
  await latency()
  const db = getDb()
  return db.questions
    .filter((q) => q.authorId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((q) => serializeQuestion(db, q))
}

function cleanInput(input) {
  return {
    title: input.title.trim(),
    content: input.content.trim(),
    courseId: input.courseId,
    topicId: input.topicId,
    difficulty: input.difficulty,
  }
}

export async function createQuestion(input) {
  const user = requireUser()
  authorize(user, PERMISSIONS.QUESTION_CREATE, 'Upload question')
  await latency(500)

  const db = getDb()
  const errors = validateQuestion(input, db)
  if (hasErrors(errors)) throw validationError(errors)

  const now = nowIso()
  const question = {
    id: newId('q'),
    ...cleanInput(input),
    authorId: user.id,
    attachments: sanitizeAttachments(input.attachments, user),
    createdAt: now,
    updatedAt: now,
  }
  db.questions.push(question)
  commit()
  return serializeQuestion(db, question)
}

export async function updateQuestion(id, input) {
  const user = requireUser()
  await latency(450)
  const db = getDb()
  const question = db.questions.find((q) => q.id === id)
  if (!question) throw notFound('This question')
  if (question.authorId !== user.id || !can(user, PERMISSIONS.CONTENT_EDIT_OWN))
    forbid(user, 'question:update', `Question "${question.title}"`, 'You can only edit questions you uploaded.')

  const errors = validateQuestion(input, db)
  if (hasErrors(errors)) throw validationError(errors)

  Object.assign(question, cleanInput(input), {
    attachments: sanitizeAttachments(input.attachments, user, question.attachments),
    updatedAt: nowIso(),
  })
  commit()
  return serializeQuestion(db, question)
}

/** Authors may delete their own question; StudentAdmins may delete any (logged). */
export async function deleteQuestion(id, { reason = '' } = {}) {
  const user = requireUser()
  await latency(400)
  const db = getDb()
  const question = db.questions.find((q) => q.id === id)
  if (!question) throw notFound('This question')

  const isOwner = question.authorId === user.id && can(user, PERMISSIONS.CONTENT_EDIT_OWN)
  if (!isOwner) {
    authorize(user, PERMISSIONS.CONTENT_MODERATE, `Delete question "${question.title}"`)
    const author = db.users.find((u) => u.id === question.authorId)
    logModeration(db, user, {
      action: LOG_ACTIONS.QUESTION_DELETED,
      targetType: 'question',
      targetId: question.id,
      summary: `"${question.title}" by ${fullName(author)}`,
      reason,
    })
  }

  db.questions = db.questions.filter((q) => q.id !== id)
  db.answers = db.answers.filter((a) => a.questionId !== id)
  commit()
}
