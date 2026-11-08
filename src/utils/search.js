/**
 * Lightweight keyword relevance scoring for the prototype. The backend will
 * replace this with indexed full-text search.
 */

const STOP_WORDS = new Set(['a', 'an', 'and', 'the', 'of', 'to', 'in', 'on', 'for', 'is', 'how', 'what', 'why', 'with', 'by', 'from', 'do', 'does'])

export function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

const countHits = (haystack, token) => haystack.split(token).length - 1

/** Returns 0 when not every token matches somewhere; higher is more relevant. */
export function relevanceScore(tokens, { title, content, courseText, topicText, answerText }) {
  const fields = [
    [title.toLowerCase(), 6],
    [topicText.toLowerCase(), 4],
    [courseText.toLowerCase(), 3],
    [content.toLowerCase(), 1],
    [answerText.toLowerCase(), 0.5],
  ]
  let score = 0
  for (const token of tokens) {
    let tokenScore = 0
    for (const [text, weight] of fields) tokenScore += Math.min(countHits(text, token), 3) * weight
    if (tokenScore === 0) return 0
    score += tokenScore
  }
  return score
}
