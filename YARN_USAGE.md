# IMPORTANT: This monorepo uses YARN, not npm

## Package Manager
This monorepo exclusively uses **Yarn** as the package manager. All dependencies, scripts, and workspace management should be done through Yarn commands.

### Key Commands:
- `yarn install` - Install all dependencies
- `yarn workspace <workspace-name> <command>` - Run command in specific workspace
- `yarn workspaces foreach <command>` - Run command in all workspaces
- `yarn add <package>` - Add dependency to root
- `yarn workspace <workspace-name> add <package>` - Add dependency to specific workspace

### For AI Agents:
**ALWAYS use `yarn` commands instead of `npm` commands when working with this repository.**

Examples:
- ✅ `yarn install`
- ❌ `npm install`
- ✅ `yarn add package-name`
- ❌ `npm install package-name`
 - ✅ `yarn workspace <workspace-name> add @aws-sdk/client-ec2` (replace with the target workspace)
- ❌ `npm install @aws-sdk/client-ec2`

### Workspace Structure:
This is a Yarn workspace monorepo with the following packages:
- `packages/cloudwatchlive/frontend`
- `packages/cloudwatchlive/backend`
- `packages/shared`
- `packages/waf`
- `packages/shared-aws-assets`
- `packages/deploy`
- (removed) `packages/ec2-vsc` (this package was removed from the workspace)
