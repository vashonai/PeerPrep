import { PERMISSIONS } from '../../config/roles'
import { LOG_ACTIONS } from '../../data/models'
import { hasErrors, validateCourse, validateTopic } from '../../utils/validation'
import { ApiError } from '../errors'
import { commit, getDb, newId, nowIso } from './db'
import { authorize, latency, notFound, requireUser } from './server'
import { logModeration, validationError } from './shared'

/** Courses with their topics and question counts. Public. */
export async function listCourses() {
  await latency(200)
  const db = getDb()
  const counts = new Map()
  for (const q of db.questions) {
    counts.set(q.courseId, (counts.get(q.courseId) ?? 0) + 1)
    counts.set(q.topicId, (counts.get(q.topicId) ?? 0) + 1)
  }
  return [...db.courses]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((course) => ({
      ...course,
      questionCount: counts.get(course.id) ?? 0,
      topics: db.topics
        .filter((t) => t.courseId === course.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => ({ ...t, questionCount: counts.get(t.id) ?? 0 })),
    }))
}

function requireManager(action) {
  const user = requireUser()
  authorize(user, PERMISSIONS.CATEGORY_MANAGE, action)
  return user
}

function cleanCourse(input) {
  return { code: input.code.trim().toUpperCase(), title: input.title.trim(), department: input.department.trim() }
}

function assertUniqueCode(db, code, exceptId) {
  if (db.courses.some((c) => c.id !== exceptId && c.code.replace(/\s/g, '') === code.replace(/\s/g, '')))
    throw validationError({ code: 'A course with this code already exists.' })
}

export async function createCourse(input) {
  const user = requireManager('Create course')
  await latency()
  const errors = validateCourse(input)
  if (hasErrors(errors)) throw validationError(errors)
  const db = getDb()
  const course = { id: newId('c'), ...cleanCourse(input), createdAt: nowIso() }
  assertUniqueCode(db, course.code)
  db.courses.push(course)
  logModeration(db, user, { action: LOG_ACTIONS.COURSE_CREATED, targetType: 'course', targetId: course.id, summary: `${course.code} ${course.title}` })
  commit()
  return course
}

export async function updateCourse(id, input) {
  const user = requireManager('Update course')
  await latency()
  const errors = validateCourse(input)
  if (hasErrors(errors)) throw validationError(errors)
  const db = getDb()
  const course = db.courses.find((c) => c.id === id)
  if (!course) throw notFound('This course')
  const next = cleanCourse(input)
  assertUniqueCode(db, next.code, id)
  const before = `${course.code} ${course.title}`
  Object.assign(course, next)
  logModeration(db, user, { action: LOG_ACTIONS.COURSE_UPDATED, targetType: 'course', targetId: id, summary: `${before} → ${course.code} ${course.title}` })
  commit()
  return course
}

export async function deleteCourse(id) {
  const user = requireManager('Delete course')
  await latency()
  const db = getDb()
  const course = db.courses.find((c) => c.id === id)
  if (!course) throw notFound('This course')
  const count = db.questions.filter((q) => q.courseId === id).length
  if (count) throw new ApiError('CONFLICT', `${course.code} still has ${count} question${count === 1 ? '' : 's'}. Move or delete them before deleting the course.`)
  db.courses = db.courses.filter((c) => c.id !== id)
  db.topics = db.topics.filter((t) => t.courseId !== id)
  logModeration(db, user, { action: LOG_ACTIONS.COURSE_DELETED, targetType: 'course', targetId: id, summary: `${course.code} ${course.title}` })
  commit()
}

function assertUniqueTopic(db, courseId, name, exceptId) {
  if (db.topics.some((t) => t.courseId === courseId && t.id !== exceptId && t.name.toLowerCase() === name.toLowerCase()))
    throw validationError({ name: 'This course already has a topic with that name.' })
}

export async function createTopic(courseId, input) {
  const user = requireManager('Create topic')
  await latency()
  const errors = validateTopic(input)
  if (hasErrors(errors)) throw validationError(errors)
  const db = getDb()
  const course = db.courses.find((c) => c.id === courseId)
  if (!course) throw notFound('This course')
  const name = input.name.trim()
  assertUniqueTopic(db, courseId, name)
  const topic = { id: newId('t'), courseId, name, createdAt: nowIso() }
  db.topics.push(topic)
  logModeration(db, user, { action: LOG_ACTIONS.TOPIC_CREATED, targetType: 'topic', targetId: topic.id, summary: `${course.code} › ${name}` })
  commit()
  return topic
}

export async function updateTopic(id, input) {
  const user = requireManager('Update topic')
  await latency()
  const errors = validateTopic(input)
  if (hasErrors(errors)) throw validationError(errors)
  const db = getDb()
  const topic = db.topics.find((t) => t.id === id)
  if (!topic) throw notFound('This topic')
  const name = input.name.trim()
  assertUniqueTopic(db, topic.courseId, name, id)
  const course = db.courses.find((c) => c.id === topic.courseId)
  logModeration(db, user, { action: LOG_ACTIONS.TOPIC_UPDATED, targetType: 'topic', targetId: id, summary: `${course?.code} › ${topic.name} → ${name}` })
  topic.name = name
  commit()
  return topic
}

export async function deleteTopic(id) {
  const user = requireManager('Delete topic')
  await latency()
  const db = getDb()
  const topic = db.topics.find((t) => t.id === id)
  if (!topic) throw notFound('This topic')
  const count = db.questions.filter((q) => q.topicId === id).length
  if (count) throw new ApiError('CONFLICT', `"${topic.name}" still has ${count} question${count === 1 ? '' : 's'}. Move or delete them before deleting the topic.`)
  const course = db.courses.find((c) => c.id === topic.courseId)
  db.topics = db.topics.filter((t) => t.id !== id)
  logModeration(db, user, { action: LOG_ACTIONS.TOPIC_DELETED, targetType: 'topic', targetId: id, summary: `${course?.code} › ${topic.name}` })
  commit()
}
