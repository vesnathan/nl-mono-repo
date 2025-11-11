import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// Voice ID mapping (same as in dynamicTTS.ts)
const VOICE_IDS: Record<string, string> = {
  "chatty-carlos": "nPczCjzI2devNBz1zQrb",
  "clumsy-claire": "EXAVITQu4vr4xnSDxMaL",
  "cocky-kyle": "N2lVS1w4EtoT3dr4eOWO",
  "drunk-danny": "TX3LPaxmHKxFdv7VOQHJ",
  "lucky-larry": "yoZ06aMxZJJ28mfd3POQ",
  "nervous-nancy": "ThT5KcBeYPX3keUQqHPh",
  "superstitious-susan": "pFZP5JQG7iQjIQuC4Bku",
  "unlucky-ursula": "21m00Tcm4TlvDq8ikWAM",
  "maria-counter": "jpAuqBXeKYYLghVhBB7o",
  "rookie-jenny": "3lml9PlMztMoeWCIPG3x",
  "strict-harold": "kkDl4qrojTSu8MlI6LU8",
  "friendly-marcus": "9BWtsMINqrJLrRacOk9x",
  "oblivious-frank": "ujmqDAETt3y1YijvpPw3",
  "veteran-lisa": "q7bZH4lKxX0vZvOvobyX",
};

const ELEVEN_API_KEY =
  process.env.NEXT_PUBLIC_ELEVEN_API_KEY ||
  "sk_3b5ff415268a995766d1a0acdbb3ac81992283bf7db9b6f9";

export async function POST(request: NextRequest) {
  try {
    const { text, characterId } = await request.json();

    if (!text || !characterId) {
      return NextResponse.json(
        { error: "Missing text or characterId" },
        { status: 400 },
      );
    }

    const voiceId = VOICE_IDS[characterId];
    if (!voiceId) {
      return NextResponse.json(
        { error: `Unknown character: ${characterId}` },
        { status: 400 },
      );
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVEN_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API /tts] ElevenLabs error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate audio", details: errorText },
        { status: response.status },
      );
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer();

    // Generate filename based on text hash
    const hash = text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .substring(0, 50);
    const filename = `${characterId}_${hash}_${Date.now()}.mp3`;

    // Save to /public/audio/generated/
    const publicDir = path.join(process.cwd(), "public", "audio", "generated");

    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, filename);
    fs.writeFileSync(filePath, Buffer.from(audioBuffer));

    // Return the public URL
    const audioUrl = `/audio/generated/${filename}`;

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error("[API /tts] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
