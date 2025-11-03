# aws-bootstrap

This package provides an interactive CLI tool to bootstrap a new AWS package by cloning the `packages/aws-example` template and customizing it with your package names.

## What It Does

The bootstrap tool will:

1. Clone the `packages/aws-example` directory structure
2. Prompt you for:
   - **Project title** (e.g., `My Awesome App`)
   - **Package long name** (kebab-case, e.g., `my-awesome-app`)
   - **Package short name** (lowercase alphanumeric abbreviation, e.g., `maa`)
   - **Description** (optional)
3. **Perform comprehensive token replacement** across all files in the copied package:
   - Replaces `aws-example` → your long name
   - Replaces `AWS_EXAMPLE` → `YOUR_LONG_NAME` (uppercase with underscores)
   - Replaces `AwsExample` → `YourLongName` (PascalCase)
   - Replaces `awsExample` → `yourLongName` (camelCase)
   - Replaces `awse` → your short name
   - Replaces `AWSE` → `YOUR_SHORT_NAME` (uppercase)
   - Replaces `Awse` → `YourShortName` (capitalized)
4. **Verify** that all tokens were replaced (warns if any remain)
5. Update the root `package.json` to include new workspace entries
6. Copy CloudFormation templates from `packages/deploy/templates/aws-example`
7. Update `packages/deploy/types.ts` to include the new stack type
8. Update `packages/deploy/project-config.ts` with project configuration
9. **Automatically create and register the deploy handler**:
   - Copy `packages/deploy/packages/aws-example/deploy.ts` to `packages/deploy/packages/<your-name>/deploy.ts`
   - Perform comprehensive token replacement in the deploy handler
   - Add import statement to `packages/deploy/index.ts`
   - Add handler call in the `deployStack` method
10. Run post-clone tasks: `yarn install`, `build-gql`, `tsc`, `prettier`, and `lint`

## Usage

### Creating a Package

From the repository root, run the bootstrap tool directly:

```bash
node packages/aws-bootstrap/scripts/create-template.js
```

or, for the new version with full automation:

```bash
node packages/aws-bootstrap/scripts/aws-package-manager.js create
```

> **Note:** There is no `yarn create-aws-package` script. Always use the direct `node ...` command as above.

The script will interactively prompt you for all required information.

### Deleting a Package

To remove a package and clean up all associated files:

**Interactive delete** (with menu):

```bash
node packages/aws-bootstrap/scripts/aws-package-manager.js delete
```

**Non-interactive delete** (provide package name):

```bash
node packages/aws-bootstrap/scripts/aws-package-manager.js delete <package-name>
```

**Force delete** (non-interactive, requires confirmation):

```bash
node packages/aws-bootstrap/scripts/aws-package-manager.js --force-delete <package-name> --confirm
```

#### What Gets Removed

When deleting a package, the script removes **all** associated artifacts:

1. **Package directory**: `packages/<package-name>/`
2. **Deploy templates**: `packages/deploy/templates/<package-name>/`
3. **Deploy handler**: `packages/deploy/packages/<package-name>/`
4. **Root package.json**: Workspace entries and dev scripts
5. **deploy/types.ts**: StackType enum, STACK_ORDER, TEMPLATE_PATHS, TEMPLATE_RESOURCES_PATHS
6. **deploy/project-config.ts**: PROJECT_CONFIGS entry
7. **deploy/index.ts**: Import statement and handler registration

#### Safety Features

- **Dependency checking**: Prevents deletion if other deployed packages depend on this one
- **Protected packages**: Cannot delete core packages (aws-bootstrap, deploy, shared, waf, aws-example)
- **Confirmation prompts**: Interactive confirmation before deletion
- **Best-effort cleanup**: Continues even if some steps fail, logs errors for manual review

## Package Naming

The tool uses two naming conventions:

- **Long Name**: Full package name in kebab-case (e.g., `my-awesome-app`)

  - Used for: directory names, package names, template names

- **Short Name**: Abbreviated lowercase identifier (e.g., `maa`)
  - Used for: component prefixes, file names, variable names
  - Also generates uppercase version (e.g., `MAA`) for stack names and GraphQL types

## Example

When you run the script:

```
Enter the package long name: customer-portal
Enter the package short name (cp): cp
Enter a brief description: Customer management portal
```

This creates:

- Directory: `packages/customer-portal/`
- Stack type: `CP`
- Package names: `cpbackend`, `cpfrontend`
- GraphQL types: `CPUser`, etc.

## What Gets Updated

The script automatically performs **comprehensive token replacement** across all files:

1. **Content replacement in ALL files** (TypeScript, JavaScript, JSON, YAML, GraphQL, etc.):

   - `aws-example` → `your-long-name` (kebab-case)
   - `AWS_EXAMPLE` → `YOUR_LONG_NAME` (uppercase with underscores)
   - `aws_example` → `your_long_name` (snake_case)
   - `AwsExample` → `YourLongName` (PascalCase for types/classes)
   - `awsExample` → `yourLongName` (camelCase for variables)
   - `awse` → `yourshortname` (lowercase)
   - `AWSE` → `YOURSHORTNAME` (uppercase)
   - `Awse` → `Yourshortname` (capitalized)

2. **File paths and import statements**:

   - All `../../../aws-example/` paths become `../../../your-long-name/`
   - Package names in `package.json` dependencies
   - Import/export statements

3. **Configuration files automatically updated**:

   - Root `package.json` workspaces (adds frontend and backend entries)
   - Root `package.json` scripts (adds `dev:yourshortname`)
   - `packages/deploy/types.ts` (adds StackType enum, STACK_ORDER, TEMPLATE_PATHS)
   - `packages/deploy/project-config.ts` (adds project configuration with dependencies, buckets, flags)
   - All `package.json` files in the new package

4. **Verification**:
   - Scans all files for remaining template references
   - Warns if any `aws-example`, `awse`, etc. tokens are found
   - Lists files and line numbers for manual review

## Post-Creation Steps

After running the bootstrap tool:

1. Run `yarn install` to install dependencies (done automatically unless you use `--no-autoinstall`)
2. The CloudFormation templates are automatically copied from `packages/deploy/templates/aws-example` to `packages/deploy/templates/<your-long-name>`
3. Update the templates for your use case
4. **Deploy handler is automatically created and registered**:
   - Review the deploy handler at `packages/deploy/packages/<your-long-name>/deploy.ts`
   - Verify registration in `packages/deploy/index.ts` (import and handler call)
5. Update `packages/deploy/project-config.ts` to define stack dependencies (already added with defaults)
6. Run `yarn deploy` to deploy your new stack

### Clone-bootstrap quick checklist (what the script does and what you must verify)

The interactive bootstrap does most of the mechanical work, but a few manual checks are required to make the new package fully deployable. Follow this checklist after running the tool:

- [ ] Confirm workspaces: verify `packages/<your-long-name>/frontend` and `packages/<your-long-name>/backend` were added to the root `package.json` workspaces (done automatically by the script).
- [ ] Templates: confirm `packages/deploy/templates/<your-long-name>/cfn-template.yaml` exists (copied automatically from aws-example) and update bucket names and exported outputs following the repo conventions (AppName + Stage).
- [ ] Deploy handler: verify there is a deploy handler at `packages/deploy/packages/<your-long-name>/deploy.ts` (created automatically by the script with comprehensive token replacement).
- [ ] Index registration: check `packages/deploy/index.ts` to confirm an import for your handler was added and that `deployStack` has a branch calling `deploy<PascalCaseName>(options)` (done automatically by the script).
- [ ] Project config: open `packages/deploy/project-config.ts` and verify the auto-generated entry. Update `dependsOn` entries (defaults to `[StackType.Shared]`), bucket patterns, and flags (`hasFrontend`, `hasLambdas`, `hasResolvers`) as needed.
- [ ] Types: verify `packages/deploy/types.ts` has your new `StackType.<PascalCaseName>` enum entry, STACK_ORDER entry, TEMPLATE_PATHS entry, and TEMPLATE_RESOURCES_PATHS entry (all added automatically).
- [ ] Typechecks & builds: The script runs these automatically, but you should verify: `yarn install` then `yarn workspace <frontend-pkg> run build-gql` and `./node_modules/.bin/tsc -p packages/<your-long-name>/backend/tsconfig.json --noEmit` and fix any TypeScript issues.
- [ ] Lint & format: The script runs `npx prettier --write packages/<your-long-name>/frontend` and `yarn lint` automatically — check console output for any issues that need manual fixing.
- [ ] Deploy: Run the deploy flow from `packages/deploy` (interactive `yarn deploy` or your CI pipeline) and watch for stack parameter issues.

### New automation options

The bootstrap script supports two opt-in automation helpers:

- `--autoregister-deploy` (or `--auto-register-deploy`)

  - After creating the package files the script will copy the AWSE deploy handler (`packages/deploy/packages/aws-example/aws-example.ts`) into `packages/deploy/packages/<your-long-name>/deploy.ts`, perform conservative token replacements, and update `packages/deploy/index.ts` to import and call the new handler.
  - This is best-effort and logged; if the script cannot safely edit `index.ts` it will warn and you will need to finish the registration manually.

- `--no-autoinstall`
  - Skips the automatic `yarn install` step after creation (useful in CI when you want to control installation).

Example (interactive create + autoregister):

```bash
node packages/aws-bootstrap/scripts/aws-package-manager.js create --autoregister-deploy
```

Recommended CI-friendly improvement (future):

- Non-interactive flags (planned): `--project-title`, `--long-name`, `--short-name`, `--description`, `--confirm`. These will let you run the entire create + autoregister flow in CI without stdin interaction.

## Troubleshooting

- If `deploy/index.ts` wasn't updated automatically, add the following two lines manually:

1. Add an import near the other deploy imports:

```ts
import { deployMyApp } from "./packages/my-app/deploy";
```

2. Add a branch inside `deployStack` to call the new handler:

```ts
} else if (stackType === StackType.MyApp) {
   await deployMyApp(deploymentOptionsWithRegion);
} else {
```

Replace `MyApp` and `my-app` with your PascalCase & kebab-case names respectively.

Note: The deploy handler is now always named `deploy.ts` (not `my-app.ts`), so imports use the pattern `./packages/<long-name>/deploy`.

## Notes

- The script avoids copying `node_modules`, `.next`, `dist`, `build`, `.nx`, `deployment-outputs`, and `.cache` directories
- **Comprehensive token replacement** is performed across ALL text files in the copied package
- Binary files (images, fonts, etc.) are copied as-is without modification
- The tool validates naming conventions before proceeding
- After token replacement, the script **verifies** all files and warns about any remaining template references
- The verification step helps ensure the bootstrapped package is deployment-ready
- Post-clone tasks (yarn install, build-gql, tsc, prettier, lint) run automatically unless you use `--no-autoinstall`
