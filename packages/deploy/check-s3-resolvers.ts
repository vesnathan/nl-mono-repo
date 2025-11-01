import { S3, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3({ region: "ap-southeast-2" });

async function checkResolvers() {
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: "nlmonorepo-thestoryhub-templates-dev",
      Prefix: "resolvers/dev/",
      MaxKeys: 200,
    }),
  );

  console.log("Found", result.Contents?.length || 0, "files in S3");
  console.log("\nResolver files:");
  result.Contents?.forEach((obj) => {
    console.log(" -", obj.Key);
  });
}

checkResolvers().catch(console.error);
