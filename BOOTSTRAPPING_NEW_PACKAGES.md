# Bootstrapping a New Package

This guide explains how to create a new full-stack application package in the monorepo.

## Quick Start

```bash
# 1. Run the bootstrap tool
yarn aws-package-manager

# 2. Select "Create new package"

# 3. Enter your package name (e.g., "cool-app")
#    - Use kebab-case (e.g., "my-cool-app")
#    - The tool will auto-generate:
#      - Short name: "mca"
#      - PascalCase: "MyCoolApp"
#      - Frontend workspace: "mcafrontend"
#      - Backend workspace: "mcabackend"

# 4. Wait for the bootstrap process to complete

# 5. Deploy your new package
yarn deploy
# Select "Deploy or Update Stacks" → "My Cool App"
```

## What Gets Created Automatically

The bootstrap creates a **complete full-stack application** with:

### 📁 Package Structure

```
packages/
├── my-cool-app/
│   ├── backend/
│   │   ├── lambda/              # Lambda functions
│   │   ├── resolvers/           # AppSync resolvers
│   │   ├── constants/           # Client types & constants
│   │   ├── scripts/             # DB seeding scripts
│   │   └── combined_schema.graphql
│   └── frontend/
│       ├── src/
│       ├── public/
│       └── package.json
└── deploy/
    ├── templates/my-cool-app/   # CloudFormation templates
    └── packages/my-cool-app/
        └── deploy.ts            # Deploy handler
```

### ⚙️ Automatic Configuration Updates

The bootstrap **automatically updates 10 files** without any manual intervention:

1. **`deploy/deploy-registry.ts`**

   - Adds import for your deploy handler
   - Registers handler in `DEPLOY_HANDLERS`

2. **`deploy/types.ts`**

   - Adds `MyCoolApp` to `StackType` enum
   - Adds to `STACK_ORDER` array
   - Adds template paths

3. **`deploy/project-config.ts`**

   - Adds complete project configuration
   - Sets dependencies, bucket names, feature flags

4. **`deploy/utils/user-setup.ts`**

   - Adds `"mca"` to `StackTypeForUser` type
   - Adds Cognito groups import
   - Adds entry to `STACK_TYPE_CONFIG`

5. **`deploy/utils/stack-utils.ts`**

   - Adds case to `getAppNameForStackType()` switch

6. **`deploy/index.ts`**

   - Adds to admin email prompt condition

7. **Root `package.json`**
   - Adds workspace entries for frontend/backend
   - Adds `dev:mca` script

8-10. **CloudFormation Templates**

- All template files get token-replaced with your app name

## What You Get Out of the Box

### Infrastructure (Automatically Deployed)

- ✅ **DynamoDB Table** - Multi-tenant data storage
- ✅ **Cognito User Pool** - Authentication & user management
- ✅ **AppSync API** - GraphQL API with resolvers
- ✅ **Lambda Functions** - Backend business logic
- ✅ **S3 Buckets** - Templates & user files
- ✅ **CloudFront Distribution** - Frontend hosting (if `hasFrontend: true`)
- ✅ **KMS Encryption** - Data encryption (from Shared stack)
- ✅ **WAF Protection** - Web application firewall (if depends on WAF)

### Features

- ✅ **User Management** - Cognito admin user creation
- ✅ **Database Seeding** - Automatic test user creation
- ✅ **GraphQL Schema** - Auto-generated types
- ✅ **Frontend Build** - Next.js with TypeScript
- ✅ **Lambda Compilation** - Automatic esbuild bundling
- ✅ **Resolver Compilation** - AppSync resolver bundling
- ✅ **Log Cleanup** - Orphaned LogGroup cleanup
- ✅ **Output Management** - Stack outputs saved locally

## First Deployment

After bootstrapping, deploy your new package:

```bash
# Start deployment
yarn deploy

# You'll be prompted:
? Enter the deployment stage: dev
? Run in debug mode? Yes
? What would you like to do? Deploy or Update Stacks
? Which stack do you want to deploy/update? My Cool App
? Choose a deployment strategy: Update (create if not exists)
? Do you want to create/update the default admin user? Yes
? Enter admin email address: your-email@example.com

# The system will automatically:
# 1. Check dependencies (WAF, Shared)
# 2. Deploy missing dependencies if needed
# 3. Build GraphQL schema
# 4. Compile Lambda functions
# 5. Compile AppSync resolvers
# 6. Deploy CloudFormation stack
# 7. Seed database with test users
# 8. Create Cognito admin user
```

## Dependencies

Your new package automatically depends on:

- **WAF** - Web Application Firewall (provides WebACL)
- **Shared** - Shared resources (provides KMS, VPC, etc.)

The deploy system automatically:

- Detects missing dependencies
- Deploys them in correct order
- Passes outputs as parameters

## Configuration Options

After bootstrapping, you can customize your package in `deploy/project-config.ts`:

```typescript
[StackType.MyCoolApp]: {
  stackType: StackType.MyCoolApp,
  displayName: "My Cool App",           // Display name in menus
  templateDir: "my-cool-app",            // CloudFormation template folder
  packageDir: "my-cool-app",             // Package source code folder
  dependsOn: [StackType.WAF, StackType.Shared], // Dependencies
  buckets: {
    templates: "nlmonorepo-mycoolapp-templates-{stage}",
    frontend: "nlmonorepo-mca-userfiles-{stage}",
    additional: ["nlmonorepo-{stage}-cfn-templates-{region}"],
  },
  hasFrontend: true,      // Enable frontend build prompts
  hasLambdas: true,       // Enable Lambda compilation
  hasResolvers: true,     // Enable resolver compilation
},
```

## Development

Run your frontend locally:

```bash
# Dev script was automatically added to root package.json
yarn dev:mca
```

## Removing a Package

If you need to remove a package:

```bash
yarn aws-package-manager
# Select "Remove/delete a package"
# Enter the package name: my-cool-app

# The system automatically:
# 1. Removes from deploy-registry.ts
# 2. Removes from all config files
# 3. Removes from user-setup.ts
# 4. Removes from admin email condition
# 5. Removes from getAppNameForStackType()
# 6. Cleans up workspace entries
# 7. Deletes package folders
```

## How It Works (Under the Hood)

The bootstrap uses **AST (Abstract Syntax Tree) manipulation** to automatically update TypeScript files:

1. **Token Replacement** - Replaces `awse` → `mca`, `AwsExample` → `MyCoolApp`, etc.
2. **Import Addition** - Adds imports using TypeScript AST
3. **Registry Updates** - Adds to object literals and records
4. **Switch Cases** - Adds cases to switch statements
5. **Union Types** - Adds string literals to union types
6. **Conditional Logic** - Adds to if-statement conditions

All updates are:

- ✅ Type-safe (TypeScript compilation verified)
- ✅ Reversible (DELETE removes everything)
- ✅ No manual code changes needed
- ✅ Atomic (all-or-nothing)

## Template Package

New packages are cloned from the **AWS Example** template package, which includes:

- Full-stack architecture (frontend + backend)
- GraphQL API with example queries/mutations
- User management (Cognito + DynamoDB)
- Example Lambda functions
- Example resolvers
- Database seeding
- Frontend with authentication

You can customize this after bootstrapping!

## Troubleshooting

**Issue**: Bootstrap fails with "package already exists"
**Solution**: Run delete first, then create again

**Issue**: Deployment fails with missing parameters
**Solution**: Ensure WAF and Shared stacks are deployed first

**Issue**: Cognito user not created
**Solution**: Make sure you answered "Yes" to create admin user prompt

**Issue**: Frontend not building
**Solution**: Check `hasFrontend: true` in project-config.ts

## Next Steps

After bootstrapping:

1. ✅ **Customize CloudFormation templates** in `deploy/templates/my-cool-app/`
2. ✅ **Add business logic** in `packages/my-cool-app/backend/lambda/`
3. ✅ **Define GraphQL schema** in `packages/my-cool-app/backend/combined_schema.graphql`
4. ✅ **Build frontend** in `packages/my-cool-app/frontend/`
5. ✅ **Deploy** with `yarn deploy`

## Summary

The bootstrap system is **100% automated** and **fully dynamic**. You can create unlimited packages without ever touching configuration files manually!

```bash
# That's it! Just one command:
yarn aws-package-manager
```

🎉 **Your new full-stack app is ready to deploy!**
