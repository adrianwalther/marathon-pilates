/**
 * Migrate clients from Arketa CSV export to Supabase profiles table.
 *
 *   node scripts/migrate-clients.mjs
 *
 * - Matches on email — skips existing clients
 * - Sets role = 'client' and intake_completed_at = null (will be prompted to onboard)
 * - Does NOT create auth accounts (clients will be invited at launch)
 */

import { createClient } from '/Users/adrianwalther/Desktop/_Projects/Marathon Pilates/Marathon Pilates Platform/src/web/node_modules/@supabase/supabase-js/dist/index.mjs'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vvqeacukwsvbgixabdef.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var'); process.exit(1) }
const CSV_PATH         = '/Users/adrianwalther/Downloads/Client_List.csv'
const BATCH_SIZE       = 50

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseRow(headers, values) {
  const row = {}
  headers.forEach((h, i) => { row[h] = values[i] ?? '' })
  return row
}

function mapToProfile(row) {
  const email = row['Client Email']?.toLowerCase().trim()
  if (!email || !email.includes('@')) return null

  return {
    id:         crypto.randomUUID(),
    email,
    first_name: row['First Name']?.trim() || '',
    last_name:  row['Last Name']?.trim() || '',
    phone:      row['Phone Number']?.trim() || null,
    date_of_birth: row['Birthday']?.trim() || null,
    address:    row['Address']?.trim() || null,
    role:       'client',
    migrated_from_arketa: true,
    arketa_first_seen: row['First Seen']?.trim() || null,
    marketing_email_opt_in: row['Marketing Email Opt-in'] === 'true',
    liability_waiver_signed: row['Agree to Liability Waiver'] === 'true',
  }
}

async function main() {
  console.log('Marathon Pilates — Client Migration from Arketa\n')

  // Load existing emails to avoid duplicates
  console.log('Loading existing profiles...')
  const { data: existing } = await supabase.from('profiles').select('email')
  const existingEmails = new Set((existing ?? []).map(p => p.email?.toLowerCase()))
  console.log(`  ${existingEmails.size} existing profiles found\n`)

  // Stream and parse CSV
  const rl = createInterface({ input: createReadStream(CSV_PATH), crlfDelay: Infinity })
  const lines = []
  for await (const line of rl) lines.push(line)

  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map(l => parseRow(headers, parseCSVLine(l)))

  const profiles = rows
    .map(mapToProfile)
    .filter(Boolean)
    .filter(p => !existingEmails.has(p.email))

  console.log(`Total rows in CSV:     ${rows.length}`)
  console.log(`Valid new profiles:    ${profiles.length}`)
  console.log(`Skipped (duplicates):  ${rows.length - profiles.length}\n`)

  if (profiles.length === 0) {
    console.log('Nothing to migrate.')
    return
  }

  // Insert in batches
  let inserted = 0
  let failed = 0

  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('profiles').insert(batch)
    if (error) {
      console.error(`  ✗ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`)
      failed += batch.length
    } else {
      inserted += batch.length
      process.stdout.write(`\r  Inserted ${inserted} / ${profiles.length}...`)
    }
  }

  console.log(`\n\n✓ Migration complete`)
  console.log(`  Inserted: ${inserted}`)
  console.log(`  Failed:   ${failed}`)
  console.log(`  Skipped:  ${rows.length - profiles.length} (already existed)`)
}

main().catch(console.error)
