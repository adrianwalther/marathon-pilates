import { createClient } from '@supabase/supabase-js'
import { isUuid } from '@/lib/validation'

const STAFF_ROLES = ['owner', 'admin', 'manager']

// POST /api/admin/credits
// Body: { client_id, credit_type, total_credits, expires_at? }
// Grants credits to a client from an admin action.

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { client_id, credit_type, total_credits, expires_at } = body

    if (!client_id || !credit_type || !total_credits) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!isUuid(client_id)) {
      return Response.json({ error: 'Invalid client_id' }, { status: 400 })
    }
    const validTypes = ['group', 'amenity', 'private']
    if (!validTypes.includes(credit_type)) {
      return Response.json({ error: 'Invalid credit_type' }, { status: 400 })
    }
    const qty = parseInt(total_credits)
    if (!qty || qty < 1 || qty > 100) {
      return Response.json({ error: 'Quantity must be between 1 and 100' }, { status: 400 })
    }

    // Verify the caller is authenticated staff
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!prof || !STAFF_ROLES.includes(prof.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('credits')
      .insert({
        client_id,
        credit_type,
        total_credits: qty,
        used_credits: 0,
        source: 'admin_grant',
        expires_at: expires_at || null,
      })
      .select()
      .single()

    if (error) throw error
    return Response.json({ credit: data })
  } catch (err: unknown) {
    console.error('[admin/credits] error:', err)
    return Response.json({ error: 'Could not grant credits' }, { status: 500 })
  }
}
