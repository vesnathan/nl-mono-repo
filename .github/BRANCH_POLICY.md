# Branch Protection Policy

## Branch Structure

- **`main`** - Production branch (protected)
- **`dev`** or **`develop`** - Development/staging branch
- **`feature/*`** - Feature branches (merge into `dev`)

## Rules

### 1. Only `dev` can merge into `main`
- All feature branches must merge into `dev` first
- Only PRs from `dev` → `main` are allowed
- This is enforced by GitHub Actions workflow

### 2. Main branch protection (configure on GitHub)

Go to: https://github.com/vesnathan/nl-mono-repo/settings/branches

**Required settings for `main` branch:**
- ✅ Require a pull request before merging
- ✅ Require approvals (1+)
- ✅ Require status checks to pass:
  - `check-source-branch` (from enforce_branch_policy.yml)
  - Any other CI checks (linting, tests, etc.)
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings
- ✅ Require approval from code owners

## Workflow

### For feature development:
```bash
# Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# Work on feature...
git add .
git commit -m "feat: add my feature"
git push -u origin feature/my-feature

# Create PR: feature/my-feature → dev
```

### For production deployment:
```bash
# After features are tested in dev
# Create PR: dev → main
# This will trigger deployment to production
```

### Emergency hotfixes:
```bash
# Branch from main for critical fixes
git checkout main
git checkout -b hotfix/critical-fix

# Fix and merge back to both main and dev
```

## GitHub Branch Protection Setup

1. Go to repository Settings → Branches
2. Add rule for `main`:
   - Branch name pattern: `main`
   - Enable "Require a pull request before merging"
   - Enable "Require status checks to pass before merging"
   - Select: `check-source-branch`
   - Enable "Require branches to be up to date before merging"
   - Enable "Require review from Code Owners"
   - Save changes

3. (Optional) Add rule for `dev`:
   - Same as above but less strict
   - Only require status checks to pass
