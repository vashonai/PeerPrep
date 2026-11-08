/**
 * Single entry point for all data access. Components and hooks import from
 * here only.
 *
 * Every function is async and returns plain JSON-shaped objects, matching the
 * REST endpoints listed beside each module. To connect the real backend,
 * replace these imports with HTTP implementations exposing the same function
 * names; no UI code needs to change.
 */

export * as authApi from './mock/auth' //            POST /auth/login, /auth/register, /auth/logout · GET /auth/session
export * as questionsApi from './mock/questions' //  GET|POST /questions · GET|PATCH|DELETE /questions/:id
export * as answersApi from './mock/answers' //      GET|POST /questions/:id/answers · PATCH|DELETE /answers/:id
export * as verificationApi from './mock/verification' // GET /verification/queue · POST /answers/:id/verification
export * as categoriesApi from './mock/categories' // /courses, /courses/:id/topics
export * as adminApi from './mock/admin' //          /admin/users, /admin/logs, /admin/moderation
export { DEMO_ACCOUNTS, DEMO_PASSWORD } from './mock/demoAccounts'
export { ApiError, errorMessage } from './errors'
