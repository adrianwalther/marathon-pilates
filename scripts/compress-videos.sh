#!/bin/bash
# Compress on-demand videos to 720p H.264 for web delivery
# Uses macOS built-in avconvert (no ffmpeg required)

SOURCE_DIR="/Volumes/MARATHON/MARATHON PILATES/ON DEMAND/On Demand Vids"
OUT_DIR="/tmp/marathon-compressed"

mkdir -p "$OUT_DIR"

compress() {
  local src="$1"
  local out="$2"
  local label="$3"

  if [ -f "$out" ]; then
    echo "✓ Already done: $label"
    return
  fi
  if [ ! -f "$src" ]; then
    echo "✗ Not found: $src"
    return
  fi

  echo "Compressing: $label"
  avconvert --source "$src" --output "$out" --preset Preset1280x720 --progress --replace
  if [ $? -eq 0 ]; then
    local size
    size=$(du -sh "$out" | awk '{print $1}')
    echo "  ✓ Done ($size)"
  else
    echo "  ✗ Failed"
  fi
  echo ""
}

compress "$SOURCE_DIR/AMY_BARRELESS BARRE CLASS.mp4"         "$OUT_DIR/AMY_BARRELESS_BARRE.mp4"              "Amy — Barreless Barre"
compress "$SOURCE_DIR/AMY_EXPRESS BARRE CLASS.mp4"           "$OUT_DIR/AMY_EXPRESS_BARRE.mp4"                "Amy — Express Barre"
compress "$SOURCE_DIR/AMY_PILATES HIIT CLASS.mp4"            "$OUT_DIR/AMY_PILATES_HIIT.mp4"                 "Amy — Pilates HIIT"
compress "$SOURCE_DIR/HELEN_LENGTHENING AND STRENGTHENING.mp4" "$OUT_DIR/HELEN_LENGTHENING_STRENGTHENING.mp4" "Helen — Lengthening & Strengthening"
compress "$SOURCE_DIR/HELEN_LOWER BODY BALL AND BAND.mp4"    "$OUT_DIR/HELEN_LOWER_BODY_BALL_BAND.mp4"       "Helen — Lower Body Ball & Band"
compress "$SOURCE_DIR/LISA_THE MOVEMENT ABC'S.mp4"           "$OUT_DIR/LISA_MOVEMENT_ABCS.mp4"               "Lisa — The Movement ABCs"
compress "$SOURCE_DIR/LIZA'S_10 MIN ARMS.mp4"                "$OUT_DIR/LIZA_10MIN_ARMS.mp4"                  "Liza — 10 Min Arms"
compress "$SOURCE_DIR/LIZA_15 MIN ABS SERIES.mp4"            "$OUT_DIR/LIZA_15MIN_ABS.mp4"                   "Liza — 15 Min Abs"
compress "$SOURCE_DIR/LIZA_30 MIN SIDE LYING SERIES.mp4"     "$OUT_DIR/LIZA_30MIN_SIDE_LYING.mp4"            "Liza — 30 Min Side Lying"
compress "$SOURCE_DIR/LIZA_PILATES BURN.mp4"                 "$OUT_DIR/LIZA_PILATES_BURN.mp4"                "Liza — Pilates Burn"
compress "$SOURCE_DIR/LIZA_SHORT STRETCH SERIES.mp4"         "$OUT_DIR/LIZA_SHORT_STRETCH.mp4"               "Liza — Short Stretch"
compress "$SOURCE_DIR/LOWER BODY BURN CIRCUIT.mp4"           "$OUT_DIR/HELEN_LOWER_BODY_BURN.mp4"            "Helen — Lower Body Burn Circuit"
compress "$SOURCE_DIR/MADISON_ADVANCED LEVEL CORECENTRIC.mp4" "$OUT_DIR/MADISON_ADVANCED_CORECENTRIC.mp4"    "Madison — Advanced CoreCentric"
compress "$SOURCE_DIR/MADISON_BEGINNER CORECENTRIC.mp4"      "$OUT_DIR/MADISON_BEGINNER_CORECENTRIC.mp4"     "Madison — Beginner CoreCentric"
compress "$SOURCE_DIR/MARCELA_THE PRINCIPLES OF PILATES.mp4" "$OUT_DIR/MARCELA_PRINCIPLES_OF_PILATES.mp4"    "Marcela — Principles of Pilates"
compress "$SOURCE_DIR/QUICK ARMS, BACK AND ABS.mp4"          "$OUT_DIR/HELEN_QUICK_ARMS_BACK_ABS.mp4"        "Helen — Quick Arms Back & Abs"

# Riley
compress "/Volumes/MARATHON/MARATHON PILATES/ON DEMAND/RILEY/FULL BODY MAT/RILEY_FULL BODY.mp4" \
  "$OUT_DIR/RILEY_FULL_BODY.mp4" "Riley — Full Body Mat"

# Sirkka
compress "/Volumes/MARATHON/MARATHON PILATES/ON DEMAND/SIRKKA/MORNING WAKE UP, STRETCH AND MOBILIZE/MORNING WAKE UP, STRETCH AND MOBILIZE.mp4" \
  "$OUT_DIR/SIRKKA_MORNING_WAKE_UP.mp4" "Sirkka — Morning Wake Up"

# Sydney
compress "/Volumes/MARATHON/MARATHON PILATES/ON DEMAND/SYDNEY/AAA/SYDNEY_AAA.mp4" \
  "$OUT_DIR/SYDNEY_AAA.mp4" "Sydney — AAA"
compress "/Volumes/MARATHON/MARATHON PILATES/ON DEMAND/SYDNEY/ABA/SYDNEY_ABA.mp4" \
  "$OUT_DIR/SYDNEY_ABA.mp4" "Sydney — ABA"
compress "/Volumes/MARATHON/MARATHON PILATES/ON DEMAND/SYDNEY/CORECENTRIC/SYDNEY_CORECENTRIC.mp4" \
  "$OUT_DIR/SYDNEY_CORECENTRIC.mp4" "Sydney — CoreCentric"
compress "/Volumes/MARATHON/MARATHON PILATES/ON DEMAND/SYDNEY/GLUTES AND ABS FLOW/SYDNEY_GLUTE AND ABS FLOW.mp4" \
  "$OUT_DIR/SYDNEY_GLUTES_ABS_FLOW.mp4" "Sydney — Glutes & Abs Flow"
compress "/Volumes/MARATHON/MARATHON PILATES/ON DEMAND/SYDNEY/STRETCHING WITH THE FOAM ROLLER/SIDNEY_STRETCHING WITH THE FOAM ROLLER.mp4" \
  "$OUT_DIR/SYDNEY_FOAM_ROLLER_STRETCH.mp4" "Sydney — Foam Roller Stretch"

echo ""
echo "All done. Compressed files in $OUT_DIR:"
ls -lh "$OUT_DIR"
