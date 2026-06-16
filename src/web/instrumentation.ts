// Next.js instrumentation hook — runs ONCE when the server starts (each cold
// start / deploy). We use it to surface missing required environment variables
// loudly in the logs, so a misconfigured deploy (e.g. STRIPE_SECRET_KEY not set)
// is obvious immediately instead of showing up later as a cryptic runtime 500.
export async function register() {
  const { getMissingEnv } = await import('./lib/env')
  const missing = getMissingEnv()
  const groups = Object.keys(missing)

  if (groups.length === 0) {
    console.log('[env] ✓ all required environment variables present')
    return
  }

  const detail = Object.entries(missing)
    .map(([group, vars]) => `  • ${group}: ${vars.join(', ')}`)
    .join('\n')

  console.error(
    '\n========================================================\n' +
    '⚠️  MISSING REQUIRED ENVIRONMENT VARIABLES\n' +
    'These features will fail until the variables are set:\n' +
    detail +
    '\nSet them in the hosting environment (Vercel → Settings → Environment\n' +
    'Variables) and redeploy. See .env.example for the full list.\n' +
    '========================================================\n'
  )
}
