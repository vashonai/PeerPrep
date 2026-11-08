/** Error shape returned by every service call, mirroring a JSON API error body. */
export class ApiError extends Error {
  /**
   * @param {'VALIDATION'|'UNAUTHENTICATED'|'FORBIDDEN'|'NOT_FOUND'|'CONFLICT'|'INVALID_CREDENTIALS'|'STORAGE_FULL'|'NETWORK'} code
   * @param {string} message
   * @param {Record<string, string>} [fieldErrors]
   */
  constructor(code, message, fieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export function errorMessage(error) {
  if (error instanceof ApiError) return error.message
  return 'Something went wrong. Please try again.'
}
