import { PERMISSIONS } from '../../config/roles'
import { hasErrors, validateCourse, validateTopic } from '../../utils/validation'
import { ApiError } from '../errors'
import { supabase } from './client'
import { authorize, notFound, requireUser, unwrap } from './shared'

const validationError = (fieldErrors) => new ApiError('VALIDATION', 'Please correct the highlighted fields.', fieldErrors)

/** Courses with nested topics and question counts. Public. */
export async function listCourses() {
  const rows = await unwrap(supabase().from('course_catalog').select('*').order('code'))
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    department: row.department,
    createdAt: row.created_at,
    questionCount: row.question_count,
    topics: row.topics,
  }))
}

async function requireManager(action) {
  const user = await requireUser()
  await authorize(user, PERMISSIONS.CATEGORY_MANAGE, action)
}

const courseRow = (input) => ({ code: input.code.trim().toUpperCase(), title: input.title.trim(), department: input.department.trim() })
const COURSE_ERRORS = { unique: { code: 'A course with this code already exists.' } }
const TOPIC_ERRORS = { unique: { name: 'This course already has a topic with that name.' }, foreignKey: notFound('This course') }

async function single(request, context, what) {
  const rows = await unwrap(request, context)
  if (!rows.length) throw notFound(what)
  return rows[0]
}

export async function createCourse(input) {
  await requireManager('Create course')
  const errors = validateCourse(input)
  if (hasErrors(errors)) throw validationError(errors)
  return unwrap(supabase().from('courses').insert(courseRow(input)).select().single(), COURSE_ERRORS)
}

export async function updateCourse(id, input) {
  await requireManager('Update course')
  const errors = validateCourse(input)
  if (hasErrors(errors)) throw validationError(errors)
  return single(supabase().from('courses').update(courseRow(input)).eq('id', id).select(), COURSE_ERRORS, 'This course')
}

export async function deleteCourse(id) {
  await requireManager('Delete course')
  await single(
    supabase().from('courses').delete().eq('id', id).select('id'),
    { foreignKey: new ApiError('CONFLICT', 'This course still has questions. Move or delete them before deleting the course.') },
    'This course',
  )
}

export async function createTopic(courseId, input) {
  await requireManager('Create topic')
  const errors = validateTopic(input)
  if (hasErrors(errors)) throw validationError(errors)
  return unwrap(supabase().from('topics').insert({ course_id: courseId, name: input.name.trim() }).select().single(), TOPIC_ERRORS)
}

export async function updateTopic(id, input) {
  await requireManager('Update topic')
  const errors = validateTopic(input)
  if (hasErrors(errors)) throw validationError(errors)
  return single(supabase().from('topics').update({ name: input.name.trim() }).eq('id', id).select(), TOPIC_ERRORS, 'This topic')
}

export async function deleteTopic(id) {
  await requireManager('Delete topic')
  await single(
    supabase().from('topics').delete().eq('id', id).select('id'),
    { foreignKey: new ApiError('CONFLICT', 'This topic still has questions. Move or delete them before deleting the topic.') },
    'This topic',
  )
}
