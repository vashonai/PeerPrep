import { DIFFICULTIES, LIMITS } from '../data/models'

/**
 * Validators shared by forms (instant feedback) and the service layer
 * (authoritative check). Each returns an object of field → message; an empty
 * object means the input is valid.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const hasErrors = (errors) => Object.keys(errors).length > 0

function lengthError(value, { min, max }, label) {
  const length = value.trim().length
  if (length === 0) return `${label} is required.`
  if (length < min) return `${label} must be at least ${min} characters.`
  if (length > max) return `${label} must be ${max} characters or fewer.`
  return null
}

function assign(errors, field, message) {
  if (message) errors[field] = message
}

export function validateLogin({ email = '', password = '' }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Email address is required.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Password is required.'
  return errors
}

export function validateRegistration({ firstName = '', lastName = '', email = '', password = '', confirmPassword = '' }) {
  const errors = {}
  if (!firstName.trim()) errors.firstName = 'First name is required.'
  else if (firstName.trim().length > 50) errors.firstName = 'First name must be 50 characters or fewer.'
  if (!lastName.trim()) errors.lastName = 'Last name is required.'
  else if (lastName.trim().length > 50) errors.lastName = 'Last name must be 50 characters or fewer.'
  if (!email.trim()) errors.email = 'Email address is required.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Password is required.'
  else if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
    errors.password = 'Use at least 8 characters, including a letter and a number.'
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.'
  else if (password && confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.'
  return errors
}

export function passwordStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return Math.min(4, score)
}

export function validateQuestion({ title = '', content = '', courseId = '', topicId = '', difficulty = '' }, { courses, topics }) {
  const errors = {}
  assign(errors, 'title', lengthError(title, LIMITS.questionTitle, 'Title'))
  assign(errors, 'content', lengthError(content, LIMITS.questionContent, 'Question content'))
  if (!courseId) errors.courseId = 'Select a course.'
  else if (!courses.some((c) => c.id === courseId)) errors.courseId = 'The selected course no longer exists.'
  if (!topicId) errors.topicId = 'Select a topic.'
  else if (!topics.some((t) => t.id === topicId && t.courseId === courseId))
    errors.topicId = 'The selected topic does not belong to this course.'
  if (!DIFFICULTIES.includes(difficulty)) errors.difficulty = 'Select a difficulty level.'
  return errors
}

export function validateAnswer({ content = '' }) {
  const errors = {}
  assign(errors, 'content', lengthError(content, LIMITS.answerContent, 'Answer'))
  return errors
}

export function validateCourse({ code = '', title = '', department = '' }) {
  const errors = {}
  if (!code.trim()) errors.code = 'Course code is required.'
  else if (code.trim().length > 20) errors.code = 'Course code must be 20 characters or fewer.'
  if (!title.trim()) errors.title = 'Course title is required.'
  else if (title.trim().length > 100) errors.title = 'Course title must be 100 characters or fewer.'
  if (!department.trim()) errors.department = 'Department is required.'
  return errors
}

export function validateTopic({ name = '' }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Topic name is required.'
  else if (name.trim().length > 60) errors.name = 'Topic name must be 60 characters or fewer.'
  return errors
}
