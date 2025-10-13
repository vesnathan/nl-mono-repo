# Adding New Projects to the Deploy System

This guide explains how to add a new project to the monorepo deployment system. The system has been designed to be as dynamic as possible, minimizing the places where you need to add configuration.

## Overview

The deployment system now uses a centralized configuration in `project-config.ts` that drives most of the deployment logic. **The bootstrap script automatically handles most of the configuration**, so you rarely need to manually edit these files.

## Quick Start: Using the Bootstrap Script (Recommended)

The easiest way to add a new project is to use the bootstrap script:

```bash
node packages/aws-bootstrap/scripts/create-template.js
```

This will:
1. ✅ Clone the `aws-example` package as a template
2. ✅ Rename all files and replace all placeholders
3. ✅ **Automatically add the StackType enum to `types.ts`**
4. ✅ **Automatically add project configuration to `project-config.ts`**
5. ✅ **Automatically add template paths to `types.ts`**
6. ✅ **Automatically add workspace entries to root `package.json`**
7. ✅ Update all package.json names
8. ✅ Run post-clone tasks (yarn install, build-gql, tsc, lint)

**After running the bootstrap script, you only need to:**
1. Review and adjust the auto-generated configuration in `project-config.ts`
2. Create a deployment function (see [Step 5](#5-create-deployment-function))
3. Register the deployment function in `index.ts` (see [Step 6](#6-register-deployment-function))

Skip to [What Gets Configured Automatically](#what-gets-configured-automatically) to see what's already done for you!

## Manual Steps (Advanced - If Not Using Bootstrap)

If you need to manually add a new project or understand what the bootstrap script does, follow these steps:

### Steps to Add a New Project Manually

### 1. Add the StackType Enum Value

Edit `packages/deploy/types.ts`:

```typescript
export enum StackType {
  WAF = "WAF",
  Shared = "Shared",
  CWL = "CWL",
  AwsExample = "AwsExample",
  YourNewProject = "YourNewProject", // Add your new project here
}
```

### 2. Add Project Configuration

Edit `packages/deploy/project-config.ts` and add your project to the `PROJECT_CONFIGS` object:

```typescript
export const PROJECT_CONFIGS: Record<StackType, ProjectConfig> = {
  // ... existing configs ...

  [StackType.YourNewProject]: {
    stackType: StackType.YourNewProject,

    // Display name for menus (will appear in CLI)
    displayName: "Your New Project Name",

    // Template directory name under packages/deploy/templates/
    templateDir: "your-new-project",

    // Package directory name under packages/ (optional, if different from templateDir)
    packageDir: "your-new-project",

    // List of stack types this project depends on
    // For example, most projects depend on Shared for KMS keys
    dependsOn: [StackType.Shared],

    // Bucket naming patterns (use {stage} and {region} placeholders)
    buckets: {
      // Template bucket for CloudFormation templates
      templates: "nlmonorepo-yournewproject-templates-{stage}",

      // Frontend/user files bucket (if your project has a frontend)
      frontend: "nlmonorepo-yournewproject-frontend-{stage}",

      // Additional buckets (like logs, archives, etc.)
      additional: [
        "nlmonorepo-{stage}-cfn-templates-{region}",
      ],
    },

    // Override region if needed (e.g., WAF is always us-east-1)
    region: undefined, // or "us-east-1" if fixed region

    // Feature flags
    hasFrontend: true,     // Does this project have a Next.js/React frontend?
    hasLambdas: true,      // Does this project have Lambda functions?
    hasResolvers: true,    // Does this project have AppSync resolvers?
  },
};
```

### 3. Add Template Path Mappings

Edit `packages/deploy/types.ts` and add your project to the path mappings:

```typescript
export const TEMPLATE_PATHS: Record<StackType, string> = {
  // ... existing paths ...
  [StackType.YourNewProject]: join(
    __dirname,
    "templates/your-new-project/cfn-template.yaml",
  ),
};

export const TEMPLATE_RESOURCES_PATHS: Record<StackType, string> = {
  // ... existing paths ...
  [StackType.YourNewProject]: join(__dirname, "templates/your-new-project/"),
};
```

### 4. Create Deployment Function

Create `packages/deploy/packages/your-new-project/your-new-project.ts`:

```typescript
import {
  CloudFormationClient,
  // ... other imports
} from "@aws-sdk/client-cloudformation";
import {
  DeploymentOptions,
  StackType,
  getStackName,
  getTemplateBucketName,
} from "../../types";
import { logger } from "../../utils/logger";

export async function deployYourNewProject(
  options: DeploymentOptions,
): Promise<void> {
  const stackName = getStackName(StackType.YourNewProject, options.stage);
  const templateBucketName = getTemplateBucketName(
    StackType.YourNewProject,
    options.stage,
  );

  // Your deployment logic here
  // See aws-example.ts or cwl.ts for examples
}
```

### 5. Register Deployment Function

Edit `packages/deploy/index.ts` and add your deployment function:

```typescript
// At the top with other imports
import { deployYourNewProject } from "./packages/your-new-project/your-new-project";

// In the deployStack method, add your case
} else if (stackType === StackType.YourNewProject) {
  await deployYourNewProject(deploymentOptionsWithRegion);
} else {
```

### 6. Create CloudFormation Templates

Create your CloudFormation templates in `packages/deploy/templates/your-new-project/`:

```
packages/deploy/templates/your-new-project/
├── cfn-template.yaml          # Main template
└── resources/                 # Nested stack resources
    ├── AppSync/
    │   └── appsync.yaml
    ├── Cognito/
    │   └── cognito.yaml
    ├── DynamoDb/
    │   └── dynamoDb.yaml
    └── Lambda/
        └── lambda.yaml
```

### 7. Create Backend Package Structure

Create your backend package in `packages/your-new-project/backend/`:

```
packages/your-new-project/backend/
├── resolvers/                 # AppSync resolvers (if applicable)
├── lambda/                    # Lambda function source code
├── schema/                    # GraphQL schemas
└── constants/                 # Shared constants
```

## What Gets Configured Automatically

Once you've completed the above steps, the following will work automatically:

✅ **Menus**: Your project will appear in deploy and remove menus
✅ **Dependencies**: Dependency validation will use your `dependsOn` configuration
✅ **Bucket Cleanup**: Force delete will automatically clean up all your configured buckets
✅ **Deployment Order**: The system will automatically determine the correct deployment order
✅ **Removal Order**: The system will automatically determine the correct removal order

## Verification

After adding your project, you can verify the configuration:

```bash
cd packages/deploy
yarn deploy
```

Select your new project from the menu and verify:
1. It appears in the deploy menu with your configured display name
2. Dependencies are validated correctly
3. The stack deploys successfully
4. Removal cleans up all buckets

## Example: Adding a "Widget" Project

Here's a complete example for a fictional "Widget" project:

**1. In `types.ts`:**
```typescript
export enum StackType {
  WAF = "WAF",
  Shared = "Shared",
  CWL = "CWL",
  AwsExample = "AwsExample",
  Widget = "Widget",
}
```

**2. In `project-config.ts`:**
```typescript
[StackType.Widget]: {
  stackType: StackType.Widget,
  displayName: "Widget Management (widget)",
  templateDir: "widget",
  packageDir: "widget",
  dependsOn: [StackType.Shared],
  buckets: {
    templates: "nlmonorepo-widget-templates-{stage}",
    frontend: "nlmonorepo-widget-frontend-{stage}",
    additional: ["nlmonorepo-{stage}-cfn-templates-{region}"],
  },
  hasFrontend: true,
  hasLambdas: true,
  hasResolvers: true,
},
```

**3. Template paths are added to `types.ts`**

**4. Deployment function is created and registered in `index.ts`**

**5. Templates are created in `packages/deploy/templates/widget/`**

**6. Backend code is created in `packages/widget/backend/`**

That's it! The Widget project is now fully integrated into the deployment system.

## Troubleshooting

**Q: My project isn't showing up in the menu**
A: Make sure you've added it to the `StackType` enum and `PROJECT_CONFIGS` in `project-config.ts`

**Q: Buckets aren't being cleaned up during removal**
A: Check the bucket naming patterns in your `PROJECT_CONFIGS` entry. Ensure they match your actual bucket names.

**Q: Dependencies aren't being validated**
A: Verify the `dependsOn` array in your `PROJECT_CONFIGS` entry is correct.

**Q: Template not found error during deployment**
A: Ensure you've added your project to both `TEMPLATE_PATHS` and `TEMPLATE_RESOURCES_PATHS` in `types.ts`

## Best Practices

1. **Bucket Naming**: Use consistent naming patterns like `nlmonorepo-{projectname}-{purpose}-{stage}`
2. **Dependencies**: Only depend on what you actually need. Most projects should depend on `Shared` for KMS keys.
3. **Templates**: Organize templates in the `resources/` subdirectory by AWS service
4. **Testing**: Always test deployment and removal in a dev environment first
5. **Documentation**: Update project-specific README files with deployment instructions

## Need Help?

- Review existing projects like `aws-example` or `cwl` as reference implementations
- Check the `project-config.ts` file for complete configuration options
- Refer to the CloudFormation templates in `packages/deploy/templates/` for examples
