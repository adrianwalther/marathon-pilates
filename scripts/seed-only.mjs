/**
 * Seed the on_demand_classes table with all 23 videos (no video upload).
 * Run AFTER adding the instructor_name column via Supabase SQL editor:
 *   ALTER TABLE on_demand_classes ADD COLUMN IF NOT EXISTS instructor_name TEXT;
 *
 *   node scripts/seed-only.mjs
 */

import { createClient } from '/Users/adrianwalther/Desktop/Marathon Pilates Platform/src/web/node_modules/@supabase/supabase-js/dist/index.mjs'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? 'https://vvqeacukwsvbgixabdef.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const CLASSES = [
  {
    title: 'Barreless Barre',
    instructor_name: 'Amy',
    duration_minutes: 39,
    difficulty_level: 'intermediate',
    focus_area: ['full body', 'cardio'],
    props_required: [],
    description: 'A barre-inspired class that requires no barre — all the sculpting, none of the equipment.',
  },
  {
    title: 'Express Barre',
    instructor_name: 'Amy',
    duration_minutes: 27,
    difficulty_level: 'intermediate',
    focus_area: ['full body', 'cardio'],
    props_required: [],
    description: 'A quick-hit barre class for when you want results in under 30 minutes.',
  },
  {
    title: 'Pilates HIIT',
    instructor_name: 'Amy',
    duration_minutes: 41,
    difficulty_level: 'advanced',
    focus_area: ['full body', 'cardio', 'strength'],
    props_required: [],
    description: 'High-intensity Pilates intervals that will leave you breathless and strong.',
  },
  {
    title: 'Lengthening & Strengthening',
    instructor_name: 'Helen',
    duration_minutes: 16,
    difficulty_level: 'intermediate',
    focus_area: ['full body', 'flexibility', 'strength'],
    props_required: [],
    description: 'A balanced class focusing on the dual Pilates goal — long, strong muscles.',
  },
  {
    title: 'Lower Body Ball & Band',
    instructor_name: 'Helen',
    duration_minutes: 21,
    difficulty_level: 'intermediate',
    focus_area: ['lower body', 'glutes', 'thighs'],
    props_required: ['small ball', 'resistance band'],
    description: 'Target the lower body with small ball and resistance band for extra challenge.',
  },
  {
    title: 'The Movement ABCs',
    instructor_name: 'Lisa',
    duration_minutes: 13,
    difficulty_level: 'beginner',
    focus_area: ['full body', 'fundamentals'],
    props_required: [],
    description: 'Back to basics — the foundational movement vocabulary every Pilates student needs.',
  },
  {
    title: '10-Minute Arms',
    instructor_name: 'Liza',
    duration_minutes: 12,
    difficulty_level: 'beginner',
    focus_area: ['arms', 'upper body'],
    props_required: [],
    description: 'A quick arm-focused series you can do anywhere, anytime.',
  },
  {
    title: '15-Minute Abs Series',
    instructor_name: 'Liza',
    duration_minutes: 19,
    difficulty_level: 'intermediate',
    focus_area: ['core', 'abs'],
    props_required: [],
    description: 'Deep core work in a focused 15-minute series. Expect to feel it.',
  },
  {
    title: '30-Minute Side Lying Series',
    instructor_name: 'Liza',
    duration_minutes: 28,
    difficulty_level: 'intermediate',
    focus_area: ['hips', 'glutes', 'lower body'],
    props_required: [],
    description: 'A deep dive into side-lying work targeting the outer hips and glutes.',
  },
  {
    title: 'Pilates Burn',
    instructor_name: 'Liza',
    duration_minutes: 35,
    difficulty_level: 'intermediate',
    focus_area: ['full body', 'strength', 'cardio'],
    props_required: [],
    description: 'Turn up the heat with this full-body burner that keeps you moving.',
  },
  {
    title: 'Short Stretch Series',
    instructor_name: 'Liza',
    duration_minutes: 14,
    difficulty_level: 'beginner',
    focus_area: ['flexibility', 'recovery'],
    props_required: [],
    description: 'A gentle, feel-good stretch series — perfect for recovery days or mornings.',
  },
  {
    title: 'Lower Body Burn Circuit',
    instructor_name: 'Helen',
    duration_minutes: 6,
    difficulty_level: 'intermediate',
    focus_area: ['lower body', 'glutes'],
    props_required: [],
    description: 'Six intense minutes for the lower body. Short. Effective. Done.',
  },
  {
    title: 'Advanced CoreCentric',
    instructor_name: 'Madison',
    duration_minutes: 27,
    difficulty_level: 'advanced',
    focus_area: ['core', 'full body'],
    props_required: [],
    description: "Madison's signature CoreCentric method at full intensity. Challenge accepted.",
  },
  {
    title: 'Beginner CoreCentric',
    instructor_name: 'Madison',
    duration_minutes: 23,
    difficulty_level: 'beginner',
    focus_area: ['core', 'full body'],
    props_required: [],
    description: "Madison's CoreCentric method made accessible. Build the foundation.",
  },
  {
    title: 'The Principles of Pilates',
    instructor_name: 'Marcela',
    duration_minutes: 32,
    difficulty_level: 'beginner',
    focus_area: ['full body', 'fundamentals'],
    props_required: [],
    description: 'Breath, centering, concentration, control, precision, flow — learn the six principles in motion.',
  },
  {
    title: 'Quick Arms, Back & Abs',
    instructor_name: 'Helen',
    duration_minutes: 11,
    difficulty_level: 'intermediate',
    focus_area: ['arms', 'back', 'core'],
    props_required: [],
    description: 'Target the entire upper body in just 11 minutes. Great as a standalone or add-on.',
  },
  {
    title: 'Full Body Mat',
    instructor_name: 'Riley',
    duration_minutes: 37,
    difficulty_level: 'intermediate',
    focus_area: ['full body'],
    props_required: [],
    description: "Riley's full-body mat class that covers all the bases.",
  },
  {
    title: 'Morning Wake Up, Stretch & Mobilize',
    instructor_name: 'Sirkka',
    duration_minutes: 28,
    difficulty_level: 'beginner',
    focus_area: ['flexibility', 'mobility', 'recovery'],
    props_required: [],
    description: 'Start your morning right — gentle movement to wake the body up and get you moving.',
  },
  {
    title: 'AAA',
    instructor_name: 'Sydney',
    duration_minutes: 18,
    difficulty_level: 'intermediate',
    focus_area: ['arms', 'abs', 'ankles'],
    props_required: [],
    description: "Sydney's classic triple-A series: arms, abs, and ankles.",
  },
  {
    title: 'ABA',
    instructor_name: 'Sydney',
    duration_minutes: 24,
    difficulty_level: 'intermediate',
    focus_area: ['arms', 'back', 'abs'],
    props_required: [],
    description: "Sydney's ABA series targeting arms, back, and abs.",
  },
  {
    title: 'CoreCentric with Sydney',
    instructor_name: 'Sydney',
    duration_minutes: 17,
    difficulty_level: 'intermediate',
    focus_area: ['core', 'full body'],
    props_required: [],
    description: 'Sydney leads you through a CoreCentric flow with her signature energy.',
  },
  {
    title: 'Glutes & Abs Flow',
    instructor_name: 'Sydney',
    duration_minutes: 24,
    difficulty_level: 'intermediate',
    focus_area: ['glutes', 'core', 'lower body'],
    props_required: [],
    description: "A feel-good flow targeting everyone's favorite two areas.",
  },
  {
    title: 'Stretching with the Foam Roller',
    instructor_name: 'Sydney',
    duration_minutes: 21,
    difficulty_level: 'beginner',
    focus_area: ['flexibility', 'recovery', 'mobility'],
    props_required: ['foam roller'],
    description: 'Use the foam roller to release tension and restore mobility from head to toe.',
  },
]

async function main() {
  console.log(`Seeding ${CLASSES.length} on-demand classes...\n`)

  let inserted = 0
  let skipped = 0

  for (const cls of CLASSES) {
    const { data: existing } = await supabase
      .from('on_demand_classes')
      .select('id')
      .eq('title', cls.title)
      .eq('instructor_name', cls.instructor_name)
      .maybeSingle()

    if (existing) {
      console.log(`  ✓ Skip (exists): ${cls.instructor_name} — ${cls.title}`)
      skipped++
      continue
    }

    const { error } = await supabase.from('on_demand_classes').insert({
      ...cls,
      is_ai_generated: false,
      is_published: false, // will flip to true after videos are uploaded
    })

    if (error) {
      console.error(`  ✗ Error: ${cls.title}: ${error.message}`)
    } else {
      console.log(`  + Seeded: ${cls.instructor_name} — ${cls.title} (${cls.duration_minutes} min, ${cls.difficulty_level})`)
      inserted++
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`)
  console.log('\nNext steps:')
  console.log('1. Run compress-videos.sh to compress all videos (takes ~2-4 hours)')
  console.log('2. Run upload-and-seed.mjs to upload videos and publish classes')
}

main().catch(console.error)
