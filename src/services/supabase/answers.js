import { PERMISSIONS } from '../../config/roles'
import { hasErrors, validateAnswer } from '../../utils/validation'
import { ApiError } from '../errors'
import { supabase } from './client'
import { authorize, isUuid, mapAnswer, notFound, pathsOf, removeFiles, requireUser, rpc, unwrap, uploadAttachments } from './shared'

const feed = () => supabase().from('answer_feed').select('*')

export async function getAnswer(id) {
  const row = await unwrap(feed().eq('id', id).maybeSingle())
  if (!row) throw notFound('This answer')
  return mapAnswer(row)
}

export async function listAnswers(questionId) {
  if (!isUuid(questionId)) throw notFound('This question')
  const rows = await unwrap(feed().eq('question_id', questionId).order('created_at', { ascending: true }))
  return rows.map(mapAnswer)
}

export async function listMyAnswers() {
  const user = await requireUser()
  const rows = await unwrap(feed().eq('author_id', user.id).order('created_at', { ascending: false }))
  return rows.map(mapAnswer)
}

function validate(input) {
  const errors = validateAnswer(input)
  if (hasErrors(errors)) throw new ApiError('VALIDATION', 'Please correct the highlighted fields.', errors)
}

export async function createAnswer(questionId, input) {
  const user = await requireUser()
  await authorize(user, PERMISSIONS.ANSWER_CREATE, 'Post answer')
  if (!isUuid(questionId)) throw notFound('This question')
  validate(input)

  const { stored, uploaded } = await uploadAttachments(input.attachments, user)
  try {
    const row = await unwrap(
      supabase().from('answers').insert({ question_id: questionId, content: input.content.trim(), attachments: stored }).select('id').single(),
      { foreignKey: notFound('This question') },
    )
    return getAnswer(row.id)
  } catch (error) {
    await removeFiles(uploaded)
    throw error
  }
}

/** Editing a verified answer's text resets it to Unverified (database trigger). */
export async function updateAnswer(id, input) {
  const user = await requireUser()
  if (!isUuid(id)) throw notFound('This answer')
  const existing = await getAnswer(id)
  if (existing.authorId !== user.id) await authorize(null, PERMISSIONS.CONTENT_EDIT_OWN, `Edit answer ${id}`)
  validate(input)

  const { stored, uploaded } = await uploadAttachments(input.attachments, user)
  try {
    const rows = await unwrap(supabase().from('answers').update({ content: input.content.trim(), attachments: stored }).eq('id', id).select('id'))
    if (!rows.length) throw new ApiError('FORBIDDEN', 'You can only edit answers you wrote.')
  } catch (error) {
    await removeFiles(uploaded)
    throw error
  }
  const kept = new Set(pathsOf(stored))
  await removeFiles(pathsOf(existing.attachments).filter((path) => !kept.has(path)))
  return getAnswer(id)
}

export async function deleteAnswer(id, { reason = '' } = {}) {
  await requireUser()
  if (!isUuid(id)) throw notFound('This answer')
  const result = await rpc('delete_answer', { p_id: id, p_reason: reason })
  await removeFiles(result.paths)
}
