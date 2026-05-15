// In-memory rate limiter. Resets on each cold start (acceptable for
// a single-barbershop app on Vercel's function instances).

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }

  if (entry.count >= limit) return false // blocked

  entry.count++
  return true // allowed
}
