/**
 * Central role and permission definitions.
 *
 * The project documents use "Admin", "Administrator", "Moderator" and
 * "StudentAdmin" interchangeably; all of them map to ROLES.STUDENT_ADMIN.
 *
 * Every permission check in the app — navigation, route guards, UI controls
 * and the (mock) server — reads from this one table. UI checks only improve
 * the experience; the service layer re-checks each operation.
 */

export const ROLES = Object.freeze({
  STUDENT: 'Student',
  LECTURER: 'Lecturer',
  STUDENT_ADMIN: 'StudentAdmin',
})

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.LECTURER]: 'Lecturer',
  [ROLES.STUDENT_ADMIN]: 'Student Administrator',
}

export const PERMISSIONS = Object.freeze({
  QUESTION_CREATE: 'question:create',
  ANSWER_CREATE: 'answer:create',
  CONTENT_EDIT_OWN: 'content:edit-own',
  ANSWER_VERIFY: 'answer:verify',
  VERIFICATION_OVERRIDE: 'verification:override',
  CONTENT_MODERATE: 'content:moderate',
  CATEGORY_MANAGE: 'category:manage',
  ROLE_MANAGE: 'role:manage',
  LOGS_VIEW: 'logs:view',
})

const P = PERMISSIONS

const ROLE_PERMISSIONS = {
  [ROLES.STUDENT]: [P.QUESTION_CREATE, P.ANSWER_CREATE, P.CONTENT_EDIT_OWN],
  [ROLES.LECTURER]: [P.ANSWER_VERIFY, P.VERIFICATION_OVERRIDE],
  [ROLES.STUDENT_ADMIN]: Object.values(P),
}

export function can(user, permission) {
  if (!user) return false
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
}

/** Where each role lands after signing in. */
export function homePathFor(user) {
  switch (user?.role) {
    case ROLES.LECTURER:
      return '/review'
    case ROLES.STUDENT_ADMIN:
      return '/admin'
    default:
      return '/dashboard'
  }
}
