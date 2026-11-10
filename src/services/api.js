/**
 * Single entry point for all data access. Components and hooks import from
 * here only.
 *
 * Both implementations expose the same async functions and return the same
 * JSON shapes. Supabase is used when VITE_SUPABASE_URL is configured;
 * otherwise the offline prototype runs against the in-browser mock server.
 */
import { DATA_SOURCE } from '../config/env'
import * as mockAdmin from './mock/admin'
import * as mockAnswers from './mock/answers'
import * as mockAuth from './mock/auth'
import * as mockCategories from './mock/categories'
import * as mockQuestions from './mock/questions'
import * as mockVerification from './mock/verification'
import * as supabaseAdmin from './supabase/admin'
import * as supabaseAnswers from './supabase/answers'
import * as supabaseAuth from './supabase/auth'
import * as supabaseCategories from './supabase/categories'
import * as supabaseQuestions from './supabase/questions'
import * as supabaseVerification from './supabase/verification'

const live = DATA_SOURCE === 'supabase'

export const authApi = live ? supabaseAuth : mockAuth
export const questionsApi = live ? supabaseQuestions : mockQuestions
export const answersApi = live ? supabaseAnswers : mockAnswers
export const verificationApi = live ? supabaseVerification : mockVerification
export const categoriesApi = live ? supabaseCategories : mockCategories
export const adminApi = live ? supabaseAdmin : mockAdmin

export { DEMO_ACCOUNTS, DEMO_PASSWORD } from './mock/demoAccounts'
export { ApiError, errorMessage } from './errors'
