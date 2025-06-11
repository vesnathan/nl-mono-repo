import { execSync, spawn } from 'child_process';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs-extra'; // Changed to fs-extra for better file system operations
import * as path from 'path';
import * as os from 'os'; // Added import
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from './logger'; // Corrected import
import * as esbuild from 'esbuild'; // Added import for esbuild

// Assuming these types are defined elsewhere or should be defined
interface ResolverCompilationResult {
  resolverFile: string;
  s3Key: string;
  localPath: string;
}

interface ResolverInfo {
    typescriptPath: string;
    javascriptPath: string;
    s3Key: string;
    // Add other necessary properties if any
}

export interface ResolverCompilerOptions {
  logger: typeof logger;
  baseResolverDir: string;
  s3KeyPrefix: string;
  stage: string;
  localSavePathBase?: string;
  localSaveEnabled?: boolean;
  s3BucketName: string;
  region: string;
  resolverFiles: string[];
  sharedFileName?: string;
  sharedFileS3Key?: string;
}

class ResolverCompiler {
  private logger: typeof logger;
  private baseResolverDir: string;
  private buildDir: string;
  private tempBuildDir!: string;
  private s3KeyPrefix: string;
  private stage: string; // Declared
  private localSavePathBase: string; // Declared
  private localSaveEnabled: boolean; // Declared
  private resolverFiles: string[]; // Declared
  private s3BucketName: string;
  private s3Client: S3Client;
  private region: string;
  private sharedFileName?: string; // Declared
  private sharedFileS3Key?: string; // Declared

  private readonly gqlTypesSourceFileName = 'gqlTypes.ts';

  constructor(options: ResolverCompilerOptions) {
    this.logger = options.logger;
    this.baseResolverDir = options.baseResolverDir;
    this.s3KeyPrefix = options.s3KeyPrefix;
    this.stage = options.stage; // Initialized
    this.localSavePathBase = options.localSavePathBase || path.join(process.cwd(), '.compiled_resolvers'); // Initialized
    this.localSaveEnabled = options.localSaveEnabled === undefined ? false : options.localSaveEnabled; // Initialized
    this.s3BucketName = options.s3BucketName;
    this.region = options.region;
    this.resolverFiles = options.resolverFiles; // Initialized
    this.sharedFileName = options.sharedFileName; // Initialized
    this.sharedFileS3Key = options.sharedFileS3Key; // Initialized
    this.s3Client = new S3Client({ region: this.region });

    // buildDir is a temporary directory for the entire compilation process of this instance.
    // It will be created by setupBuildDirectory and cleaned up by cleanupBuildDirectory.
    this.buildDir = path.join(os.tmpdir(), `nl_resolver_build_${this.stage}_${Date.now()}`);
    // this.tempBuildDir (for individual resolver temp files) will be set up within this.buildDir later.
  }

  private async recursiveCopy(src: string, dest: string): Promise<void> {
    await fsPromises.mkdir(dest, { recursive: true });
    const entries = await fsPromises.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await this.recursiveCopy(srcPath, destPath);
      } else {
        await fsPromises.copyFile(srcPath, destPath);
      }
    }
  }

  // Assume findLocalTypescriptCompiler is defined
  private async findLocalTypescriptCompiler(): Promise<string> {
    // Placeholder implementation
    return 'tsc';
  }
  
  // Assume addHeaderToJs is defined
  private addHeaderToJs(jsContent: string, sourceFilePath: string, targetS3Key: string): string {
    // Placeholder implementation
    const header = `// Compiled from: ${sourceFilePath}\\n// Target S3 Key: ${targetS3Key}\\n`;
    return header + jsContent;
  }

  // Assume uploadToS3 is defined
  private async uploadToS3(s3Key: string, content: string, contentType: string): Promise<void> {
    // Placeholder implementation
    await this.s3Client.send(new PutObjectCommand({
        Bucket: this.s3BucketName,
        Key: s3Key,
        Body: content,
        ContentType: contentType
    }));
  }


  private async runTsc(cwd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    const tscPath = await this.findLocalTypescriptCompiler();
    return new Promise((resolve, reject) => {
      const process = spawn(tscPath, args, { cwd, stdio: 'pipe' });
      let stdout = '';
      let stderr = '';
      process.stdout.on('data', (data) => (stdout += data.toString()));
      process.stderr.on('data', (data) => (stderr += data.toString()));
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`tsc exited with code ${code}\\\\nstdout: ${stdout}\\\\nstderr: ${stderr}`));
        }
      });
      process.on('error', (err) => reject(err));
    });
  }

  private async compileAndUploadSharedFile(): Promise<void> {
    if (!this.sharedFileName || !this.sharedFileS3Key) {
      this.logger.info('No shared file specified, skipping shared file compilation.');
      return;
    }
    this.logger.info(`Compiling shared file: ${this.sharedFileName}`);
    const sourceFilePath = path.join(this.baseResolverDir, this.sharedFileName);
    const targetS3Key = path.posix.join(this.s3KeyPrefix, this.stage, this.sharedFileS3Key);

    const tempCompileDir = path.join(this.buildDir, `__${path.basename(this.sharedFileName, '.ts')}Compilation`);
    await fsPromises.rm(tempCompileDir, { recursive: true, force: true }).catch(() => { /* ignore if not exists */ });
    await fsPromises.mkdir(tempCompileDir, { recursive: true });

    const tempSourceFilePath = path.join(tempCompileDir, this.sharedFileName);
    await fsPromises.copyFile(sourceFilePath, tempSourceFilePath);

    // Create package.json
    const packageJsonContent = {
      name: `compile-${path.basename(this.sharedFileName, '.ts').toLowerCase()}`, // Ensure valid package name
      version: '1.0.0',
      private: true,
      type: 'module',
      dependencies: {
        "graphql": "^16.9.0" // Version from root package.json
      },
      devDependencies: {
        "typescript": "5.5.4" // Version from root package.json
      }
    };
    const packageJsonPath = path.join(tempCompileDir, 'package.json');
    await fsPromises.writeFile(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
    this.logger.info(`Created package.json for ${this.sharedFileName} in ${tempCompileDir}`);

    // Install dependencies
    try {
      this.logger.info(`Installing dependencies for ${this.sharedFileName} in ${tempCompileDir} using Yarn...`);
      const yarnInstallOutput = execSync('yarn install --ignore-scripts --no-progress --non-interactive --frozen-lockfile', { // Added --frozen-lockfile
        cwd: tempCompileDir,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      this.logger.info(`Yarn install completed for ${this.sharedFileName}. Output:\\n${yarnInstallOutput}`);
    } catch (error: any) {
      this.logger.error(`Yarn install failed for ${this.sharedFileName} in ${tempCompileDir}: ${(error as Error).message}`);
      if (error.stdout) this.logger.error(`Yarn stdout:\\n${error.stdout.toString()}`);
      if (error.stderr) this.logger.error(`Yarn stderr:\\n${error.stderr.toString()}`);
      await fsPromises.rm(tempCompileDir, { recursive: true, force: true });
      throw error;
    }

    const tsconfigContent = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'node',
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        declaration: false,
        sourceMap: false,
        outDir: '.', // Output .js file in the same directory (tempCompileDir)
        rootDir: '.',
        resolveJsonModule: true, // Often useful
      },
      files: [this.sharedFileName], // Compile only the specific file
      exclude: ["node_modules"]
    };
    const tsconfigPath = path.join(tempCompileDir, 'tsconfig.json');
    await fsPromises.writeFile(tsconfigPath, JSON.stringify(tsconfigContent, null, 2));
    this.logger.info(`Created tsconfig.json for ${this.sharedFileName} in ${tempCompileDir}`);

    try {
      this.logger.info(`Running yarn tsc for ${this.sharedFileName} in ${tempCompileDir}`);
      const tscOutput = execSync('yarn tsc --project tsconfig.json --listEmittedFiles', {
        cwd: tempCompileDir,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      this.logger.info(`TSC Output for ${this.sharedFileName}:\\n${tscOutput}`);
    } catch (error: any) {
      this.logger.error(`Error compiling ${this.sharedFileName}: ${(error as Error).message}`);
      if (error.stdout) this.logger.error(`TSC stdout:\\n${error.stdout.toString()}`);
      if (error.stderr) this.logger.error(`TSC stderr:\\n${error.stderr.toString()}`);
      // Log contents of tempCompileDir for debugging
      try {
        const dirContents = await fsPromises.readdir(tempCompileDir, {withFileTypes: true});
        this.logger.error(`Contents of ${tempCompileDir} on failure:`);
        dirContents.forEach(entry => this.logger.error(`${entry.name}${entry.isDirectory() ? '/' : ''}`));
      } catch (lsError) {
        this.logger.error(`Could not list contents of ${tempCompileDir}: ${(lsError as Error).message}`);
      }
      await fsPromises.rm(tempCompileDir, { recursive: true, force: true });
      throw error;
    }

    const compiledJsFileName = `${path.basename(this.sharedFileName, '.ts')}.js`;
    const compiledJsPath = path.join(tempCompileDir, compiledJsFileName);

    try {
        await fsPromises.access(compiledJsPath, fs.constants.F_OK);
        this.logger.info(`Successfully found compiled file: ${compiledJsPath}`);
    } catch (e) {
        this.logger.error(`Compiled file not found at ${compiledJsPath} after tsc run.`);
        this.logger.error(`Contents of ${tempCompileDir} (if not logged above):`);
        try {
            const dirContents = await fsPromises.readdir(tempCompileDir);
            this.logger.error(dirContents.join('\\n'));
        } catch (lsError) {
            this.logger.error(`Could not list contents of ${tempCompileDir}: ${(lsError as Error).message}`);
        }
        await fsPromises.rm(tempCompileDir, { recursive: true, force: true });
        throw new Error(`Compilation output ${compiledJsFileName} not found in ${tempCompileDir}.`);
    }

    let jsContent = await fsPromises.readFile(compiledJsPath, 'utf-8');
    jsContent = this.addHeaderToJs(jsContent, sourceFilePath, targetS3Key);

    // Save locally if enabled
    if (this.localSaveEnabled && this.localSavePathBase) {
      const localSavePath = path.join(this.localSavePathBase, this.sharedFileS3Key);
      await this.saveCompiledFileLocally(localSavePath, jsContent);
    }

    await this.uploadToS3(targetS3Key, jsContent, 'application/javascript');
    this.logger.info(`Uploaded ${compiledJsFileName} to S3: s3://${this.s3BucketName}/${targetS3Key}`);

    await fsPromises.rm(tempCompileDir, { recursive: true, force: true });
    this.logger.info(`Cleaned up temp compile directory: ${tempCompileDir}`);
  }

  public async compileAndUploadResolvers(): Promise<void> {
    this.logger.info('Starting resolver compilation and upload...');
    await this.setupBuildDirectory(); // Ensure buildDir is set up first
    await this.compileAndUploadSharedFile(); // Ensure shared file is compiled first

    const totalFiles = this.resolverFiles.length;
    for (let index = 0; index < totalFiles; index++) {
      const resolverFileRelativePath = this.resolverFiles[index];

      if (resolverFileRelativePath === this.sharedFileName) {
        this.logger.info(`Skipping inlining/recompilation of shared file: ${resolverFileRelativePath} in main loop.`);
        continue;
      }

      this.logger.info(`[${index + 1}/${totalFiles}] Processing resolver: ${resolverFileRelativePath}...`);
      const resolverAbsolutePath = path.join(this.baseResolverDir, resolverFileRelativePath);

      try {
        const originalResolverSourceCode = await fsPromises.readFile(resolverAbsolutePath, 'utf-8');
        
        // Pass the original source code and its absolute path for context
        const compiledJsContent = await this.compileTypeScript(
          originalResolverSourceCode, 
          resolverAbsolutePath 
        );

        const s3Key = path.posix.join(this.s3KeyPrefix, this.stage, resolverFileRelativePath.replace('.ts', '.js'));
        await this.uploadToS3(s3Key, compiledJsContent, 'application/javascript');
        this.logger.info(`Uploaded ${resolverFileRelativePath} to S3: s3://${this.s3BucketName}/${s3Key}`);

        if (this.localSaveEnabled && this.localSavePathBase) {
          const localJsFileName = path.basename(s3Key);
          const relativeDirFromBase = path.dirname(resolverFileRelativePath);
          const localSaveDir = path.join(this.localSavePathBase, this.s3KeyPrefix, this.stage, relativeDirFromBase);
          const localSavePath = path.join(localSaveDir, localJsFileName);
          await this.saveCompiledFileLocally(localSavePath, compiledJsContent);
        }
      } catch (error: any) {
        this.logger.error(`Failed to compile or upload resolver ${resolverFileRelativePath}: ${error.message}`);
        // Optionally re-throw or collect errors to report at the end
      }
    }
    this.logger.info('Finished all resolver processing.');
    // await this.cleanupBuildDirectory(); // Cleanup buildDir after all operations
  }

  private async saveCompiledFileLocally(localPath: string, content: string): Promise<void> {
    try {
      await fsPromises.mkdir(path.dirname(localPath), { recursive: true });
      await fsPromises.writeFile(localPath, content);
      this.logger.info(`Saved compiled file to ${localPath}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to save compiled file to ${localPath}: ${error.message}`);
      } else {
        this.logger.error(`Failed to save compiled file to ${localPath}: ${String(error)}`);
      }
      throw error;
    }
  }

  private async setupBuildDirectory(): Promise<void> {
    this.logger.info(`Setting up build directory: ${this.buildDir}`);
    await fsPromises.rm(this.buildDir, { recursive: true, force: true });
    await fsPromises.mkdir(this.buildDir, { recursive: true });

    // Initialize tempBuildDir as a subdirectory of buildDir
    // This path will be used for individual resolver compilations and cleaned up by compileTypeScript
    this.tempBuildDir = path.join(this.buildDir, '__temp_individual_resolver_builds__');
    // Note: prepareBuildDirectory (called by compileTypeScript) will manage cleaning/creating this.tempBuildDir for each resolver.

    const gqlTypesSourcePath = path.join(this.baseResolverDir, this.gqlTypesSourceFileName);
    const gqlTypesDestPathInBuild = path.join(this.buildDir, this.gqlTypesSourceFileName);
    try {
      await fsPromises.copyFile(gqlTypesSourcePath, gqlTypesDestPathInBuild);
      this.logger.info(`Copied ${this.gqlTypesSourceFileName} to build directory for resolver compilation context.`);
    } catch (error) {
      this.logger.error(`Failed to copy ${this.gqlTypesSourceFileName} to build directory: ${(error as Error).message}`);
    }
    
    try {
      const utilsSrc = path.dirname(require.resolve('@aws-appsync/utils/package.json'));
      const utilsDest = path.join(this.buildDir, 'node_modules', '@aws-appsync', 'utils');
      await fsPromises.mkdir(path.dirname(utilsDest), { recursive: true }); 
      await this.recursiveCopy(utilsSrc, utilsDest); 
      this.logger.info(`Copied @aws-appsync/utils to ${utilsDest} for compilation.`);
    } catch (error) {
      this.logger.error(`Failed to copy @aws-appsync/utils: ${(error as Error).message}. This may cause compilation errors.`);
    }
  }

  private async copyResolverDependencies(buildDir: string, resolverPath: string): Promise<void> {
    // This method's logic might need review if compileTypeScript uses 'buildDir' argument
    // For now, it's less critical as compileTypeScript uses this.tempBuildDir
    const resolverPathRelativeToBase = path.relative(this.baseResolverDir, resolverPath);
    const resolverDirNameInBuild = path.dirname(resolverPathRelativeToBase); 
    const specificResolverBuildContextDir = path.join(buildDir, resolverDirNameInBuild);

    await fsPromises.mkdir(specificResolverBuildContextDir, { recursive: true });

    const utilsSrcPath = path.join(path.dirname(require.resolve('@aws-appsync/utils/package.json')), 'lib');
    const utilsDestPath = path.join(specificResolverBuildContextDir, 'node_modules', '@aws-appsync', 'utils', 'lib');
    await fsPromises.mkdir(path.dirname(utilsDestPath), { recursive: true }); 
    try {
      await this.recursiveCopy(utilsSrcPath, utilsDestPath); 
    } catch (e) {
      this.logger.warning(`Could not copy @aws-appsync/utils to ${utilsDestPath} (may be ok if global copy is used): ${(e as Error).message}`);
    }
    this.logger.info(`Dependencies for ${resolverPathRelativeToBase} should be resolved from global copies in buildDir.`);
  }

  private getResolverNameFromPath(relativePath: string): string {
    const filename = path.basename(relativePath, '.ts');
    let fieldName = filename;
    if (filename.includes('.')) {
      fieldName = filename.split('.')[1];
    } else if (filename.includes('_')) {
      fieldName = filename.split('_')[1];
    }
    return fieldName;
  }

  private async prepareBuildDirectory(): Promise<void> { // This prepares this.tempBuildDir
    if (!this.tempBuildDir) {
      const errorMessage = 'this.tempBuildDir path is not initialized. It should be set by setupBuildDirectory.';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    try {
      await fsPromises.rm(this.tempBuildDir, { recursive: true, force: true });
    } catch { /* Directory might not exist, which is fine */ }
    await fsPromises.mkdir(this.tempBuildDir, { recursive: true });
  }

  private async setupBuildConfiguration(): Promise<void> { // This configures this.tempBuildDir
    const packageJson = {
      name: "appsync-resolvers-build",
      version: "1.0.0",
      type: "module",
      private: true,
      dependencies: {
        "@aws-appsync/utils": "^1.1.1", // Existing dependency
        "graphql": "^16.9.0",         // Added: For gqlTypes.ts
        "zod": "^3.23.0"              // Added: For resolvers like getProcessEnv.ts
      },
      devDependencies: {
        "typescript": "5.5.4",        // Updated: Aligned with root, for compilation
        "@types/node": "^20.12.0"     // Added: For Node.js globals like 'process'
      }
    };
    await fsPromises.writeFile(path.join(this.tempBuildDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    const tsConfig = {
      compilerOptions: {
        target: "es2020",
        module: "esnext",
        moduleResolution: "node",
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        strict: true,
        skipLibCheck: true,
        outDir: "./dist", 
        rootDir: ".", 
        baseUrl: ".", 
        paths: {
          "gqlTypes": ["./gqlTypes.ts"], 
          // Ensure paths here correctly point to files copied into this.tempBuildDir
        }
      },
      include: ["**/*.ts"],
      exclude: ["node_modules", "dist"]
    };
    await fsPromises.writeFile(path.join(this.tempBuildDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
    this.logger.info('Created package.json and tsconfig.json in temp build directory');
  }

  private async compileTypeScript(originalResolverSourceCode: string, resolverAbsolutePath: string): Promise<string> {
    const resolverFileName = path.basename(resolverAbsolutePath);
    this.logger.info(`Starting compilation for: ${resolverFileName} (from ${resolverAbsolutePath}) using temp build directory: ${this.tempBuildDir}`);
    
    let codeToCompile = originalResolverSourceCode;

    // Check for 'gqlTypes' import and inline if found
    const gqlTypesImportRegex = /import\\s+\\{[^}]*\\}\\s+from\\s+['"]gqlTypes['"];?\\s*\\n?/g;
    if (gqlTypesImportRegex.test(originalResolverSourceCode)) {
      this.logger.info(`Found import from 'gqlTypes' in ${resolverFileName}. Inlining content.`);
      const gqlTypesPath = path.join(this.baseResolverDir, this.gqlTypesSourceFileName);
      if (!fs.existsSync(gqlTypesPath)) {
        this.logger.error(`gqlTypes.ts not found at ${gqlTypesPath} for inlining into ${resolverFileName}.`);
        throw new Error(`gqlTypes.ts not found: ${gqlTypesPath}`);
      }
      const gqlTypesContent = await fsPromises.readFile(gqlTypesPath, 'utf-8');
      
      // Remove the import statement(s)
      codeToCompile = originalResolverSourceCode.replace(gqlTypesImportRegex, '');
      // Prepend the entire gqlTypes.ts content
      codeToCompile = gqlTypesContent + "\\n\\n// Original content below:\\n" + codeToCompile;
      this.logger.info(`Inlined gqlTypes.ts content into ${resolverFileName}.`);
    } else {
      this.logger.info(`No import from 'gqlTypes' found in ${resolverFileName}. Compiling as is.`);
    }
    
    await this.prepareBuildDirectory(); 
    
    const tempResolverPath = path.join(this.tempBuildDir, resolverFileName);
    await fsPromises.writeFile(tempResolverPath, codeToCompile);
    this.logger.info(`Wrote (potentially modified) ${resolverFileName} to ${tempResolverPath}`);

    const gqlTypesSource = path.join(this.baseResolverDir, this.gqlTypesSourceFileName);
    const gqlTypesDestInTemp = path.join(this.tempBuildDir, this.gqlTypesSourceFileName);
    try {
      await fsPromises.copyFile(gqlTypesSource, gqlTypesDestInTemp);
      this.logger.info(`Copied ${this.gqlTypesSourceFileName} to ${gqlTypesDestInTemp} (for tsconfig paths and fallback if inlining was partial)`);
    } catch (e: any) {
      this.logger.warning(`Could not copy ${this.gqlTypesSourceFileName} to temp dir: ${e.message}.`);
    }

    await this.setupBuildConfiguration(); 

    try {
      this.logger.info(`Installing dependencies in ${this.tempBuildDir} using Yarn...`);
      execSync('yarn install --ignore-scripts --frozen-lockfile --no-progress --non-interactive', { cwd: this.tempBuildDir, stdio: 'pipe', encoding: 'utf8' });
      this.logger.info('Yarn install completed.');

      this.logger.info(`Contents of ${this.tempBuildDir} before compilation:`);
      this.logger.info(execSync('ls -R', { cwd: this.tempBuildDir, encoding: 'utf8' }));
      
      const esbuildConfig = {
        entryPoints: [tempResolverPath],
        bundle: true,
        outfile: path.join(this.tempBuildDir, 'dist', resolverFileName.replace('.ts', '.js')),
        platform: 'node', // Keep as node for AppSync VTL JS runtime
        format: 'esm', // AppSync JS resolvers are ES modules
        target: 'es2020', 
        sourcemap: false, 
        minify: false, // Minification can sometimes obscure runtime errors
        tsconfig: path.join(this.tempBuildDir, 'tsconfig.json'), 
        external: ['@aws-appsync/utils'], // Provided by AppSync runtime
        logLevel: 'info', 
      };

      this.logger.info(`Running esbuild for ${resolverFileName} with config: ${JSON.stringify(esbuildConfig, null, 2)}`);
      await esbuild.build(esbuildConfig as any); // Cast to any to handle potential esbuild version differences if strict type fails
      this.logger.info(`esbuild compilation successful for ${resolverFileName}.`);


      this.logger.info(`Contents of ${this.tempBuildDir}/dist after compilation:`);
      this.logger.info(execSync('ls -R dist', { cwd: this.tempBuildDir, encoding: 'utf8' }));
      
      const compiledJsFileName = `${path.basename(resolverFileName, '.ts')}.js`;
      const compiledJsPath = path.join(this.tempBuildDir, 'dist', compiledJsFileName);
      
      this.logger.info(`Reading compiled file from: ${compiledJsPath}`);
      if (!await fsPromises.stat(compiledJsPath).then(() => true).catch(() => false)) {
          this.logger.error(`Compiled file not found at ${compiledJsPath}`);
          throw new Error(`Compiled JS file not found for ${resolverFileName}`);
      }
      let jsContent = await fsPromises.readFile(compiledJsPath, 'utf-8');
      
      const s3Key = path.posix.join(this.s3KeyPrefix, this.stage, resolverFileName.replace('.ts', '.js'));
      jsContent = this.addHeaderToJs(jsContent, resolverAbsolutePath, s3Key);

      // No need to clean up this.tempBuildDir here, it's reused or cleaned by prepareBuildDirectory
      
      return jsContent;

    } catch (error: any) {
      this.logger.error(`TypeScript compilation failed for ${resolverAbsolutePath}: ${error.message}`);
      if (error.stderr) this.logger.error(`Compilation errors:\\n${error.stderr.toString()}`);
      if (error.stdout) this.logger.error(`Compilation output:\\n${error.stdout.toString()}`);
      // Optionally, leave tempBuildDir for inspection on failure, or clean it up
      // await fsPromises.rm(this.tempBuildDir, { recursive: true, force: true });
      throw error;
    }
  }

  private async uploadCompiledResolvers(
    bucketName: string,
    resolverMap: Map<string, ResolverInfo> // ResolverInfo needs to be defined
  ): Promise<void> {
    this.logger.info('Uploading compiled resolvers to S3 from persistent local copies...');
    const { HeadBucketCommand, CreateBucketCommand } = require('@aws-sdk/client-s3'); // Keep require here if it's conditional

    try {
        await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        this.logger.success(`Verified bucket ${bucketName} exists`);
    } catch (bucketError: any) {
        // ... (bucket creation logic remains the same)
        if (bucketError.name === 'NotFound' || bucketError.name === 'NoSuchBucket') {
            this.logger.error(`❌ CRITICAL: S3 bucket ${bucketName} does not exist.`);
            this.logger.error(`Creating bucket now to prevent resolver deployment failure.`);
            try {
              const createParams: any = { 
                Bucket: bucketName,
                ObjectOwnership: 'BucketOwnerEnforced' // Example, adjust as needed
              };
              if (this.region !== 'us-east-1') {
                createParams.CreateBucketConfiguration = { LocationConstraint: this.region };
              }
              await this.s3Client.send(new CreateBucketCommand(createParams));
              this.logger.success(`Created bucket ${bucketName} in region ${this.region}`);
              await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for bucket propagation
               try {
                 await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
                 this.logger.success(`Verified newly created bucket ${bucketName} is accessible`);
               } catch (verifyError: any) {
                 throw new Error(`Bucket ${bucketName} was created but is not accessible: ${verifyError.message}`);
               }
            } catch (createError: any) {
              if (createError.name === 'BucketAlreadyOwnedByYou') {
                this.logger.success(`Bucket ${bucketName} already exists and is owned by you.`);
              } else {
                throw new Error(`Failed to create S3 bucket ${bucketName}: ${createError.message}.`);
              }
            }
          } else {
            throw new Error(`Error checking bucket ${bucketName}: ${bucketError.message}`);
          }
    }

    for (const [resolverName, info] of resolverMap) {
      try {
        const jsContent = await fsPromises.readFile(info.javascriptPath, 'utf8');
        await this.s3Client.send(new PutObjectCommand({
          Bucket: bucketName, Key: info.s3Key, Body: jsContent, ContentType: 'application/javascript'
        }));
        this.logger.info(`Uploaded ${resolverName} (${info.s3Key}) from ${info.javascriptPath} to S3`);
      } catch (error: any) {
        this.logger.error(`Failed to upload resolver ${resolverName} (${info.s3Key}) from ${info.javascriptPath}: ${error.message}`);
      }
    }
  }

  private async findJavaScriptFileByName(jsFileName: string): Promise<string[]> {
    // This method searches in this.tempBuildDir, which might be an issue if tempBuildDir is cleaned up per resolver
    // It's currently not used by the main flow after recent changes.
    const findCommand = `find . -name "${jsFileName}"`;
    const foundFiles = execSync(findCommand, {
      cwd: this.tempBuildDir, encoding: 'utf8'
    }).trim().split('\\n').filter(Boolean);
    return foundFiles.map(file => path.join(this.tempBuildDir, file.trim()));
  }

  private async cleanupBuildDirectory(): Promise<void> { // Cleans up this.buildDir
    this.logger.info(`Cleaning up main build directory: ${this.buildDir}`);
    try {
      await fsPromises.rm(this.buildDir, { recursive: true, force: true });
      this.logger.success(`Successfully removed ${this.buildDir}`);
    } catch (error: any) {
      this.logger.warning(`Failed to remove main build directory ${this.buildDir}: ${error.message}`);
    }
  }
  
  getResolverS3Location(bucketName: string, stage: string, resolverPath: string): string {
    const jsPath = resolverPath.replace('.ts', '.js');
    const s3Key = `resolvers/${stage}/${jsPath}`;
    return `s3://${bucketName}/${s3Key}`;
  }

  // createSimplifiedSharedFunctions is not directly used by the core compilation logic shown
  // but kept for completeness if it's called elsewhere.
  private async createSimplifiedSharedFunctions(): Promise<void> {
    const sharedFunctionsDir = path.join(this.tempBuildDir, 'shared/functions'); // Operates on tempBuildDir
    await fsPromises.mkdir(sharedFunctionsDir, { recursive: true });
    // ... content of simplified functions ...
    // Example:
    const userGroupContent = `
import type { AppSyncIdentityCognito } from "@aws-appsync/utils";
// Adjust path to gqlTypes if it's at root of tempBuildDir
import { ClientType } from "gqlTypes"; 

export const isSuperAdminUserGroup = (identity: AppSyncIdentityCognito): boolean => {
  return (identity.groups || []).includes(ClientType.SuperAdmin);
};
`;
    await fsPromises.writeFile(path.join(sharedFunctionsDir, 'userGroup.ts'), userGroupContent);
    this.logger.info('Created simplified shared functions in temp build directory.');
    // ... other simplified files ...
  }
}

// Export the class if it's a module
export { ResolverCompiler };
