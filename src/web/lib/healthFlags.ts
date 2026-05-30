// Safety-critical guardrail for AI-generated trainer health flags.
//
// Marathon Pilates must NOT surface medical advice/restrictions — only restate
// the body-areas/conditions a client mentioned. This composes the final flag
// list from the prenatal flag + the model's raw output, dropping anything
// advice-like, over-long, non-string, or duplicate, and caps the count.
//
// Kept pure + isolated from the route so it can be unit-tested (the route does
// the model call + JSON.parse, then hands the parsed value here).

// A flag is rejected if it contains any of these advice/restriction words.
export const ADVICE_RE = /\b(avoid|no |don't|do not|limit|restrict|caution|careful|should)\b/i

export const MAX_FLAGS = 6

export function composeHealthFlags(prenatal: boolean, parsed: unknown): string[] {
  const flags: string[] = []
  if (prenatal) flags.push('Prenatal')
  if (Array.isArray(parsed)) {
    for (const f of parsed) {
      if (typeof f !== 'string') continue
      const flag = f.trim()
      if (!flag || flag.length > 40) continue // drop empty / over-long
      if (ADVICE_RE.test(flag)) continue // drop advice-like phrasing
      if (!flags.includes(flag)) flags.push(flag) // dedupe
    }
  }
  return flags.slice(0, MAX_FLAGS)
}
