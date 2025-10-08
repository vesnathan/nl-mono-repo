import { 
  S3Client, 
  PutObjectCommand, 
  ListObjectsV2Command,
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { 
  CloudFrontClient, 
  CreateInvalidationCommand,
  GetDistributionCommand 
} from '@aws-sdk/client-cloudfront';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { glob } from 'glob';
import { logger, getDebugMode } from './logger';
import { DeploymentOptions } from '../types';

export class FrontendDeploymentManager {
  private s3Client: S3Client;
  private cloudFrontClient: CloudFrontClient;
  private cloudFormationClient: CloudFormationClient;
  private region: string;
  private frontendPath: string;
  private buildPath: string;

  constructor(region = 'ap-southeast-2') {
    this.region = region;
    this.s3Client = new S3Client({ region });
    this.cloudFrontClient = new CloudFrontClient({ region });
    this.cloudFormationClient = new CloudFormationClient({ region });
    this.frontendPath = join(process.cwd(), '../cloudwatchlive/frontend');
    this.buildPath = join(this.frontendPath, '.next');
  }

  async deployFrontend(options: DeploymentOptions): Promise<void> {
    const { stage, skipFrontendBuild, skipUpload, skipInvalidation } = options;
    
    logger.debug(`Starting frontend deployment for stage: ${stage}`);

    // Get S3 bucket and CloudFront distribution from CloudFormation
    const { bucketName, distributionId } = await this.getDeploymentResources(stage);

    if (!skipFrontendBuild) {
      await this.buildFrontend(stage);
    }

    if (!skipUpload) {
      await this.uploadToS3(bucketName, stage);
    }

    if (!skipInvalidation && distributionId) {
      await this.invalidateCloudFront(distributionId);
    }
  }

  private async buildFrontend(stage?: string): Promise<void> {
    logger.debug('Building frontend application...');
    
    try {
      // Set environment variable to match deployment stage
      const envStage = stage || 'dev';
      
      // Build the frontend
      logger.debug('Building frontend application...');
      
      // Only show output in debug mode
      if (getDebugMode()) {
        const buildCommand = `cd ${this.frontendPath} && NODE_ENV=production NEXT_PUBLIC_ENVIRONMENT=${envStage} yarn build`;
        execSync(buildCommand, { stdio: 'inherit' });
      } else {
        // Suppress all output in non-debug mode by redirecting to /dev/null
        const buildCommand = `cd ${this.frontendPath} && NODE_ENV=production NEXT_PUBLIC_ENVIRONMENT=${envStage} yarn build > /dev/null 2>&1`;
        execSync(buildCommand, { stdio: 'ignore' });
      }
      
      logger.success('Frontend build completed successfully');
    } catch (error) {
      logger.error(`Frontend build failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async uploadToS3(bucketName: string, stage: string): Promise<void> {
    logger.debug(`Uploading frontend files to S3 bucket: ${bucketName}`);

    try {
      // Clear existing files in the bucket (optional - you might want to make this configurable)
      await this.clearS3Bucket(bucketName);

      // Upload static files from .next/static
      await this.uploadStaticFiles(bucketName);

      // Upload Next.js output files
      await this.uploadNextJSFiles(bucketName);

      logger.success('Frontend files uploaded successfully');
    } catch (error) {
      logger.error(`Frontend upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async clearS3Bucket(bucketName: string): Promise<void> {
    logger.debug('Clearing existing files from S3 bucket...');
    
    try {
      const listResponse = await this.s3Client.send(
        new ListObjectsV2Command({ Bucket: bucketName })
      );

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Delete existing objects
        for (const object of listResponse.Contents) {
          if (object.Key) {
            await this.s3Client.send(
              new DeleteObjectCommand({
                Bucket: bucketName,
                Key: object.Key
              })
            );
          }
        }
        logger.debug(`Cleared ${listResponse.Contents.length} existing files`);
      }
    } catch (error) {
      logger.warning(`Could not clear S3 bucket: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't throw here - this is not critical
    }
  }

  private async uploadStaticFiles(bucketName: string): Promise<void> {
    const staticPath = join(this.buildPath, 'static');
    
    if (!statSync(staticPath).isDirectory()) {
      logger.warning('No static files found to upload');
      return;
    }

    const files = glob.sync('**/*', { cwd: staticPath, nodir: true });
    
    for (const file of files) {
      const filePath = join(staticPath, file);
      const s3Key = `_next/static/${file}`;
      
      await this.uploadFile(bucketName, filePath, s3Key);
    }
    
    logger.debug(`Uploaded ${files.length} static files`);
  }

  private async uploadNextJSFiles(bucketName: string): Promise<void> {
    // Upload server files (for SSR/API routes if needed)
    const serverPath = join(this.buildPath, 'server');
    
    if (statSync(serverPath).isDirectory()) {
      const files = glob.sync('**/*', { cwd: serverPath, nodir: true });
      
      for (const file of files) {
        const filePath = join(serverPath, file);
        const s3Key = `_next/server/${file}`;
        
        await this.uploadFile(bucketName, filePath, s3Key);
      }
      
      logger.debug(`Uploaded ${files.length} server files`);
    }

    // Upload other Next.js files
    const buildFiles = ['BUILD_ID', 'routes-manifest.json', 'prerender-manifest.json'];
    
    for (const file of buildFiles) {
      const filePath = join(this.buildPath, file);
      try {
        if (statSync(filePath).isFile()) {
          await this.uploadFile(bucketName, filePath, `_next/${file}`);
        }
      } catch (error) {
        // File doesn't exist, skip
      }
    }
  }

  private async uploadFile(bucketName: string, filePath: string, s3Key: string): Promise<void> {
    const fileContent = readFileSync(filePath);
    const contentType = this.getContentType(filePath);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: fileContent,
        ContentType: contentType,
        CacheControl: this.getCacheControl(s3Key)
      })
    );
  }

  private getContentType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  private getCacheControl(s3Key: string): string {
    // Cache static assets for 1 year, everything else for 1 hour
    if (s3Key.includes('/_next/static/')) {
      return 'public, max-age=31536000, immutable';
    }
    return 'public, max-age=3600';
  }

  private async invalidateCloudFront(distributionId: string): Promise<void> {
    logger.debug(`Creating CloudFront invalidation for distribution: ${distributionId}`);
    
    try {
      const invalidationResponse = await this.cloudFrontClient.send(
        new CreateInvalidationCommand({
          DistributionId: distributionId,
          InvalidationBatch: {
            CallerReference: Date.now().toString(),
            Paths: {
              Quantity: 1,
              Items: ['/*']
            }
          }
        })
      );

      const invalidationId = invalidationResponse.Invalidation?.Id;
      logger.success(`CloudFront invalidation created: ${invalidationId}`);
    } catch (error) {
      logger.error(`CloudFront invalidation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async getDeploymentResources(stage: string): Promise<{ bucketName: string; distributionId?: string }> {
    try {
      // Get resources from CloudFormation stack
      const stackName = `nlmonorepo-cwl-${stage}`;
      const describeStacksResponse = await this.cloudFormationClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      const stack = describeStacksResponse.Stacks?.[0];
      if (!stack?.Outputs) {
        throw new Error(`No outputs found for stack ${stackName}`);
      }

      // Find S3 bucket name
      const bucketOutput = stack.Outputs.find(output => 
        output.OutputKey?.includes('S3Bucket') || 
        output.OutputKey?.includes('FrontendBucket') || 
        output.OutputKey?.includes('WebsiteBucket')
      );
      
      if (!bucketOutput?.OutputValue) {
        throw new Error('Could not find S3 bucket name in stack outputs');
      }

      // Find CloudFront distribution ID (optional)
      const distributionOutput = stack.Outputs.find(output => 
        output.OutputKey?.includes('CloudFront') || 
        output.OutputKey?.includes('Distribution')
      );

      return {
        bucketName: bucketOutput.OutputValue,
        distributionId: distributionOutput?.OutputValue
      };
    } catch (error) {
      logger.error(`Error getting deployment resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async buildOnly(): Promise<void> {
    logger.info('Building frontend only...');
    await this.buildFrontend();
    logger.success('Frontend build completed!');
  }

  async uploadOnly(options: DeploymentOptions): Promise<void> {
    const { stage } = options;
    logger.info(`Starting frontend upload for stage: ${stage}`);
    const { bucketName } = await this.getDeploymentResources(stage);
    await this.uploadToS3(bucketName, stage);
  }

  async invalidateOnly(options: DeploymentOptions): Promise<void> {
    const { stage } = options;
    logger.info(`Starting CloudFront invalidation for stage: ${stage}`);
    const { distributionId } = await this.getDeploymentResources(stage);
    if (distributionId) {
      await this.invalidateCloudFront(distributionId);
      logger.success('CloudFront invalidation completed!');
    } else {
      logger.warning('No CloudFront distribution found - skipping invalidation');
    }
  }
}
