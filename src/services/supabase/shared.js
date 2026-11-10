import { SESSION_TIMEOUT_MS } from '../../config/env'
import { can } from '../../config/roles'
import { fileExtension, isDraftAttachment } from '../../utils/files'
import { ApiError } from '../errors'
import { ATTACHMENT_BUCKET, supabase } from './client'

/** Helpers shared by the Supabase service modules: errors, session, mapping, storage. */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value)

// --- Errors -----------------------------------------------------------------

/**
 * Maps PostgREST / Postgres errors to ApiError. `context` supplies friendlier
 * messages for constraint violations specific to the caller.
 */
export function toApiError(error, context = {}) {
  if (error instanceof ApiError) return error
  const code = error?.code
  if (code === '23505') return new ApiError('VALIDATION', 'Please correct the highlighted fields.', context.unique ?? {})
  if (code === '23503') return context.foreignKey ?? new ApiError('CONFLICT', 'This item is linked to other records and cannot be changed.')
  if (['23514', '23502', '22023', '22P02', '22001'].includes(code)) return new ApiError('VALIDATION', context.invalid ?? 'Some of the information provided is invalid.')
  if (code === '42501' || error?.status === 401 || error?.status === 403) return new ApiError('FORBIDDEN', 'You do not have permission to perform this action.')
  if (/fetch|network/i.test(error?.message ?? '')) return new ApiError('NETWORK', 'Could not reach PeerPrep. Check your connection and try again.')
  return new ApiError('NETWORK', 'Something went wrong while talking to the server. Please try again.')
}

export async function unwrap(request, context) {
  const { data, error } = await request
  if (error) throw toApiError(error, context)
  return data
}

/** Calls an RPC that returns `{ ok, ... }` or `{ error, message }`. */
export async function rpc(name, args) {
  const data = await unwrap(supabase().rpc(name, args))
  if (data?.error) throw new ApiError(data.error, data.message)
  return data
}

export const notFound = (what) => new ApiError('NOT_FOUND', `${what} could not be found. It may have been removed.`)

// --- Session ----------------------------------------------------------------

const ACTIVITY_KEY = 'peerprep.lastActivity'
const PROFILE_TTL_MS = 15_000
let profileCache = null

export function markActivity() {
  sessionStorage.setItem(ACTIVITY_KEY, String(Date.now()))
}

export function clearSessionState() {
  sessionStorage.removeItem(ACTIVITY_KEY)
  profileCache = null
}

/**
 * The signed-in user's profile, or null. Enforces the 60-minute inactivity
 * timeout on the client; Supabase's own inactivity timeout (a paid-plan
 * setting) should also be enabled to enforce it server-side.
 */
export async function currentUser({ fresh = false } = {}) {
  const { data } = await supabase().auth.getSession()
  const session = data.session
  if (!session) {
    profileCache = null
    return null
  }

  const last = Number(sessionStorage.getItem(ACTIVITY_KEY) || 0)
  if (last && Date.now() - last > SESSION_TIMEOUT_MS) {
    await supabase().auth.signOut()
    clearSessionState()
    return null
  }
  if (!last) markActivity()

  if (!fresh && profileCache?.id === session.user.id && Date.now() - profileCache.at < PROFILE_TTL_MS) return profileCache.user

  const profile = await unwrap(supabase().from('profiles').select('id, first_name, last_name, role, is_demo').eq('id', session.user.id).maybeSingle())
  if (!profile) return null
  const user = {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: session.user.email,
    role: profile.role,
    isDemo: profile.is_demo,
  }
  profileCache = { id: user.id, user, at: Date.now() }
  return user
}

export async function requireUser() {
  const user = await currentUser()
  if (!user) throw new ApiError('UNAUTHENTICATED', 'Your session has ended. Please sign in again.')
  markActivity()
  return user
}

/**
 * Early permission check that also records the attempt. The database enforces
 * the same rule independently through RLS and RPC checks.
 */
export async function authorize(user, permission, resource) {
  if (can(user, permission)) return
  await supabase().rpc('log_access_denied', { p_resource: resource, p_action: permission })
  throw new ApiError('FORBIDDEN', 'You do not have permission to perform this action.')
}

// --- Mapping ----------------------------------------------------------------

function publicUrl(path) {
  return supabase().storage.from(ATTACHMENT_BUCKET).getPublicUrl(path).data.publicUrl
}

export function mapAttachments(list = []) {
  return list.map((a) => ({ ...a, url: a.url ?? (a.path ? publicUrl(a.path) : null) }))
}

export function mapQuestion(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    courseId: row.course_id,
    topicId: row.topic_id,
    difficulty: row.difficulty,
    authorId: row.author_id,
    attachments: mapAttachments(row.attachments),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    course: row.course,
    topic: row.topic,
    author: row.author,
    answerCount: row.answer_count,
    verifiedAnswerCount: row.verified_answer_count,
  }
}

export function mapAnswer(row) {
  return {
    id: row.id,
    questionId: row.question_id,
    authorId: row.author_id,
    content: row.content,
    attachments: mapAttachments(row.attachments),
    verificationStatus: row.verification_status,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: row.author,
    reviewer: row.reviewer,
    verificationHistory: row.verification_history ?? [],
    question: row.question,
  }
}

// --- Attachments ------------------------------------------------------------

/** Stored metadata only: drops preview URLs and File objects. */
const toStored = ({ id, fileName, mimeType, size, path, url, uploadedBy, uploadedAt }) =>
  path ? { id, fileName, mimeType, size, path, uploadedBy, uploadedAt } : { id, fileName, mimeType, size, url, uploadedBy, uploadedAt }

/**
 * Uploads new attachments to `<user id>/<uuid>.<ext>` and returns the metadata
 * list to store, plus the uploaded paths so the caller can roll back.
 */
export async function uploadAttachments(attachments = [], user) {
  const stored = []
  const uploaded = []
  try {
    for (const attachment of attachments) {
      if (!isDraftAttachment(attachment)) {
        stored.push(toStored(attachment))
        continue
      }
      const path = `${user.id}/${crypto.randomUUID()}.${fileExtension(attachment.fileName)}`
      const { error } = await supabase().storage.from(ATTACHMENT_BUCKET).upload(path, attachment.file, { contentType: attachment.mimeType, upsert: false })
      if (error) throw new ApiError('VALIDATION', `"${attachment.fileName}" could not be uploaded. Only PDF, JPG and PNG files up to 5 MB are allowed.`, { attachments: 'An attachment could not be uploaded.' })
      uploaded.push(path)
      stored.push({ id: crypto.randomUUID(), fileName: attachment.fileName.slice(0, 120), mimeType: attachment.mimeType, size: attachment.size, path, uploadedBy: user.id, uploadedAt: new Date().toISOString() })
    }
  } catch (error) {
    await removeFiles(uploaded)
    throw error
  }
  return { stored, uploaded }
}

/** Best-effort removal; storage policies limit this to owners and admins. */
export async function removeFiles(paths = []) {
  const list = paths.filter(Boolean)
  if (list.length) await supabase().storage.from(ATTACHMENT_BUCKET).remove(list)
}

export const pathsOf = (attachments = []) => attachments.map((a) => a.path).filter(Boolean)
