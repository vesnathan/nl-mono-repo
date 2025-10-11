# Multi-Agent Development Workflow for nl-mono-repo

## Overview

This guide demonstrates how to run multiple AI coding agents simultaneously on this monorepo using Git worktrees. This enables true parallel development with complete isolation - like having multiple developers working on different features simultaneously.

## Why Git Worktrees?

- **Complete isolation**: Each agent has its own file system, no file conflicts
- **Separate branches**: Clean Git separation for each agent's work
- **Shared Git history**: Same repository, different working directories
- **Independent dependencies**: Each can have its own node_modules
- **True parallel work**: Multiple features can progress simultaneously

---

## Quick Start

### 1. Create Worktrees for Different Agents

```bash
# Navigate to main repo
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo

# Create worktree for Agent 1 (Backend/Infrastructure)
git worktree add ../nl-mono-repo-backend -b agent1/backend-work

# Create worktree for Agent 2 (Frontend/UI)
git worktree add ../nl-mono-repo-frontend -b agent2/frontend-work

# Optional: Create worktree for Agent 3 (Testing/DevOps)
git worktree add ../nl-mono-repo-devops -b agent3/devops-work
```

### 2. Install Dependencies in Each Worktree

```bash
# Agent 1 - Backend workspace
cd ../nl-mono-repo-backend
yarn install

# Agent 2 - Frontend workspace
cd ../nl-mono-repo-frontend
yarn install

# Agent 3 - DevOps workspace (if created)
cd ../nl-mono-repo-devops
yarn install
```

### 3. Open Separate VS Code Instances

```bash
# Open Agent 1 workspace
code /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-backend -n

# Open Agent 2 workspace
code /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-frontend -n

# Keep main repo open for review/integration
code /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo -n
```

---

## Recommended Agent Responsibilities

### Agent 1: Backend & Infrastructure

**Primary Focus:**

- `packages/cloudwatchlive/backend/`
  - Lambda functions (`lambda/`)
  - AppSync resolvers (`resolvers/`)
  - GraphQL schema (`schema/`)
- `packages/deploy/`
  - CloudFormation templates
  - Deployment utilities
  - Infrastructure as Code

**Typical Tasks:**

- Create new Lambda functions
- Update AppSync pipeline resolvers
- Modify CloudFormation resources
- Implement backend business logic
- Database schema changes

### Agent 2: Frontend & UI

**Primary Focus:**

- `packages/cloudwatchlive/frontend/`
  - React components (`src/components/`)
  - Pages and routing (`src/app/`)
  - State management (`src/stores/`)
  - GraphQL queries/mutations (`src/graphql/`)
- `packages/shared/`
  - Shared UI utilities
  - Form validation schemas

**Typical Tasks:**

- Create new UI components
- Implement form handling
- Add new routes/pages
- State management updates
- Frontend GraphQL integration

### Agent 3: DevOps & Testing (Optional)

**Primary Focus:**

- CI/CD configuration
- Testing infrastructure
- Build optimization
- Documentation
- Monitoring/logging improvements

---

## Working with Agents

### Example: Backend Agent (Agent 1)

```bash
# In VS Code instance 1
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-backend

# Example tasks for AI agent:
# "Create a Lambda function for user profile updates"
# "Add a new AppSync pipeline resolver for notifications"
# "Update DynamoDB table schema for new feature"

# Run deployment from this worktree
cd packages/deploy
yarn deploy

# Run backend-specific scripts
yarn build-gql
yarn tsc
```

### Example: Frontend Agent (Agent 2)

```bash
# In VS Code instance 2
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-frontend

# Example tasks for AI agent:
# "Create a user profile settings page"
# "Add a notification center component"
# "Implement form validation for new user fields"

# Run frontend dev server
yarn dev:cwl

# Build frontend
cd packages/cloudwatchlive/frontend
yarn build
```

### Running Package-Specific Commands

Each worktree can run commands independently:

```bash
# Agent 1 (Backend worktree)
yarn deploy:cwl                    # Deploy backend changes
yarn workspace @deploy/core deploy  # Deploy specific package

# Agent 2 (Frontend worktree)
yarn dev:cwl                       # Start frontend dev server
yarn build:frontend                # Build frontend only
yarn lint                          # Lint all packages
```

---

## Merging Agent Work

### Option 1: Local Review & Merge

```bash
# Return to main repo
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo

# Review Agent 1's changes
git diff agent1/backend-work
git log agent1/backend-work --oneline

# Test Agent 1's work
git worktree list
cd ../nl-mono-repo-backend
yarn test
yarn build

# If tests pass, merge Agent 1
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo
git merge agent1/backend-work

# Repeat for Agent 2
git diff agent2/frontend-work
cd ../nl-mono-repo-frontend
yarn test
yarn build

git checkout main
git merge agent2/frontend-work

# Final integration test
yarn test
yarn build
```

### Option 2: Pull Request Workflow (Recommended)

```bash
# Agent 1 - Push backend work
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-backend
git add .
git commit -m "feat(backend): implement user profile updates

- Add Lambda function for profile updates
- Create AppSync resolver pipeline
- Update DynamoDB schema"
git push origin agent1/backend-work

# Agent 2 - Push frontend work
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-frontend
git add .
git commit -m "feat(frontend): user profile settings page

- Create ProfileSettings component
- Add form validation
- Integrate with GraphQL mutations"
git push origin agent2/frontend-work
```

Then create PRs on GitHub:

1. Review each PR independently
2. Run CI/CD checks
3. Merge when approved
4. Update other worktrees with: `git pull origin main`

---

## Coordination Strategies

### 1. Shared Code Coordination

If both agents need to modify `packages/shared/`:

**Option A: Sequential**

1. Agent 1 completes shared changes first
2. Agent 1 pushes and merges
3. Agent 2 pulls changes: `git pull origin main`
4. Agent 2 continues with updated shared code

**Option B: Communication**

- Document intended changes in shared modules
- One agent "claims" a shared module for the sprint
- Use separate files when possible

### 2. Regular Integration

Prevent drift by regularly syncing:

```bash
# In each worktree, periodically:
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-backend
git fetch origin
git merge origin/main
yarn install  # Update dependencies if package.json changed

cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-frontend
git fetch origin
git merge origin/main
yarn install
```

### 3. Feature Flags

Use feature flags for partially complete work:

```typescript
// In shared config
export const FEATURE_FLAGS = {
  NEW_PROFILE_UI: process.env.FEATURE_NEW_PROFILE === 'true',
  ADVANCED_NOTIFICATIONS: process.env.FEATURE_NOTIFICATIONS === 'true',
};

// In component
if (FEATURE_FLAGS.NEW_PROFILE_UI) {
  return <NewProfileSettings />;
}
return <LegacyProfileSettings />;
```

This allows both agents to merge incomplete features safely.

---

## Management Commands

### List All Worktrees

```bash
git worktree list

# Output:
# /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo         0a070b0 [main]
# /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-backend 1234abc [agent1/backend-work]
# /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-frontend 5678def [agent2/frontend-work]
```

### Remove Worktrees When Complete

```bash
# After merging, clean up
git worktree remove /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-backend
git worktree remove /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-frontend

# Delete merged branches
git branch -d agent1/backend-work
git branch -d agent2/frontend-work

# Delete remote branches (if pushed)
git push origin --delete agent1/backend-work
git push origin --delete agent2/frontend-work
```

### Prune Deleted Worktrees

```bash
# If you manually deleted worktree directories
git worktree prune
```

---

## Troubleshooting

### Port Conflicts

When running dev servers in multiple worktrees:

```bash
# Agent 1: Use default port (3000)
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-backend
yarn dev:cwl

# Agent 2: Use different port
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-frontend
PORT=3001 yarn dev:cwl

# Or configure in .env files for each worktree
```

### Dependency Conflicts

If packages aren't linking correctly:

```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-backend
rm -rf node_modules
rm -rf packages/*/node_modules
yarn install
```

### Worktree Already Exists

```bash
# Force remove and recreate
git worktree remove /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-backend --force
git worktree add ../nl-mono-repo-backend -b agent1/new-feature
```

### Branch Already Checked Out

Git prevents the same branch in multiple worktrees:

```bash
# Error: fatal: 'agent1/backend-work' is already checked out at '...'

# Solution: Use different branch names
git worktree add ../nl-mono-repo-backend2 -b agent1/backend-work-v2
```

---

## Best Practices

### 1. Clear Naming Conventions

```bash
# Branch naming
git worktree add ../nl-mono-repo-FEATURE-backend -b agent1/FEATURE-backend-implementation
git worktree add ../nl-mono-repo-FEATURE-frontend -b agent2/FEATURE-frontend-ui

# Commit message conventions
feat(backend): description       # Agent 1
feat(frontend): description      # Agent 2
fix(deploy): description         # Agent 1
style(ui): description           # Agent 2
```

### 2. Documentation Updates

Each agent should update relevant documentation:

```bash
# Agent 1
- Update CloudFormation README
- Document new Lambda functions
- Update API documentation

# Agent 2
- Update component storybook
- Document new props/hooks
- Update user-facing docs
```

### 3. Testing Before Merging

```bash
# In each worktree before pushing
yarn test                    # Run all tests
yarn lint                    # Check linting
yarn tsc                     # TypeScript check
yarn build                   # Ensure builds work

# In main repo after merging
yarn test                    # Integration tests
yarn deploy                  # Deploy to dev environment
```

### 4. Communication Log

Create a `WORKTREE_LOG.md` to track agent activities:

```markdown
## 2025-10-09

### Agent 1 (Backend) - branch: agent1/user-auth

- ✅ Created createCognitoUser Lambda
- ✅ Added AppSync pipeline resolver
- 🔄 In progress: Email verification flow
- ⏸️ Blocked: Waiting for SES sandbox approval

### Agent 2 (Frontend) - branch: agent2/login-ui

- ✅ Created LoginForm component
- ✅ Added form validation
- 🔄 In progress: Password reset flow
- 📝 Note: Need Cognito user pool ID from Agent 1
```

---

## Example Workflow: Complete Feature

Let's implement a "User Profile" feature using two agents:

### Setup

```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo
git worktree add ../nl-mono-repo-profile-backend -b agent1/user-profile-backend
git worktree add ../nl-mono-repo-profile-frontend -b agent2/user-profile-frontend

cd ../nl-mono-repo-profile-backend && yarn install
cd ../nl-mono-repo-profile-frontend && yarn install

code /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-profile-backend -n
code /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-profile-frontend -n
```

### Agent 1: Backend Implementation

```bash
# AI Agent tasks in backend worktree:
# 1. Create Lambda: updateUserProfile.ts
# 2. Create AppSync resolver: Mutation.updateUserProfile.ts
# 3. Update DynamoDB schema with new profile fields
# 4. Add IAM permissions for profile updates
# 5. Write unit tests

git add .
git commit -m "feat(backend): user profile update API"
git push origin agent1/user-profile-backend
```

### Agent 2: Frontend Implementation

```bash
# AI Agent tasks in frontend worktree:
# 1. Create ProfileSettings component
# 2. Create useUserProfile hook
# 3. Add form validation with Zod
# 4. Integrate GraphQL mutation
# 5. Add loading/error states
# 6. Write component tests

git add .
git commit -m "feat(frontend): user profile settings page"
git push origin agent2/user-profile-frontend
```

### Integration

```bash
# Create PRs for both branches
# Review and merge agent1/user-profile-backend first
# Then review and merge agent2/user-profile-frontend
# Deploy and test integrated feature

cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo
git pull origin main
yarn test
yarn deploy
```

### Cleanup

```bash
git worktree remove ../nl-mono-repo-profile-backend
git worktree remove ../nl-mono-repo-profile-frontend
git branch -d agent1/user-profile-backend
git branch -d agent2/user-profile-frontend
```

---

## Summary

**Multi-agent worktree workflow provides:**

- ✅ Complete isolation between agents
- ✅ No file conflicts or locking issues
- ✅ Independent testing and development
- ✅ Standard Git merge workflow
- ✅ Scalable to 3+ agents if needed
- ✅ Clean separation of frontend/backend work

**Remember:**

1. Each worktree is a separate developer's workspace
2. Review work before merging (like reviewing PR from team member)
3. Test integrated changes after merging
4. Keep worktrees synced with main regularly
5. Clean up worktrees and branches after features complete

This setup maximizes AI agent productivity by eliminating coordination overhead while maintaining code quality through standard review processes.
