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

interface TTSResponse {
  audioUrl: string;
  cached: boolean;
}

// Voice ID mapping - same as server-side
const VOICE_IDS: Record<string, string> = {
  'drunk-danny': 'Vr1ZyHpAtTpW6DEVZwwI',
  'clumsy-claire': 'ef1T91Fo2YqVYGug3C2p',
  'chatty-carlos': 'MnqYh9UZerXWcrKflGOg',
  'superstitious-susan': '8t6aWwL1WUiIpGgYJKnOYrXLriTqHsJZvuBMRrvc',
  'cocky-kyle': 'XiPuSi02djl3mdNjSaio',
  'nervous-nancy': 'lo7AgX1athQfnbY9sVMj',
  'lucky-larry': 'xefN48Dq40rKHHpNo8gn',
  'unlucky-ursula': 'ADk3UhQjkXzfOux4ovHq',
  'maria-counter': 'jpAuqBXeKYYLghVhBB7o',
  'rookie-jenny': '3lml9PlMztMoeWCIPG3x',
  'strict-harold': 'kkDl4qrojTSu8MlI6LU8',
  'friendly-marcus': '9BWtsMINqrJLrRacOk9x',
  'oblivious-frank': 'ujmqDAETt3y1YijvpPw3',
  'veteran-lisa': 'q7bZH4lKxX0vZvOvobyX',
};

// Check if we're in a CloudFront deployment (static hosting, no API routes)
const IS_CLOUDFRONT = typeof window !== 'undefined' &&
  (window.location.hostname.includes('cloudfront') ||
   window.location.hostname.includes('amazonaws.com'));

// ElevenLabs API key - publicly visible but rate-limited per key
const ELEVEN_API_KEY = process.env.NEXT_PUBLIC_ELEVEN_API_KEY || 'sk_3b5ff415268a995766d1a0acdbb3ac81992283bf7db9b6f9';

// Session cache for CloudFront (blob URLs, cleared on page refresh)
const audioCache = new Map<string, string>();

/**
 * Generate audio directly from browser (CloudFront only)
 */
async function generateAudioInBrowser(text: string, voiceId: string): Promise<string> {
  const cacheKey = `${voiceId}:${text}`;

  // Check session cache first
  if (audioCache.has(cacheKey)) {
    console.log(`[Dynamic TTS] Using session cache for: "${text.substring(0, 50)}..."`);
    return audioCache.get(cacheKey)!;
  }

  console.log(`[Dynamic TTS] Generating audio in browser for: "${text.substring(0, 50)}..."`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'eleven_multilingual_v2',
        text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.82,
          style: 0.15,
          use_speaker_boost: true,
        },
        output_format: 'mp3_44100',
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  const audioBlob = await response.blob();
  const blobUrl = URL.createObjectURL(audioBlob);

  // Cache for this session
  audioCache.set(cacheKey, blobUrl);

  return blobUrl;
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
  characterId: string
): Promise<string> {
  const voiceId = VOICE_IDS[characterId];
  if (!voiceId) {
    console.error(`[Dynamic TTS] Unknown character: ${characterId}`);
    return '';
  }

  // CloudFront deployment: Call ElevenLabs directly from browser
  if (IS_CLOUDFRONT) {
    try {
      return await generateAudioInBrowser(text, voiceId);
    } catch (error) {
      console.error('[Dynamic TTS] Browser generation failed:', error);
      return '';
    }
  }

  // Local dev: Use API route to generate on-demand and cache on server
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        characterId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Dynamic TTS] API error:', error);
      throw new Error(error.error || 'TTS generation failed');
    }

    const data: TTSResponse = await response.json();

    if (data.cached) {
      console.log(`[Dynamic TTS] Using cached audio for: "${text.substring(0, 50)}..."`);
    } else {
      console.log(`[Dynamic TTS] Generated new audio for: "${text.substring(0, 50)}..."`);
    }

    return data.audioUrl;
  } catch (error) {
    console.error('[Dynamic TTS] Failed to get/generate audio:', error);
    return '';
  }
}

/**
 * Preload audio for common phrases
 * Call this during game initialization to generate frequently used audio
 *
 * @param phrases - Array of {text, characterId} pairs to preload
 */
export async function preloadAudio(
  phrases: Array<{ text: string; characterId: string }>
): Promise<void> {
  console.log(`[Dynamic TTS] Preloading ${phrases.length} audio files...`);

  const promises = phrases.map(({ text, characterId }) =>
    getOrGenerateAudio(text, characterId).catch((error) => {
      console.warn(`[Dynamic TTS] Failed to preload: "${text}"`, error);
    })
  );

  await Promise.all(promises);
  console.log(`[Dynamic TTS] Preload complete`);
}
