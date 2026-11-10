/**
 * Shared domain constants and model shapes.
 *
 * These typedefs mirror the tables a backend would hold. IDs are opaque
 * strings and all timestamps are ISO-8601 strings.
 *
 * @typedef {Object} User
 * @property {string} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {'Student'|'Lecturer'|'StudentAdmin'} role
 * @property {boolean} [isDemo]   Public demo account (demo mode only).
 * @property {string} createdAt
 *
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} code
 * @property {string} title
 * @property {string} department
 * @property {string} createdAt
 *
 * @typedef {Object} Topic
 * @property {string} id
 * @property {string} courseId    FK → Course.id
 * @property {string} name
 * @property {string} createdAt
 *
 * @typedef {Object} Attachment
 * @property {string} id
 * @property {string} fileName
 * @property {string} mimeType   application/pdf | image/png | image/jpeg
 * @property {number} size       Bytes.
 * @property {string|null} url   Object-storage URL in production; a data URL in the prototype.
 * @property {string} uploadedBy FK → User.id
 * @property {string} uploadedAt
 *
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {string} courseId   FK → Course.id
 * @property {string} topicId    FK → Topic.id (must belong to courseId)
 * @property {'Easy'|'Medium'|'Hard'} difficulty
 * @property {string} authorId   FK → User.id
 * @property {Attachment[]} attachments
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} Answer
 * @property {string} id
 * @property {string} questionId FK → Question.id
 * @property {string} authorId   FK → User.id
 * @property {string} content
 * @property {Attachment[]} attachments
 * @property {'Unverified'|'VerifiedCorrect'|'VerifiedIncorrect'} verificationStatus  Current status (denormalised from the latest VerificationRecord).
 * @property {string|null} verifiedBy FK → User.id
 * @property {string|null} verifiedAt
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} VerificationRecord  Append-only history, kept apart from the answer.
 * @property {string} id
 * @property {'review'|'reset'} kind  'reset' = status cleared automatically because the author edited the answer.
 * @property {string} answerId
 * @property {string} questionId
 * @property {string|null} reviewerId
 * @property {'Unverified'|'VerifiedCorrect'|'VerifiedIncorrect'} status
 * @property {'Unverified'|'VerifiedCorrect'|'VerifiedIncorrect'} previousStatus
 * @property {boolean} isOverride
 * @property {string} note
 * @property {string} createdAt
 *
 * @typedef {Object} ModerationLog
 * @property {string} id
 * @property {string} actorId
 * @property {string} action       One of LOG_ACTIONS.
 * @property {string} targetType   'question' | 'answer' | 'course' | 'topic' | 'user'
 * @property {string} targetId
 * @property {string} summary      Human-readable snapshot (survives deletion of the target).
 * @property {string} reason
 * @property {string} createdAt
 *
 * @typedef {Object} AccessLog   Unauthorized-access attempt.
 * @property {string} id
 * @property {string|null} userId
 * @property {string} action
 * @property {string} resource
 * @property {string} createdAt
 */

export const VERIFICATION_STATUS = Object.freeze({
  UNVERIFIED: 'Unverified',
  CORRECT: 'VerifiedCorrect',
  INCORRECT: 'VerifiedIncorrect',
})

export const VERIFICATION_LABELS = {
  [VERIFICATION_STATUS.UNVERIFIED]: 'Unverified',
  [VERIFICATION_STATUS.CORRECT]: 'Verified Correct',
  [VERIFICATION_STATUS.INCORRECT]: 'Verified Incorrect',
}

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export const LOG_ACTIONS = Object.freeze({
  QUESTION_DELETED: 'QuestionDeleted',
  ANSWER_DELETED: 'AnswerDeleted',
  COURSE_CREATED: 'CourseCreated',
  COURSE_UPDATED: 'CourseUpdated',
  COURSE_DELETED: 'CourseDeleted',
  TOPIC_CREATED: 'TopicCreated',
  TOPIC_UPDATED: 'TopicUpdated',
  TOPIC_DELETED: 'TopicDeleted',
  ROLE_CHANGED: 'RoleChanged',
})

export const LOG_ACTION_LABELS = {
  QuestionDeleted: 'Deleted question',
  AnswerDeleted: 'Deleted answer',
  CourseCreated: 'Created course',
  CourseUpdated: 'Updated course',
  CourseDeleted: 'Deleted course',
  TopicCreated: 'Created topic',
  TopicUpdated: 'Updated topic',
  TopicDeleted: 'Deleted topic',
  RoleChanged: 'Changed role',
}

export const ATTACHMENT_RULES = Object.freeze({
  mimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
  extensions: ['pdf', 'png', 'jpg', 'jpeg'],
  // Matches the Supabase bucket limit. The offline prototype stores files in
  // localStorage, so large files there may hit the browser's storage quota.
  maxBytes: 5 * 1024 * 1024,
  maxFiles: 3,
})

export const LIMITS = Object.freeze({
  questionTitle: { min: 10, max: 150 },
  questionContent: { min: 20, max: 5000 },
  answerContent: { min: 10, max: 5000 },
})
