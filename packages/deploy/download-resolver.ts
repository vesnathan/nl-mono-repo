import { S3, GetObjectCommand } from '@aws-sdk/client-s3';
import { writeFileSync } from 'fs';

const s3 = new S3({ region: 'ap-southeast-2' });

async function downloadResolver(hash: string, path: string, outFile: string) {
  const result = await s3.send(new GetObjectCommand({
    Bucket: 'nlmonorepo-thestoryhub-templates-dev',
    Key: `resolvers/dev/${hash}/${path}`
  }));

  const body = await result.Body?.transformToString();
  writeFileSync(outFile, body || '');
  console.log(`Downloaded ${path} to ${outFile}`);
  console.log('File size:', body?.length);
}

const hash = '87c6686fc8555f3c';

Promise.all([
  downloadResolver(hash, 'stories/Queries/Query.getStoryTree.js', '/tmp/getStoryTree.js'),
  downloadResolver(hash, 'chapters/Functions/Function.incrementVoteCount.js', '/tmp/incrementVoteCount.js'),
  downloadResolver(hash, 'chapters/Queries/Query.listBranches.js', '/tmp/listBranches.js'),
]).catch(console.error);
