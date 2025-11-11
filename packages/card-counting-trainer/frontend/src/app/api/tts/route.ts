import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// Voice ID mapping for characters
const VOICE_IDS: Record<string, string> = {
  'drunk-danny': 'Vr1ZyHpAtTpW6DEVZwwI',
  'clumsy-claire': 'ef1T91Fo2YqVYGug3C2p',
  'chatty-carlos': 'MnqYh9UZerXWcrKflGOg',
  'superstitious-susan': '8t6aWwL1WUiIpGgYJKnOYrXLriTqHsJZvuBMRrvc',
  'cocky-kyle': 'XiPuSi02djl3mdNjSaio',
  'nervous-nancy': 'lo7AgX1athQfnbY9sVMj',
  'lucky-larry': 'xefN48Dq40rKHHpNo8gn',
  'unlucky-ursula': 'ADk3UhQjkXzfOux4ovHq',
  // Dealers
  'maria-counter': 'jpAuqBXeKYYLghVhBB7o',
  'rookie-jenny': '3lml9PlMztMoeWCIPG3x',
  'strict-harold': 'kkDl4qrojTSu8MlI6LU8',
  'friendly-marcus': '9BWtsMINqrJLrRacOk9x',
  'oblivious-frank': 'ujmqDAETt3y1YijvpPw3',
  'veteran-lisa': 'q7bZH4lKxX0vZvOvobyX',
};

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY || 'sk_3b5ff415268a995766d1a0acdbb3ac81992283bf7db9b6f9';
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.STAGE === 'prod';
const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'nlmonorepo-bjcct-frontend-dev';

// Initialize S3 client
const s3Client = IS_PRODUCTION ? new S3Client({
  region: 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT,
}) : null;

/**
 * Generate a consistent filename hash for a given text and character
 */
function generateFilename(text: string, characterId: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${characterId}:${text}`)
    .digest('hex')
    .substring(0, 16);
  return `${characterId}_${hash}.mp3`;
}

/**
 * Check if audio file exists in S3
 */
async function checkS3FileExists(key: string): Promise<boolean> {
  if (!s3Client) return false;

  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload audio buffer to S3
 */
async function uploadToS3(key: string, buffer: Buffer): Promise<string> {
  if (!s3Client) throw new Error('S3 client not initialized');

  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'audio/mpeg',
  }));

  return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
}

/**
 * Check if audio file exists locally
 */
function checkLocalFileExists(filepath: string): boolean {
  return fs.existsSync(filepath);
}

/**
 * Save audio buffer locally
 */
function saveLocalFile(filepath: string, buffer: Buffer): void {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, buffer);
}

/**
 * Generate audio using ElevenLabs API
 */
async function generateAudio(text: string, voiceId: string): Promise<Buffer> {
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

  return Buffer.from(await response.arrayBuffer());
}

export async function POST(request: NextRequest) {
  try {
    const { text, characterId } = await request.json();

    if (!text || !characterId) {
      return NextResponse.json(
        { error: 'Missing required fields: text, characterId' },
        { status: 400 }
      );
    }

    const voiceId = VOICE_IDS[characterId];
    if (!voiceId) {
      return NextResponse.json(
        { error: `Unknown character: ${characterId}` },
        { status: 400 }
      );
    }

    const filename = generateFilename(text, characterId);

    // Production: Check S3 and upload if needed
    if (IS_PRODUCTION && s3Client) {
      const s3Key = `audio/generated/${filename}`;

      // Check if file already exists in S3
      const exists = await checkS3FileExists(s3Key);
      if (exists) {
        return NextResponse.json({
          audioUrl: `https://${S3_BUCKET}.s3.amazonaws.com/${s3Key}`,
          cached: true,
        });
      }

      // Generate and upload to S3
      const audioBuffer = await generateAudio(text, voiceId);
      const audioUrl = await uploadToS3(s3Key, audioBuffer);

      return NextResponse.json({
        audioUrl,
        cached: false,
      });
    }

    // Development: Check local filesystem and save if needed
    const localPath = path.join(
      process.cwd(),
      'public',
      'audio',
      'generated',
      filename
    );

    // Check if file already exists locally
    if (checkLocalFileExists(localPath)) {
      return NextResponse.json({
        audioUrl: `/audio/generated/${filename}`,
        cached: true,
      });
    }

    // Generate and save locally
    const audioBuffer = await generateAudio(text, voiceId);
    saveLocalFile(localPath, audioBuffer);

    return NextResponse.json({
      audioUrl: `/audio/generated/${filename}`,
      cached: false,
    });
  } catch (error) {
    console.error('TTS generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
