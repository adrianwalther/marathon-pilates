import { createClient } from '@supabase/supabase-js'

const STAFF_ROLES = ['owner', 'admin', 'manager']

function authSupabase(req: Request) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
  )
}

function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireStaff(req: Request) {
  const { data: { user } } = await authSupabase(req).auth.getUser()
  if (!user) return null
  const { data: prof } = await serviceSupabase()
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!prof || !STAFF_ROLES.includes(prof.role)) return null
  return user
}

// GET /api/admin/amenity-rules — returns all amenity rules
export async function GET(req: Request) {
  const user = await requireStaff(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await serviceSupabase()
    .from('amenity_rules')
    .select('*')
    .order('session_type')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ rules: data })
}

// PATCH /api/admin/amenity-rules — update a single rule by session_type
// Body: { session_type, ...fields to update }
export async function PATCH(req: Request) {
  const user = await requireStaff(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { session_type, ...fields } = body

  if (!session_type) return Response.json({ error: 'Missing session_type' }, { status: 400 })

  // Only allow updating safe fields — never let the client set id or created_at
  const allowed = [
    'display_name',
    'open_time',
    'close_time',
    'slot_duration_minutes',
    'session_duration_minutes',
    'max_capacity',
    'advance_cutoff_hours',
    'is_active',
  ]
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key]
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await serviceSupabase()
    .from('amenity_rules')
    .update(update)
    .eq('session_type', session_type)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ rule: data })
}
