#!/usr/bin/env node
/**
 * Pre-generate all dialogue audio during build
 * Saves files to S3 for CloudFront deployments or locally for dev
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const IS_PRODUCTION = process.env.STAGE === 'prod' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod';
const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'nlmonorepo-bjcct-frontend-dev';

if (!ELEVEN_API_KEY) {
  console.error('Error: ELEVEN_API_KEY environment variable not set');
  process.exit(1);
}

// Initialize S3 client for production
const s3Client = IS_PRODUCTION ? new S3Client({
  region: 'us-east-1',
}) : null;

interface DialogueLine {
  characterId: string;
  text: string;
}

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
 * Generate audio using ElevenLabs API
 */
async function generateAudio(text: string, voiceId: string): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_API_KEY!,
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

/**
 * Upload audio to S3
 */
async function uploadToS3(key: string, buffer: Buffer): Promise<void> {
  if (!s3Client) throw new Error('S3 client not initialized');

  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'audio/mpeg',
  }));
}

/**
 * Save audio locally
 */
function saveLocally(filepath: string, buffer: Buffer): void {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, buffer);
}

/**
 * Extract all dialogue lines from character conversation files
 */
function extractDialogueLines(): DialogueLine[] {
  const lines: DialogueLine[] = [];

  // Path to conversation data
  const conversationsPath = path.join(
    process.cwd(),
    'src',
    'data',
    'dialogue',
    'conversations.ts'
  );

  if (!fs.existsSync(conversationsPath)) {
    console.warn('Warning: conversations.ts not found, skipping dialogue extraction');
    return lines;
  }

  const content = fs.readFileSync(conversationsPath, 'utf-8');

  // Extract text patterns from conversation turns
  // This is a simple regex-based extraction - can be improved
  const textMatches = content.matchAll(/text:\s*["'`]([^"'`]+)["'`]/g);

  for (const match of textMatches) {
    const text = match[1];
    // Try to find character context (simplified - may need refinement)
    const characterMatches = content.matchAll(/character:\s*["']([^"']+)["']/g);
    for (const charMatch of characterMatches) {
      lines.push({
        characterId: charMatch[1],
        text: text,
      });
    }
  }

  return lines;
}

/**
 * Process a single dialogue line
 */
async function processLine(
  line: DialogueLine,
  index: number,
  total: number
): Promise<void> {
  const { characterId, text } = line;
  const voiceId = VOICE_IDS[characterId];

  if (!voiceId) {
    console.warn(`Skipping unknown character: ${characterId}`);
    return;
  }

  const filename = generateFilename(text, characterId);

  try {
    // Check if file already exists
    if (IS_PRODUCTION) {
      const s3Key = `audio/generated/${filename}`;
      // For now, always generate (checking S3 existence adds complexity)
      console.log(`[${index + 1}/${total}] Generating: ${text.substring(0, 50)}...`);
      const audioBuffer = await generateAudio(text, voiceId);
      await uploadToS3(s3Key, audioBuffer);
      console.log(`✓ Uploaded to S3: ${s3Key}`);
    } else {
      const localPath = path.join(process.cwd(), 'public', 'audio', 'generated', filename);
      if (fs.existsSync(localPath)) {
        console.log(`[${index + 1}/${total}] Cached: ${text.substring(0, 50)}...`);
        return;
      }
      console.log(`[${index + 1}/${total}] Generating: ${text.substring(0, 50)}...`);
      const audioBuffer = await generateAudio(text, voiceId);
      saveLocally(localPath, audioBuffer);
      console.log(`✓ Saved locally: ${localPath}`);
    }

    // Rate limiting - ElevenLabs free tier has limits
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error(`✗ Failed to process "${text}":`, error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Dialogue Audio Generation ===');
  console.log(`Environment: ${IS_PRODUCTION ? 'Production (S3)' : 'Development (Local)'}`);
  console.log(`S3 Bucket: ${S3_BUCKET}`);
  console.log('');

  // Extract all dialogue lines
  console.log('Extracting dialogue lines...');
  const lines = extractDialogueLines();
  console.log(`Found ${lines.length} dialogue lines`);
  console.log('');

  if (lines.length === 0) {
    console.log('No dialogue lines found. Exiting.');
    return;
  }

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    await processLine(lines[i], i, lines.length);
  }

  console.log('');
  console.log('=== Generation Complete ===');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
