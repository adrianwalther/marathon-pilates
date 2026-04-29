import { NextResponse } from 'next/server'

const BETA_PASSWORD = process.env.BETA_PASSWORD ?? 'marathon2026beta'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function POST(req: Request) {
  const { password } = await req.json()

  if (!password || password !== BETA_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('mp_beta', BETA_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}
