/**
 * Dynamic Text-to-Speech system
 *
 * Generates audio on-demand for dialogue lines.
 *
 * Environments:
 * - Local dev: Uses Next.js API route (/api/tts)
 *   - Server generates audio via ElevenLabs
 *   - Caches to /public/audio/generated/
 *   - Returns local URL
 *
 * - CloudFront: Calls ElevenLabs directly from browser
 *   - No server-side code available
 *   - Creates blob URL for playback
 *   - No persistent caching (session only)
 */

import { debugLog } from "@/utils/debug";

// Voice ID mapping - same as server-side
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

// Always use browser generation (no API routes)
// This works for both dev server and CloudFront deployments
// Audio will be generated in browser and can be downloaded via AudioDownloadButton
const USE_BROWSER_GENERATION = typeof window !== "undefined";

// ElevenLabs API key - publicly visible but rate-limited per key
const ELEVEN_API_KEY =
  process.env.NEXT_PUBLIC_ELEVEN_API_KEY ||
  "sk_3b5ff415268a995766d1a0acdbb3ac81992283bf7db9b6f9";

// Session cache for CloudFront (blob URLs, cleared on page refresh)
const audioCache = new Map<string, string>();

// Export audioCache so it can be accessed by AudioDownloadButton
export { audioCache };

// In-flight generation tracking to prevent duplicate API calls
const inFlightGenerations = new Map<string, Promise<string>>();

/**
 * Try to load pre-generated audio file from /public/audio/generated/
 */
async function tryLoadPreGeneratedAudio(
  text: string,
  voiceId: string,
): Promise<string | null> {
  // Create the same filename format as AudioDownloadButton
  const safeText = text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .substring(0, 50);
  const filename = `${voiceId}_${safeText}.mp3`;
  const audioUrl = `/audio/generated/${filename}`;

  try {
    // Try to fetch the pre-generated file
    const response = await fetch(audioUrl, { method: "HEAD" });
    if (response.ok) {
      debugLog(
        "audioQueue",
        `[Dynamic TTS] Using pre-generated audio: "${text.substring(0, 50)}..."`,
      );
      return audioUrl;
    }
  } catch {
    // File doesn't exist, will fall back to generation
  }

  return null;
}

/**
 * Generate audio directly from browser (CloudFront only)
 */
async function generateAudioInBrowser(
  text: string,
  voiceId: string,
): Promise<string> {
  const cacheKey = `${voiceId}:${text}`;

  // Check session cache first
  if (audioCache.has(cacheKey)) {
    debugLog(
      "audioQueue",
      `[Dynamic TTS] Using session cache for: "${text.substring(0, 50)}..."`,
    );
    return audioCache.get(cacheKey)!;
  }

  // Try to load pre-generated audio file
  const preGeneratedUrl = await tryLoadPreGeneratedAudio(text, voiceId);
  if (preGeneratedUrl) {
    audioCache.set(cacheKey, preGeneratedUrl);
    return preGeneratedUrl;
  }

  // Check if this audio is already being generated
  if (inFlightGenerations.has(cacheKey)) {
    debugLog(
      "audioQueue",
      `[Dynamic TTS] Waiting for in-flight generation: "${text.substring(0, 50)}..."`,
    );
    return inFlightGenerations.get(cacheKey)!;
  }

  debugLog(
    "audioQueue",
    `[Dynamic TTS] Generating audio in browser for: "${text.substring(0, 50)}..."`,
  );

  // Create the generation promise
  const generationPromise = (async () => {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVEN_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model_id: "eleven_multilingual_v2",
            text,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.82,
              style: 0.15,
              use_speaker_boost: true,
            },
            output_format: "mp3_44100",
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        // eslint-disable-next-line no-console
        console.error("[Dynamic TTS] ElevenLabs API error:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
          voiceId,
        });
        throw new Error(
          `ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const audioBlob = await response.blob();
      const blobUrl = URL.createObjectURL(audioBlob);

      // Cache for this session
      audioCache.set(cacheKey, blobUrl);

      return blobUrl;
    } finally {
      // Remove from in-flight tracking when done
      inFlightGenerations.delete(cacheKey);
    }
  })();

  // Track this generation
  inFlightGenerations.set(cacheKey, generationPromise);

  return generationPromise;
}

/**
 * Get or generate audio for a dialogue line
 *
 * @param text - The text to convert to speech
 * @param characterId - The character ID (e.g., "drunk-danny", "maria-counter")
 * @returns Promise resolving to the audio file URL
 */
export async function getOrGenerateAudio(
  text: string,
  characterId: string,
): Promise<string> {
  const voiceId = VOICE_IDS[characterId];
  if (!voiceId) {
    // eslint-disable-next-line no-console
    console.error(`[Dynamic TTS] Unknown character: ${characterId}`);
    return "";
  }

  // Always use browser generation (works for dev and production)
  // Audio will be generated in browser and cached in audioCache Map
  // Use AudioDownloadButton to download generated audio files
  if (USE_BROWSER_GENERATION) {
    try {
      return generateAudioInBrowser(text, voiceId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[Dynamic TTS] Browser generation failed:", error);
      return "";
    }
  }

  return "";
}

/**
 * Preload audio for common phrases
 * Call this during game initialization to generate frequently used audio
 *
 * @param phrases - Array of {text, characterId} pairs to preload
 */
export async function preloadAudio(
  phrases: Array<{ text: string; characterId: string }>,
): Promise<void> {
  debugLog(
    "audioQueue",
    `[Dynamic TTS] Preloading ${phrases.length} audio files...`,
  );

  const promises = phrases.map(({ text, characterId }) =>
    getOrGenerateAudio(text, characterId).catch((error) => {
      // eslint-disable-next-line no-console
      console.warn(`[Dynamic TTS] Failed to preload: "${text}"`, error);
    }),
  );

  await Promise.all(promises);
  debugLog("audioQueue", `[Dynamic TTS] Preload complete`);
}
