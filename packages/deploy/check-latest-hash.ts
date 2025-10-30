import { S3, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { writeFileSync } from 'fs';

const s3 = new S3({ region: 'ap-southeast-2' });

async function main() {
  // Get all build hashes
  const result = await s3.send(new ListObjectsV2Command({
    Bucket: 'nlmonorepo-thestoryhub-templates-dev',
    Prefix: 'resolvers/dev/',
    Delimiter: '/'
  }));

  const hashes = result.CommonPrefixes?.map(p => p.Prefix?.split('/')[2]).filter(Boolean) || [];
  console.log('Build hashes found:', hashes);

  if (hashes.length === 0) {
    console.log('No resolvers found in S3!');
    return;
  }

  // Get the latest hash (last one alphabetically is likely most recent)
  const latestHash = hashes.sort().reverse()[0];
  console.log('\nLatest hash:', latestHash);

  // Download the failing resolvers
  const failingResolvers = [
    'stories/Queries/Query.getStoryTree.js',
    'stories/Queries/Query.getReadingPath.js',
    'chapters/Queries/Query.listBranches.js',
    'chapters/Functions/Function.incrementVoteCount.js',
    'chapters/Functions/Function.incrementParentBranchCount.js',
    'notifications/Mutations/Mutation.markAllNotificationsAsRead.js',
  ];

  for (const path of failingResolvers) {
    try {
      const obj = await s3.send(new GetObjectCommand({
        Bucket: 'nlmonorepo-thestoryhub-templates-dev',
        Key: `resolvers/dev/${latestHash}/${path}`
      }));

      const body = await obj.Body?.transformToString();
      const filename = `/tmp/${path.split('/').pop()}`;
      writeFileSync(filename, body || '');
      console.log(`✅ Downloaded ${path}`);
    } catch (e: any) {
      console.log(`❌ Failed to download ${path}: ${e.message}`);
    }
  }
}

main().catch(console.error);
