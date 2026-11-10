#!/usr/bin/env node
/**
 * Seeds Supabase with the demo accounts and sample PeerPrep content.
 *
 *   npm run seed            # seed an empty project (skips if content exists)
 *   npm run seed -- --reset # delete all content and re-seed (accounts are kept)
 *
 * Needs SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in the environment
 * or in .env.seed.local. That key bypasses row-level security: keep it on this
 * machine and never prefix it with VITE_.
 */
import { createClient } from '@supabase/supabase-js'
import { randomBytes, randomUUID } from 'node:crypto'
import { createSeedData } from '../src/data/seed.js'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../src/services/mock/demoAccounts.js'

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SECRET_KEY. See .env.example.')
  process.exit(1)
}

const reset = process.argv.includes('--reset')
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

async function run(label, request) {
  const { data, error } = await request
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

const CONTENT_TABLES = ['verification_records', 'answers', 'questions', 'topics', 'courses', 'moderation_logs', 'access_logs']

const { count, error: countError } = await db.from('courses').select('id', { count: 'exact', head: true })
if (countError) {
  console.error(`Could not read the database (${countError.message}). Has the migration in supabase/migrations been applied?`)
  process.exit(1)
}
if (count && !reset) {
  console.log(`Content already exists (${count} courses). Use --reset to replace it.`)
  process.exit(0)
}
if (reset) {
  for (const table of CONTENT_TABLES) await run(`clear ${table}`, db.from(table).delete().not('id', 'is', null))
  console.log('Cleared existing content.')
}

const seed = createSeedData()
const demoEmails = new Set(DEMO_ACCOUNTS.map((a) => a.email))
const ids = new Map()
const idFor = (seedId) => {
  if (!ids.has(seedId)) ids.set(seedId, randomUUID())
  return ids.get(seedId)
}

// --- Accounts ---------------------------------------------------------------
const authUsers = []
for (let page = 1; ; page++) {
  const { users } = await run('list users', db.auth.admin.listUsers({ page, perPage: 200 }))
  authUsers.push(...users)
  if (users.length < 200) break
}

for (const user of seed.users) {
  let account = authUsers.find((u) => u.email === user.email)
  const isDemo = demoEmails.has(user.email)
  if (!account) {
    // Sample classmates get random passwords; only demo accounts are meant for sign-in.
    const password = isDemo ? DEMO_PASSWORD : randomBytes(18).toString('base64url')
    const created = await run(`create ${user.email}`, db.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: { first_name: user.firstName, last_name: user.lastName },
    }))
    account = created.user
    console.log(`Created ${isDemo ? 'demo' : 'sample'} account ${user.email}`)
  } else if (isDemo) {
    await run(`reset demo password ${user.email}`, db.auth.admin.updateUserById(account.id, { password: DEMO_PASSWORD, email_confirm: true }))
  }
  ids.set(user.id, account.id)
  await run(`profile ${user.email}`, db.from('profiles').update({
    first_name: user.firstName,
    last_name: user.lastName,
    role: user.role,
    is_demo: isDemo,
    created_at: user.createdAt,
  }).eq('id', account.id))
}

// --- Content ----------------------------------------------------------------
await run('courses', db.from('courses').insert(seed.courses.map((c) => ({
  id: idFor(c.id), code: c.code, title: c.title, department: c.department, created_at: c.createdAt,
}))))
await run('topics', db.from('topics').insert(seed.topics.map((t) => ({
  id: idFor(t.id), course_id: idFor(t.courseId), name: t.name, created_at: t.createdAt,
}))))

// Seeded attachments keep their inline data URL; user uploads live in Storage.
const attachments = (list) => list.map(({ fileName, mimeType, size, url: dataUrl, uploadedBy, uploadedAt }) => ({
  id: randomUUID(), fileName, mimeType, size, url: dataUrl, uploadedBy: idFor(uploadedBy), uploadedAt,
}))

await run('questions', db.from('questions').insert(seed.questions.map((q) => ({
  id: idFor(q.id), title: q.title, content: q.content, course_id: idFor(q.courseId), topic_id: idFor(q.topicId),
  difficulty: q.difficulty, author_id: idFor(q.authorId), attachments: attachments(q.attachments),
  created_at: q.createdAt, updated_at: q.updatedAt,
}))))
await run('answers', db.from('answers').insert(seed.answers.map((a) => ({
  id: idFor(a.id), question_id: idFor(a.questionId), author_id: idFor(a.authorId), content: a.content, attachments: [],
  verification_status: a.verificationStatus, verified_by: a.verifiedBy ? idFor(a.verifiedBy) : null, verified_at: a.verifiedAt,
  created_at: a.createdAt, updated_at: a.updatedAt,
}))))
await run('verification records', db.from('verification_records').insert(seed.verifications.map((v) => ({
  kind: v.kind, answer_id: idFor(v.answerId), question_id: idFor(v.questionId), reviewer_id: v.reviewerId ? idFor(v.reviewerId) : null,
  status: v.status, previous_status: v.previousStatus, is_override: v.isOverride, note: v.note, created_at: v.createdAt,
}))))
await run('moderation logs', db.from('moderation_logs').insert(seed.moderationLogs.map((l) => ({
  actor_id: idFor(l.actorId), action: l.action, target_type: l.targetType,
  target_id: ids.has(l.targetId) ? ids.get(l.targetId) : l.targetId, summary: l.summary, reason: l.reason, created_at: l.createdAt,
}))))
await run('access logs', db.from('access_logs').insert(seed.accessLogs.map((l) => ({
  user_id: l.userId ? idFor(l.userId) : null, action: l.action, resource: l.resource, created_at: l.createdAt,
}))))

console.log(`Seeded ${seed.courses.length} courses, ${seed.topics.length} topics, ${seed.questions.length} questions and ${seed.answers.length} answers.`)
console.log('Demo accounts:', DEMO_ACCOUNTS.map((a) => a.email).join(', '), `(password ${DEMO_PASSWORD})`)
