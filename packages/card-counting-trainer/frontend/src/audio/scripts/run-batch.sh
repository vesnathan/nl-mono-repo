#!/usr/bin/env bash
API_KEY="${ELEVEN_API_KEY:-YOUR_API_KEY}"
MODEL_ID="eleven_multilingual_v2"
OUTFMT="mp3_44100"

# Strip comments from manifest.json (JSON doesn't support comments)
grep -v '^\s*/\*' manifest.json | grep -v '^\s*\*/' | sed 's|/\*[^*]*\*/||g' > manifest-clean.json

jq -c '.items[]' manifest-clean.json | while read -r ITEM; do
  VOICE_ID=$(jq -r '.voice_id' <<<"$ITEM")
  TEXT=$(jq -r '.text' <<<"$ITEM")
  FILENAME=$(jq -r '.filename' <<<"$ITEM")
  STAB=$(jq -r '.voice_settings.stability' <<<"$ITEM")
  SIM=$(jq -r '.voice_settings.similarity_boost' <<<"$ITEM")
  STYLE=$(jq -r '.voice_settings.style' <<<"$ITEM")
  BOOST=$(jq -r '.voice_settings.use_speaker_boost' <<<"$ITEM")

  mkdir -p "$(dirname "$FILENAME")"
  curl -sS -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID/stream" \
    -H "xi-api-key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model_id\":\"$MODEL_ID\",
      \"text\":$(jq -Rn --arg t "$TEXT" '$t'),
      \"voice_settings\":{
        \"stability\":$STAB,
        \"similarity_boost\":$SIM,
        \"style\":$STYLE,
        \"use_speaker_boost\":$BOOST
      },
      \"output_format\":\"$OUTFMT\"
    }" \
    --output "$FILENAME" || { echo "❌ Failed $FILENAME"; exit 1; }
  echo "✔ $FILENAME"
done
echo "Done."
