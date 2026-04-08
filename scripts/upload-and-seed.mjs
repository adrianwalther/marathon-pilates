/**
 * Upload compressed on-demand videos to Supabase Storage
 * and seed the on_demand_classes table.
 *
 * Run after compress-videos.sh completes:
 *   node scripts/upload-and-seed.mjs
 *
 * Requires: node >= 18 (uses native fetch)
 */

import { createClient } from '/Users/adrianwalther/Desktop/Marathon Pilates Platform/src/web/node_modules/@supabase/supabase-js/dist/index.mjs'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vvqeacukwsvbgixabdef.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var'); process.exit(1) }
const BUCKET = 'on-demand-videos'
const COMPRESSED_DIR = '/tmp/marathon-compressed'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ─── Video metadata ────────────────────────────────────────────────────────
const VIDEO_METADATA = [
  {
    file: 'AMY_BARRELESS_BARRE.mp4',
    title: 'Barreless Barre',
    instructor_name: 'Amy',
    duration_minutes: 39,
    difficulty_level: 'intermediate',
    focus_area: ['full body', 'cardio'],
    props_required: [],
    description: 'A barre-inspired class that requires no barre — all the sculpting, none of the equipment.',
  },
  {
    file: 'AMY_EXPRESS_BARRE.mp4',
    title: 'Express Barre',
    instructor_name: 'Amy',
    duration_minutes: 27,
    difficulty_level: 'intermediate',
    focus_area: ['full body', 'cardio'],
    props_required: [],
    description: 'A quick-hit barre class for when you want results in under 30 minutes.',
  },
  {
    file: 'AMY_PILATES_HIIT.mp4',
    title: 'Pilates HIIT',
    instructor_name: 'Amy',
    duration_minutes: 41,
    difficulty_level: 'advanced',
    focus_area: ['full body', 'cardio', 'strength'],
    props_required: [],
    description: 'High-intensity Pilates intervals that will leave you breathless and strong.',
  },
  {
    file: 'HELEN_LENGTHENING_STRENGTHENING.mp4',
    title: 'Lengthening & Strengthening',
    instructor_name: 'Helen',
    duration_minutes: 16,
    difficulty_level: 'intermediate',
    focus_area: ['full body', 'flexibility', 'strength'],
    props_required: [],
    description: 'A balanced class focusing on the dual Pilates goal — long, strong muscles.',
  },
  {
    file: 'HELEN_LOWER_BODY_BALL_BAND.mp4',
    title: 'Lower Body Ball & Band',
    instructor_name: 'Helen',
    duration_minutes: 21,
    difficulty_level: 'intermediate',
    focus_area: ['lower body', 'glutes', 'thighs'],
    props_required: ['small ball', 'resistance band'],
    description: 'Target the lower body with small ball and resistance band for extra challenge.',
  },
  {
    file: 'LISA_MOVEMENT_ABCS.mp4',
    title: 'The Movement ABCs',
    instructor_name: 'Lisa',
    duration_minutes: 13,
    difficulty_level: 'beginner',
    focus_area: ['full body', 'fundamentals'],
    props_required: [],
    description: 'Back to basics — the foundational movement vocabulary every Pilates student needs.',
  },
  {
    file: 'LIZA_10MIN_ARMS.mp4',
    title: '10-Minute Arms',
    instructor_name: 'Liza',
    duration_minutes: 12,
    difficulty_level: 'beginner',
    focus_area: ['arms', 'upper body'],
    props_required: [],
    description: 'A quick arm-focused series you can do anywhere, anytime.',
  },
  {
    file: 'LIZA_15MIN_ABS.mp4',
    title: '15-Minute Abs Series',
    instructor_name: 'Liza',
    duration_minutes: 19,
    difficulty_level: 'intermediate',
    focus_area: ['core', 'abs'],
    props_required: [],
    description: 'Deep core work in a focused 15-minute series. Expect to feel it.',
  },
  {
    file: 'LIZA_30MIN_SIDE_LYING.mp4',
    title: '30-Minute Side Lying Series',
    instructor_name: 'Liza',
    duration_minutes: 28,
    difficulty_level: 'intermediate',
    focus_area: ['hips', 'glutes', 'lower body'],
    props_required: [],
    description: 'A deep dive into side-lying work targeting the outer hips and glutes.',
  },
  {
    file: 'LIZA_PILATES_BURN.mp4',
    title: 'Pilates Burn',
    instructor_name: 'Liza',
    duration_minutes: 35,
    difficulty_level: 'intermediate',
    focus_area: ['full body', 'strength', 'cardio'],
    props_required: [],
    description: 'Turn up the heat with this full-body burner that keeps you moving.',
  },
  {
    file: 'LIZA_SHORT_STRETCH.mp4',
    title: 'Short Stretch Series',
    instructor_name: 'Liza',
    duration_minutes: 14,
    difficulty_level: 'beginner',
    focus_area: ['flexibility', 'recovery'],
    props_required: [],
    description: 'A gentle, feel-good stretch series — perfect for recovery days or mornings.',
  },
  {
    file: 'HELEN_LOWER_BODY_BURN.mp4',
    title: 'Lower Body Burn Circuit',
    instructor_name: 'Helen',
    duration_minutes: 6,
    difficulty_level: 'intermediate',
    focus_area: ['lower body', 'glutes'],
    props_required: [],
    description: 'Six intense minutes for the lower body. Short. Effective. Done.',
  },
  {
    file: 'MADISON_ADVANCED_CORECENTRIC.mp4',
    title: 'Advanced CoreCentric',
    instructor_name: 'Madison',
    duration_minutes: 27,
    difficulty_level: 'advanced',
    focus_area: ['core', 'full body'],
    props_required: [],
    description: "Madison's signature CoreCentric method at full intensity. Challenge accepted.",
  },
  {
    file: 'MADISON_BEGINNER_CORECENTRIC.mp4',
    title: 'Beginner CoreCentric',
    instructor_name: 'Madison',
    duration_minutes: 23,
    difficulty_level: 'beginner',
    focus_area: ['core', 'full body'],
    props_required: [],
    description: "Madison's CoreCentric method made accessible. Build the foundation.",
  },
  {
    file: 'MARCELA_PRINCIPLES_OF_PILATES.mp4',
    title: 'The Principles of Pilates',
    instructor_name: 'Marcela',
    duration_minutes: 32,
    difficulty_level: 'beginner',
    focus_area: ['full body', 'fundamentals'],
    props_required: [],
    description: 'Breath, centering, concentration, control, precision, flow — learn the six principles in motion.',
  },
  {
    file: 'HELEN_QUICK_ARMS_BACK_ABS.mp4',
    title: 'Quick Arms, Back & Abs',
    instructor_name: 'Helen',
    duration_minutes: 11,
    difficulty_level: 'intermediate',
    focus_area: ['arms', 'back', 'core'],
    props_required: [],
    description: 'Target the entire upper body in just 11 minutes. Great as a standalone or add-on.',
  },
  {
    file: 'RILEY_FULL_BODY.mp4',
    title: 'Full Body Mat',
    instructor_name: 'Riley',
    duration_minutes: 37,
    difficulty_level: 'intermediate',
    focus_area: ['full body'],
    props_required: [],
    description: "Riley's full-body mat class that covers all the bases.",
  },
  {
    file: 'SIRKKA_MORNING_WAKE_UP.mp4',
    title: 'Morning Wake Up, Stretch & Mobilize',
    instructor_name: 'Sirkka',
    duration_minutes: 28,
    difficulty_level: 'beginner',
    focus_area: ['flexibility', 'mobility', 'recovery'],
    props_required: [],
    description: 'Start your morning right — gentle movement to wake the body up and get you moving.',
  },
  {
    file: 'SYDNEY_AAA.mp4',
    title: 'AAA',
    instructor_name: 'Sydney',
    duration_minutes: 18,
    difficulty_level: 'intermediate',
    focus_area: ['arms', 'abs', 'ankles'],
    props_required: [],
    description: "Sydney's classic triple-A series: arms, abs, and ankles.",
  },
  {
    file: 'SYDNEY_ABA.mp4',
    title: 'ABA',
    instructor_name: 'Sydney',
    duration_minutes: 24,
    difficulty_level: 'intermediate',
    focus_area: ['arms', 'back', 'abs'],
    props_required: [],
    description: "Sydney's ABA series targeting arms, back, and abs.",
  },
  {
    file: 'SYDNEY_CORECENTRIC.mp4',
    title: 'CoreCentric with Sydney',
    instructor_name: 'Sydney',
    duration_minutes: 17,
    difficulty_level: 'intermediate',
    focus_area: ['core', 'full body'],
    props_required: [],
    description: 'Sydney leads you through a CoreCentric flow with her signature energy.',
  },
  {
    file: 'SYDNEY_GLUTES_ABS_FLOW.mp4',
    title: 'Glutes & Abs Flow',
    instructor_name: 'Sydney',
    duration_minutes: 24,
    difficulty_level: 'intermediate',
    focus_area: ['glutes', 'core', 'lower body'],
    props_required: [],
    description: "A feel-good flow targeting everyone's favorite two areas.",
  },
  {
    file: 'SYDNEY_FOAM_ROLLER_STRETCH.mp4',
    title: 'Stretching with the Foam Roller',
    instructor_name: 'Sydney',
    duration_minutes: 21,
    difficulty_level: 'beginner',
    focus_area: ['flexibility', 'recovery', 'mobility'],
    props_required: ['foam roller'],
    description: 'Use the foam roller to release tension and restore mobility from head to toe.',
  },
]

// ─── Create bucket if needed ────────────────────────────────────────────────
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`Failed to create bucket: ${error.message}`)
    console.log(`✓ Created storage bucket: ${BUCKET}`)
  } else {
    console.log(`✓ Bucket exists: ${BUCKET}`)
  }
}

// ─── Upload a single video ───────────────────────────────────────────────────
async function uploadVideo(file) {
  const filePath = join(COMPRESSED_DIR, file)
  if (!existsSync(filePath)) {
    console.log(`  ⚠ Compressed file not found: ${file} — run compress-videos.sh first`)
    return null
  }

  const fileBuffer = readFileSync(filePath)
  const storagePath = `videos/${file}`

  // Check if already uploaded
  const { data: existing } = await supabase.storage.from(BUCKET).list('videos', { search: file })
  if (existing?.some(f => f.name === file)) {
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    console.log(`  ✓ Already uploaded: ${file}`)
    return publicUrl
  }

  console.log(`  Uploading ${file} (${(fileBuffer.length / 1024 / 1024).toFixed(0)} MB)...`)
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fileBuffer, {
    contentType: 'video/mp4',
    upsert: true,
  })

  if (error) {
    console.error(`  ✗ Upload failed: ${error.message}`)
    return null
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  console.log(`  ✓ Uploaded → ${publicUrl}`)
  return publicUrl
}

// ─── Seed DB ────────────────────────────────────────────────────────────────
async function seedClass(meta, videoUrl) {
  // Check if already seeded (by title + instructor)
  const { data: existing } = await supabase
    .from('on_demand_classes')
    .select('id')
    .eq('title', meta.title)
    .eq('instructor_name', meta.instructor_name)
    .single()

  if (existing) {
    // Update video_url if we now have one
    if (videoUrl) {
      await supabase.from('on_demand_classes').update({ video_url: videoUrl }).eq('id', existing.id)
      console.log(`  ✓ Updated video URL for: ${meta.title}`)
    } else {
      console.log(`  ✓ Already seeded: ${meta.title}`)
    }
    return
  }

  const { error } = await supabase.from('on_demand_classes').insert({
    title: meta.title,
    instructor_name: meta.instructor_name,
    description: meta.description,
    duration_minutes: meta.duration_minutes,
    difficulty_level: meta.difficulty_level,
    focus_area: meta.focus_area,
    props_required: meta.props_required,
    video_url: videoUrl,
    is_ai_generated: false,
    is_published: videoUrl ? true : false, // only publish when video is ready
    published_at: videoUrl ? new Date().toISOString() : null,
  })

  if (error) {
    console.error(`  ✗ DB insert failed for ${meta.title}: ${error.message}`)
  } else {
    console.log(`  ✓ Seeded: ${meta.title} (${videoUrl ? 'published' : 'draft — no video yet'})`)
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('Marathon Pilates — On Demand Upload & Seed\n')
  console.log('Step 1: Ensuring storage bucket...')
  await ensureBucket()

  console.log('\nStep 2: Processing videos...\n')
  for (const meta of VIDEO_METADATA) {
    console.log(`[${meta.instructor_name}] ${meta.title}`)
    const videoUrl = await uploadVideo(meta.file)
    await seedClass(meta, videoUrl)
    console.log('')
  }

  console.log('Done! Check your on-demand page.')
}

main().catch(console.error)
