/**
 * Upload compressed on-demand videos to Bunny.net Stream
 * and update the on_demand_classes table with video URLs.
 *
 *   node scripts/upload-bunny.mjs
 */

import { createClient } from '/Users/adrianwalther/Desktop/Marathon Pilates Platform/src/web/node_modules/@supabase/supabase-js/dist/index.mjs'
import { createReadStream, statSync, existsSync } from 'fs'

const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID ?? '620844'
const BUNNY_API_KEY    = process.env.BUNNY_API_KEY
const BUNNY_CDN_HOST   = process.env.BUNNY_CDN_HOST ?? 'vz-79f68a3f-815.b-cdn.net'
const BUNNY_API        = 'https://video.bunnycdn.com/library'

if (!BUNNY_API_KEY) { console.error('Missing BUNNY_API_KEY env var'); process.exit(1) }

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vvqeacukwsvbgixabdef.supabase.co'
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var'); process.exit(1) }
const COMPRESSED_DIR    = '/tmp/marathon-compressed'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Maps compressed filename → DB title + instructor_name
const VIDEOS = [
  { file: 'AMY_BARRELESS_BARRE.mp4',          title: 'Barreless Barre',                      instructor: 'Amy' },
  { file: 'AMY_EXPRESS_BARRE.mp4',             title: 'Express Barre',                        instructor: 'Amy' },
  { file: 'AMY_PILATES_HIIT.mp4',              title: 'Pilates HIIT',                         instructor: 'Amy' },
  { file: 'HELEN_LENGTHENING_STRENGTHENING.mp4', title: 'Lengthening & Strengthening',        instructor: 'Helen' },
  { file: 'HELEN_LOWER_BODY_BALL_BAND.mp4',    title: 'Lower Body Ball & Band',               instructor: 'Helen' },
  { file: 'HELEN_LOWER_BODY_BURN.mp4',         title: 'Lower Body Burn Circuit',              instructor: 'Helen' },
  { file: 'HELEN_QUICK_ARMS_BACK_ABS.mp4',     title: 'Quick Arms, Back & Abs',               instructor: 'Helen' },
  { file: 'LISA_MOVEMENT_ABCS.mp4',            title: 'The Movement ABCs',                    instructor: 'Lisa' },
  { file: 'LIZA_10MIN_ARMS.mp4',               title: '10-Minute Arms',                       instructor: 'Liza' },
  { file: 'LIZA_15MIN_ABS.mp4',                title: '15-Minute Abs Series',                 instructor: 'Liza' },
  { file: 'LIZA_30MIN_SIDE_LYING.mp4',         title: '30-Minute Side Lying Series',          instructor: 'Liza' },
  { file: 'LIZA_PILATES_BURN.mp4',             title: 'Pilates Burn',                         instructor: 'Liza' },
  { file: 'LIZA_SHORT_STRETCH.mp4',            title: 'Short Stretch Series',                 instructor: 'Liza' },
  { file: 'MADISON_ADVANCED_CORECENTRIC.mp4',  title: 'Advanced CoreCentric',                 instructor: 'Madison' },
  { file: 'MADISON_BEGINNER_CORECENTRIC.mp4',  title: 'Beginner CoreCentric',                 instructor: 'Madison' },
  { file: 'MARCELA_PRINCIPLES_OF_PILATES.mp4', title: 'The Principles of Pilates',            instructor: 'Marcela' },
  { file: 'RILEY_FULL_BODY.mp4',               title: 'Full Body Mat',                        instructor: 'Riley' },
  { file: 'SIRKKA_MORNING_WAKE_UP.mp4',        title: 'Morning Wake Up, Stretch & Mobilize',  instructor: 'Sirkka' },
  { file: 'SYDNEY_AAA.mp4',                    title: 'AAA',                                  instructor: 'Sydney' },
  { file: 'SYDNEY_ABA.mp4',                    title: 'ABA',                                  instructor: 'Sydney' },
  { file: 'SYDNEY_CORECENTRIC.mp4',            title: 'CoreCentric with Sydney',              instructor: 'Sydney' },
  { file: 'SYDNEY_GLUTES_ABS_FLOW.mp4',        title: 'Glutes & Abs Flow',                    instructor: 'Sydney' },
  { file: 'SYDNEY_FOAM_ROLLER_STRETCH.mp4',    title: 'Stretching with the Foam Roller',      instructor: 'Sydney' },
]

// ─── Bunny: create video entry ───────────────────────────────────────────────
async function createBunnyVideo(title) {
  const res = await fetch(`${BUNNY_API}/${BUNNY_LIBRARY_ID}/videos`, {
    method: 'POST',
    headers: {
      'AccessKey': BUNNY_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error(`Create video failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.guid
}

// ─── Bunny: upload file ──────────────────────────────────────────────────────
async function uploadToBunny(guid, filePath) {
  const stats = statSync(filePath)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(0)
  console.log(`  Uploading ${sizeMB} MB to Bunny.net...`)

  const stream = createReadStream(filePath)
  const res = await fetch(`${BUNNY_API}/${BUNNY_LIBRARY_ID}/videos/${guid}`, {
    method: 'PUT',
    headers: {
      'AccessKey': BUNNY_API_KEY,
      'Content-Type': 'application/octet-stream',
    },
    body: stream,
    duplex: 'half',
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`)
}

// ─── DB: update video URL + publish ─────────────────────────────────────────
async function publishClass(title, instructor, videoUrl) {
  const { error } = await supabase
    .from('on_demand_classes')
    .update({
      video_url: videoUrl,
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq('title', title)
    .eq('instructor_name', instructor)

  if (error) throw new Error(`DB update failed: ${error.message}`)
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Marathon Pilates — Bunny.net Stream Upload\n')
  console.log(`Library: ${BUNNY_LIBRARY_ID} | CDN: ${BUNNY_CDN_HOST}\n`)

  let done = 0
  let failed = 0

  for (const v of VIDEOS) {
    const filePath = `${COMPRESSED_DIR}/${v.file}`
    console.log(`[${v.instructor}] ${v.title}`)

    if (!existsSync(filePath)) {
      console.log(`  ⚠ File not found: ${v.file} — skipping\n`)
      failed++
      continue
    }

    try {
      // 1. Create video entry in Bunny
      const guid = await createBunnyVideo(`${v.instructor} — ${v.title}`)
      console.log(`  ✓ Created video: ${guid}`)

      // 2. Upload the file
      await uploadToBunny(guid, filePath)
      console.log(`  ✓ Uploaded`)

      // 3. Build CDN URL and publish in DB
      const videoUrl = `https://${BUNNY_CDN_HOST}/${guid}/play_720p.mp4`
      await publishClass(v.title, v.instructor, videoUrl)
      console.log(`  ✓ Published → ${videoUrl}`)
      done++
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`)
      failed++
    }

    console.log('')
  }

  console.log(`\nComplete. Published: ${done} | Failed: ${failed}`)
  if (done > 0) console.log('\nOn Demand library is now live!')
}

main().catch(console.error)
