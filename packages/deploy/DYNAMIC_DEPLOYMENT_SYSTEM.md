# Dynamic Deployment System

This document explains the dynamic deployment system architecture and how it simplifies adding new projects.

## Architecture Overview

The deployment system is built around a central configuration file ([project-config.ts](project-config.ts)) that drives most deployment behavior. This eliminates the need to update multiple files when adding new projects.

### Core Components

1. **[project-config.ts](project-config.ts)** - Central configuration for all projects
2. **[types.ts](types.ts)** - StackType enum and template path mappings
3. **[dependency-validator.ts](dependency-validator.ts)** - Dynamically builds dependency graph
4. **[force-delete-utils.ts](utils/force-delete-utils.ts)** - Dynamically discovers and deletes buckets
5. **[index.ts](index.ts)** - Dynamically generates CLI menus

### Configuration Flow

```
project-config.ts
       ↓
    PROJECT_CONFIGS
       ↓
    ┌──────────────────┬──────────────────┬──────────────────┐
    ↓                  ↓                  ↓                  ↓
Bucket Names    Dependencies      Menu Options      Feature Flags
```

## What's Dynamic vs Manual

### ✅ Fully Dynamic (No Manual Updates Needed)

These are automatically derived from `project-config.ts`:

- **Bucket Discovery**: `getProjectBuckets()` returns all buckets for cleanup
- **Dependency Validation**: `getProjectDependencies()` returns stack dependencies
- **Deployment Order**: Automatically calculated from dependency graph
- **Removal Order**: Automatically reversed from deployment order
- **CLI Menus**: Automatically built from `displayName` fields
- **Region Selection**: Uses `region` override or default
- **Dependents Detection**: `getProjectDependents()` finds reverse dependencies

### 🔧 Semi-Automatic (Bootstrap Script Handles)

The [bootstrap script](../aws-bootstrap/scripts/create-template.js) automatically updates:

- **StackType Enum** in `types.ts`
- **Template Paths** in `types.ts`
- **Project Configuration** in `project-config.ts`
- **Workspace Entries** in root `package.json`
- **Package Names** in all `package.json` files
- **File Renaming** and token replacement

### ⚙️ Manual (Still Required)

You still need to manually:

1. Create deployment function (`deployYourProject()`)
2. Register deployment function in `index.ts`
3. Create CloudFormation templates
4. Review/adjust auto-generated `project-config.ts` settings

## ProjectConfig Schema

Each project in `PROJECT_CONFIGS` has this structure:

```typescript
{
  stackType: StackType.YourProject,    // Enum value
  displayName: "Your Project",         // CLI menu name
  templateDir: "your-project",         // Template folder name
  packageDir: "your-project",          // Package folder name
  dependsOn: [StackType.Shared],       // Stack dependencies

  buckets: {
    templates: "bucket-name-{stage}",  // Template bucket pattern
    frontend: "bucket-name-{stage}",   // Frontend bucket pattern
    additional: ["other-{stage}"],     // Other buckets
  },

  region: "us-east-1",                 // Optional region override
  hasFrontend: true,                   // Has Next.js frontend?
  hasLambdas: true,                    // Has Lambda functions?
  hasResolvers: true,                  // Has AppSync resolvers?
}
```

## Bucket Naming Patterns

Buckets use placeholder syntax for dynamic values:

- `{stage}` - Deployment stage (dev, prod, etc.)
- `{region}` - AWS region (ap-southeast-2, us-east-1, etc.)

Example:
```typescript
buckets: {
  templates: "nlmonorepo-myproject-templates-{stage}",
  // Becomes: nlmonorepo-myproject-templates-dev
}
```

## How Dependencies Work

Dependencies are declared in `project-config.ts`:

```typescript
[StackType.MyProject]: {
  dependsOn: [StackType.Shared, StackType.WAF],
  // ...
}
```

The system automatically:

1. **Validates** dependencies exist before deployment
2. **Calculates** correct deployment order
3. **Auto-deploys** missing dependencies
4. **Prevents removal** if dependents exist
5. **Determines** removal order (reverse of deployment)

## How Bucket Cleanup Works

When removing a stack, the system:

1. Calls `getProjectBuckets(stackType, stage, region)`
2. Gets bucket names from `project-config.ts`
3. Empties each bucket (including versioned objects)
4. Deletes each bucket
5. Also checks stack outputs for any unlisted buckets

**No hardcoded bucket names** - everything comes from configuration!

## How Menus Are Generated

CLI menus are built dynamically:

```typescript
const stackChoices = Object.values(StackType).map((stackType) => ({
  name: getProjectConfig(stackType).displayName,
  value: stackType,
}));
```

This means:
- New projects automatically appear in menus
- Display names come from `project-config.ts`
- No hardcoded menu items

## Adding a New Project

### Using Bootstrap Script (Recommended)

```bash
node packages/aws-bootstrap/scripts/create-template.js
```

The script will:
1. Ask for project details (name, title, short name)
2. Clone `aws-example` as template
3. **Automatically update** `types.ts` with StackType
4. **Automatically update** `project-config.ts` with configuration
5. **Automatically update** template paths
6. Rename files and replace tokens

Then you only need to:
1. Review generated config in `project-config.ts`
2. Create deployment function
3. Register in `index.ts`

### Manual Process

See [ADDING_NEW_PROJECTS.md](ADDING_NEW_PROJECTS.md) for detailed manual steps.

## Configuration Validation

You can validate that all templates have configurations:

```typescript
import { validateProjectConfigs } from './project-config';

const result = validateProjectConfigs();
if (!result.valid) {
  console.log('Missing configs:', result.missingConfigs);
  console.log('Extra configs:', result.extraConfigs);
}
```

This helps ensure your `project-config.ts` stays in sync with actual template directories.

## Benefits

### Before (Hardcoded)

Adding a new project required updates to:
- `types.ts` (enum, STACK_ORDER, template paths)
- `dependency-validator.ts` (dependencies, dependents)
- `force-delete-utils.ts` (bucket names in 2+ places)
- `index.ts` (menu items in 2+ places)
- Root `package.json` (workspaces)
- Various deployment files

**~6-8 files to update manually**

### After (Dynamic + Bootstrap)

Adding a new project:
1. Run bootstrap script
2. Review auto-generated config
3. Create deployment function
4. Register in `index.ts`

**~2 files to update manually**

The bootstrap script handles the rest automatically!

## Maintenance

### When Adding Features

If you add new deployment features, consider:

1. Can the feature be configured in `ProjectConfig`?
2. Can the feature use `getProjectConfig()` instead of hardcoded logic?
3. Should the bootstrap script auto-configure this?

### When Modifying Projects

To change project settings:

1. Edit `project-config.ts`
2. Changes immediately apply to:
   - Bucket cleanup
   - Dependencies
   - Menus
   - Feature flags

No need to update multiple files!

## Examples

### Example 1: Changing Bucket Names

**Before**: Update bucket names in `force-delete-utils.ts` (2 places)

**After**: Update `project-config.ts` once:
```typescript
buckets: {
  templates: "new-bucket-name-{stage}",
}
```

### Example 2: Changing Dependencies

**Before**: Update `dependency-validator.ts` (2 objects)

**After**: Update `project-config.ts` once:
```typescript
dependsOn: [StackType.Shared, StackType.SomeNewDep],
```

### Example 3: Changing Display Name

**Before**: Update `index.ts` (2+ places in menu definitions)

**After**: Update `project-config.ts` once:
```typescript
displayName: "My New Project Name",
```

## Troubleshooting

**Q: New project not showing in menus?**
A: Check that it's in `StackType` enum and `PROJECT_CONFIGS`

**Q: Buckets not being deleted?**
A: Verify bucket naming patterns in `project-config.ts` match actual bucket names

**Q: Dependencies not working?**
A: Check `dependsOn` array in `PROJECT_CONFIGS`

**Q: Bootstrap script failed?**
A: Check that:
- `aws-example` package exists as template
- You have write permissions
- Destination package doesn't already exist

## Future Improvements

Potential enhancements:

1. **Auto-generate deployment functions** from templates
2. **Auto-register** deployment functions using dynamic imports
3. **Validate** CloudFormation templates match config
4. **Auto-discover** bucket names from deployed stacks
5. **Generate** TypeScript types from project config

## Summary

The dynamic deployment system reduces manual work by:

- ✅ Centralizing configuration in one file
- ✅ Auto-generating menus, dependencies, and bucket lists
- ✅ Providing a bootstrap script for new projects
- ✅ Eliminating most hardcoded project references

**Result**: Adding new projects is now much faster and less error-prone!
