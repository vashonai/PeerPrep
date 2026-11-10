import { PERMISSIONS } from '../../config/roles'
import { hasErrors, validateQuestion } from '../../utils/validation'
import { ApiError } from '../errors'
import { supabase } from './client'
import { authorize, isUuid, mapQuestion, notFound, pathsOf, removeFiles, requireUser, rpc, unwrap, uploadAttachments } from './shared'

const TOPIC_MISMATCH = new ApiError('VALIDATION', 'Please correct the highlighted fields.', { topicId: 'The selected topic does not belong to this course.' })
const WRITE_ERRORS = { foreignKey: TOPIC_MISMATCH, invalid: 'Some of the question details are invalid. Check the title, content and attachments.' }

const feed = () => supabase().from('question_feed').select('*')

export async function listQuestions({ q = '', courseId = '', topicId = '', difficulty = '', sort = 'recent', page = 1, pageSize = 8 } = {}) {
  if ((courseId && !isUuid(courseId)) || (topicId && !isUuid(topicId))) return { items: [], total: 0, page: 1, pageSize, totalPages: 1 }

  const result = await rpc('search_questions', {
    p_q: q,
    p_course_id: courseId || null,
    p_topic_id: topicId || null,
    p_difficulty: difficulty || null,
    p_sort: sort,
    p_page: Number(page) || 1,
    p_page_size: pageSize,
  })

  let items = []
  if (result.ids.length) {
    const rows = await unwrap(feed().in('id', result.ids))
    const byId = new Map(rows.map((row) => [row.id, mapQuestion(row)]))
    items = result.ids.map((id) => byId.get(id)).filter(Boolean)
  }
  return { items, total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages }
}

export async function getQuestion(id) {
  if (!isUuid(id)) throw notFound('This question')
  const row = await unwrap(feed().eq('id', id).maybeSingle())
  if (!row) throw notFound('This question')
  return mapQuestion(row)
}

export async function listMyQuestions() {
  const user = await requireUser()
  const rows = await unwrap(feed().eq('author_id', user.id).order('created_at', { ascending: false }))
  return rows.map(mapQuestion)
}

const toRow = (input) => ({
  title: input.title.trim(),
  content: input.content.trim(),
  course_id: input.courseId,
  topic_id: input.topicId,
  difficulty: input.difficulty,
})

function validate(input) {
  // Course/topic existence and pairing are enforced by the database.
  const errors = validateQuestion(input, { courses: [{ id: input.courseId }], topics: [{ id: input.topicId, courseId: input.courseId }] })
  if (hasErrors(errors)) throw new ApiError('VALIDATION', 'Please correct the highlighted fields.', errors)
}

export async function createQuestion(input) {
  const user = await requireUser()
  await authorize(user, PERMISSIONS.QUESTION_CREATE, 'Upload question')
  validate(input)

  const { stored, uploaded } = await uploadAttachments(input.attachments, user)
  try {
    const row = await unwrap(supabase().from('questions').insert({ ...toRow(input), attachments: stored }).select('id').single(), WRITE_ERRORS)
    return getQuestion(row.id)
  } catch (error) {
    await removeFiles(uploaded)
    throw error
  }
}

export async function updateQuestion(id, input) {
  const user = await requireUser()
  const existing = await getQuestion(id)
  if (existing.authorId !== user.id) await authorize(null, PERMISSIONS.CONTENT_EDIT_OWN, `Edit question "${existing.title}"`)
  validate(input)

  const { stored, uploaded } = await uploadAttachments(input.attachments, user)
  try {
    const rows = await unwrap(supabase().from('questions').update({ ...toRow(input), attachments: stored }).eq('id', id).select('id'), WRITE_ERRORS)
    if (!rows.length) throw new ApiError('FORBIDDEN', 'You can only edit questions you uploaded.')
  } catch (error) {
    await removeFiles(uploaded)
    throw error
  }
  const kept = new Set(pathsOf(stored))
  await removeFiles(pathsOf(existing.attachments).filter((path) => !kept.has(path)))
  return getQuestion(id)
}

/** Authors delete their own question; StudentAdmins delete any (logged server-side). */
export async function deleteQuestion(id, { reason = '' } = {}) {
  await requireUser()
  if (!isUuid(id)) throw notFound('This question')
  const result = await rpc('delete_question', { p_id: id, p_reason: reason })
  await removeFiles(result.paths)
}
