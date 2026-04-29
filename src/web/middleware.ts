import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_ROLES = ['admin', 'manager', 'instructor', 'front_desk']

// Beta gate password — override via BETA_PASSWORD env var in Vercel.
// Remove BETA_PASSWORD env var entirely to disable the gate at launch.
const BETA_PASSWORD = process.env.BETA_PASSWORD ?? 'marathon2026beta'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Beta gate ──────────────────────────────────────────────────────────────
  // Active whenever BETA_PASSWORD env var is set (or the default above is used).
  // Bypassed only for the gate page itself and its API route.
  const isBetaRoute =
    pathname.startsWith('/beta-gate') || pathname.startsWith('/api/beta-gate')

  if (!isBetaRoute) {
    const betaCookie = request.cookies.get('mp_beta')
    if (!betaCookie || betaCookie.value !== BETA_PASSWORD) {
      const gateUrl = new URL('/beta-gate', request.url)
      gateUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(gateUrl)
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role in profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Protect /dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  // Run on every route except Next.js internals and static assets.
  // The existing /admin and /dashboard auth guards are preserved below.
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|otf|mp4|webm)$).*)'],
}
