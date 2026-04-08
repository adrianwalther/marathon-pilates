/**
 * Upload class thumbnail stills to Supabase Storage
 * and update thumbnail_url on each on_demand_classes row.
 *
 *   node scripts/upload-thumbnails.mjs
 */

import { createClient } from '/Users/adrianwalther/Desktop/Marathon Pilates Platform/src/web/node_modules/@supabase/supabase-js/dist/index.mjs'
import { readFileSync, existsSync } from 'fs'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vvqeacukwsvbgixabdef.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var'); process.exit(1) }
const BUCKET           = 'on-demand-thumbnails'
const BASE             = '/Volumes/MARATHON/MARATHON PILATES/ON DEMAND'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const THUMBNAILS = [
  { title: 'Barreless Barre',                     instructor: 'Amy',     src: `${BASE}/AMY/BARRELESS BARRE CLASS/Still1_3.1.1.jpg`,                                    dest: 'amy-barreless-barre.jpg' },
  { title: 'Express Barre',                        instructor: 'Amy',     src: `${BASE}/AMY/EXPRESS BARRE CLASS/Still1_3.1.1.jpg`,                                      dest: 'amy-express-barre.jpg' },
  { title: 'Pilates HIIT',                         instructor: 'Amy',     src: `${BASE}/AMY/PILATES HIT CLASS/still1_3.1.1.jpg`,                                        dest: 'amy-pilates-hiit.jpg' },
  { title: 'Lengthening & Strengthening',          instructor: 'Helen',   src: `${BASE}/HELEN/STRENGTHENING AND LENGTHENING/Helen_S&L_Still_3.1.1.jpg`,                 dest: 'helen-lengthening.jpg' },
  { title: 'Lower Body Ball & Band',               instructor: 'Helen',   src: `${BASE}/HELEN/LOWER BODY BALL AND BAND/Helen_Still_3.1.1.jpg`,                          dest: 'helen-lower-body-ball-band.jpg' },
  { title: 'Lower Body Burn Circuit',              instructor: 'Helen',   src: `${BASE}/HELEN/LOWER BODY BURN CIRCUIT/Helen_Still_3.1.1.jpg`,                           dest: 'helen-lower-body-burn.jpg' },
  { title: 'Quick Arms, Back & Abs',               instructor: 'Helen',   src: `${BASE}/HELEN/QUICK ARMS, BACK AND ABS/HELEN_STILL1_3.1.1.jpg`,                        dest: 'helen-quick-arms.jpg' },
  { title: 'The Movement ABCs',                    instructor: 'Lisa',    src: `${BASE}/LISA/The Movement ABC's/LISA_STILL1_3.1.1.jpg`,                                 dest: 'lisa-movement-abcs.jpg' },
  { title: '10-Minute Arms',                       instructor: 'Liza',    src: `${BASE}/LIZA/LIZA_10 Minute Arms/LizaStill_1.2.1.jpg`,                                  dest: 'liza-10min-arms.jpg' },
  { title: '15-Minute Abs Series',                 instructor: 'Liza',    src: `${BASE}/LIZA/Liza_15 Minute Abs Series/Liz_Ab Series Still_2.1.2.jpg`,                  dest: 'liza-15min-abs.jpg' },
  { title: '30-Minute Side Lying Series',          instructor: 'Liza',    src: `${BASE}/LIZA/LIZA_30 Minute Side Lying Series/Side Line_Still_2.1.1.jpg`,               dest: 'liza-30min-side-lying.jpg' },
  { title: 'Pilates Burn',                         instructor: 'Liza',    src: `${BASE}/LIZA/LIZA_Pilates Burn/Liza_Still_3.1.1.jpg`,                                   dest: 'liza-pilates-burn.jpg' },
  { title: 'Short Stretch Series',                 instructor: 'Liza',    src: `${BASE}/LIZA/LIZA_Short Stretch/Stretch_Still_1.1.1.jpg`,                               dest: 'liza-short-stretch.jpg' },
  { title: 'Advanced CoreCentric',                 instructor: 'Madison', src: `${BASE}/MADISON/ADVANCED LEVEL CORECENTRIC/Still1_4.1.1.jpg`,                           dest: 'madison-advanced-corecentric.jpg' },
  { title: 'Beginner CoreCentric',                 instructor: 'Madison', src: `${BASE}/MADISON/BEGINNER LEVEL CORECENTRIC/Madison1_1.1.1.jpg`,                         dest: 'madison-beginner-corecentric.jpg' },
  { title: 'The Principles of Pilates',            instructor: 'Marcela', src: `${BASE}/MARCELA/Still1_2.1.1.jpg`,                                                       dest: 'marcela-principles.jpg' },
  { title: 'Full Body Mat',                        instructor: 'Riley',   src: `${BASE}/RILEY/FULL BODY MAT/Riley Still1_3.1.1.jpg`,                                     dest: 'riley-full-body.jpg' },
  { title: 'Morning Wake Up, Stretch & Mobilize',  instructor: 'Sirkka',  src: `${BASE}/SIRKKA/MORNING WAKE UP, STRETCH AND MOBILIZE/Sirkka still1_3.1.1.jpg`,          dest: 'sirkka-morning-wake-up.jpg' },
  { title: 'AAA',                                  instructor: 'Sydney',  src: `${BASE}/SYDNEY/AAA/Still1_3.1.1.jpg`,                                                    dest: 'sydney-aaa.jpg' },
  { title: 'ABA',                                  instructor: 'Sydney',  src: `${BASE}/SYDNEY/ABA/Still1_1.1.1.jpg`,                                                    dest: 'sydney-aba.jpg' },
  { title: 'CoreCentric with Sydney',              instructor: 'Sydney',  src: `${BASE}/SYDNEY/CORECENTRIC/Still1_3.1.1.jpg`,                                            dest: 'sydney-corecentric.jpg' },
  { title: 'Glutes & Abs Flow',                    instructor: 'Sydney',  src: `${BASE}/SYDNEY/GLUTES AND ABS FLOW/Still1_3.1.1.jpg`,                                   dest: 'sydney-glutes-abs.jpg' },
  { title: 'Stretching with the Foam Roller',      instructor: 'Sydney',  src: `${BASE}/SYDNEY/STRETCHING WITH THE FOAM ROLLER/SYDNEY_STILL1_3.1.1.jpg`,                dest: 'sydney-foam-roller.jpg' },
]

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true })
    console.log(`✓ Created bucket: ${BUCKET}\n`)
  }
}

async function main() {
  console.log('Uploading thumbnails to Supabase Storage...\n')
  await ensureBucket()

  let done = 0, failed = 0

  for (const t of THUMBNAILS) {
    console.log(`[${t.instructor}] ${t.title}`)

    if (!existsSync(t.src)) {
      console.log(`  ✗ File not found: ${t.src}\n`)
      failed++
      continue
    }

    const file = readFileSync(t.src)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(t.dest, file, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) {
      console.log(`  ✗ Upload failed: ${uploadError.message}\n`)
      failed++
      continue
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(t.dest)

    const { error: dbError } = await supabase
      .from('on_demand_classes')
      .update({ thumbnail_url: publicUrl })
      .eq('title', t.title)
      .eq('instructor_name', t.instructor)

    if (dbError) {
      console.log(`  ✗ DB update failed: ${dbError.message}\n`)
      failed++
    } else {
      console.log(`  ✓ Done\n`)
      done++
    }
  }

  console.log(`Complete. Uploaded: ${done} | Failed: ${failed}`)
}

main().catch(console.error)
