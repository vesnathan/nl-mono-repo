const { CloudFront } = require("@aws-sdk/client-cloudfront");

const CF = new CloudFront();

/**
 * This function will be invoked after a deployment that includes front-end update
 * 1. Create cloudfront invalidation
 */
export async function handler() {
  const cloudFrontInvalidation = async () => {
    const DistributionId = process.env.cwlCloudFrontDistributionId;
    await CF.createInvalidation({
      DistributionId,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: 1,
          Items: ["/*"],
        },
      },
    });
  };

  await Promise.all([cloudFrontInvalidation()]);
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
    }),
  };
}
