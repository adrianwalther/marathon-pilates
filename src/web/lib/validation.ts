// Small request-validation helpers shared across API routes.

// Matches a canonical UUID (any version). Use to reject malformed ids before
// they reach Postgres, so a bad request returns a clean 400 instead of a
// generic 500 from the database.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}
