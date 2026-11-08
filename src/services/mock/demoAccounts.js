import { ROLES } from '../../config/roles'

/**
 * PUBLIC demo credentials. They exist only in demo mode, are published on the
 * login page, and must never be used as real accounts.
 */
export const DEMO_PASSWORD = 'Demo123!'

export const DEMO_ACCOUNTS = [
  {
    key: 'student',
    email: 'student@peerprep.demo',
    role: ROLES.STUDENT,
    name: 'Aaliyah Campbell',
    summary: 'Upload questions, post answers and track verification.',
  },
  {
    key: 'lecturer',
    email: 'lecturer@peerprep.demo',
    role: ROLES.LECTURER,
    name: 'Dr. Marcus Reid',
    summary: 'Review answers and mark them correct or incorrect.',
  },
  {
    key: 'admin',
    email: 'admin@peerprep.demo',
    role: ROLES.STUDENT_ADMIN,
    name: 'Kemar Thompson',
    summary: 'Moderate content, manage categories, roles and logs.',
  },
]

export function isDemoEmail(email) {
  return DEMO_ACCOUNTS.some((a) => a.email === email.trim().toLowerCase())
}
