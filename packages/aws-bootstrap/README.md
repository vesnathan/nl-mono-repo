# aws-bootstrap

This package provides an interactive CLI tool to bootstrap a new AWS package by cloning the `packages/aws-example` template and customizing it with your package names.

## What It Does

The bootstrap tool will:

1. Clone the `packages/aws-example` directory structure
2. Prompt you for:
   - **Package long name** (kebab-case, e.g., `my-awesome-app`)
   - **Package short name** (lowercase alphanumeric abbreviation, e.g., `maa`)
   - **Description** (optional)
3. Rename all files and replace all tokens throughout the codebase
4. Update the root `package.json` to include new workspace entries
5. Update the deploy package types to include the new stack

## Usage

From the repository root, run:

```bash
yarn create-aws-package
```

Or directly:

```bash
node packages/aws-bootstrap/scripts/create-template.js
```

The script will interactively prompt you for all required information.

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

The script automatically:

1. **Copies and renames files**:

   - `awsb*.ts` → `<shortname>*.ts`
   - `AWSBUser.graphql` → `<SHORTNAME>User.graphql`

2. **Replaces tokens in all files**:

   - `aws-example` → your long name
   - `AWS_EXAMPLE` → `YOUR_LONG_NAME` (uppercase with underscores)
   - `awsb` → your short name
   - `AWSB` → your short name (uppercase)
   - `Awsb` → your short name (capitalized)

3. **Updates configuration files**:
   - Root `package.json` workspaces
   - `packages/deploy/types.ts` (adds new StackType enum)
   - All `package.json` files in the new package

## Post-Creation Steps

After running the bootstrap tool:

1. Run `yarn install` to install dependencies
2. Copy the CloudFormation template:
   ```bash
   cp -r packages/deploy/templates/aws-example packages/deploy/templates/<your-long-name>
   ```
3. Update the template for your use case
4. Create deployment logic:
   ```bash
   mkdir -p packages/deploy/packages/<your-long-name>
   ```
   Add a deployment file similar to `packages/deploy/packages/aws-example/aws-example.ts`
5. Update `packages/deploy/dependency-validator.ts` to define stack dependencies
6. Update `packages/deploy/index.ts` to handle your new stack type in the `deployStack` method
7. Run `yarn deploy` to deploy your new stack

## Notes

- The script avoids copying `node_modules`, `.next`, `dist`, and `build` directories
- All text file content is updated with find-and-replace for the naming patterns
- Binary files are copied as-is without modification
- The tool validates naming conventions before proceeding
