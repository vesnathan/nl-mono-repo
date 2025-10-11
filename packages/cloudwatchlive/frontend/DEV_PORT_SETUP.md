# Development Port Configuration

## Port Setup

This workspace uses **port 3001** for the frontend dev server to avoid conflicts with the main `nl-mono-repo` which uses port 3000.

## How It Works

### Package.json Scripts

The `package.json` scripts do NOT hardcode the port. They use Next.js defaults (port 3000) unless overridden.

### Shell Scripts (Agent Workspace Specific - Not Committed)

- `dev.sh` - Runs dev server on port 3001
- `restart-dev.sh` - Cleans cache and runs dev server on port 3001

These scripts are in `.gitignore` and will NOT be merged to main repo. They are local to this agent workspace only.

## When Merging to Main

The `package.json` changes are **safe to merge** because:

1. ✅ Port is NOT hardcoded in package.json scripts
2. ✅ Memory optimization (`NODE_OPTIONS='--max-old-space-size=4096'`) benefits everyone
3. ✅ New `dev:clean` script is a useful addition
4. ✅ Shell scripts with port 3001 are gitignored and won't be merged
5. ✅ Main repo will continue using port 3000 by default

## Running Dev Server

### In Agent Workspace (Port 3001)

```bash
./dev.sh
# or
./restart-dev.sh
```

### In Main Repo (Port 3000 - default)

```bash
yarn dev
# or
yarn dev:local
```

### Manual Port Override (Any Workspace)

```bash
yarn dev -- -p 3002
```

## Memory Optimization

All dev scripts now include `NODE_OPTIONS='--max-old-space-size=4096'` which allocates 4GB of memory to Node.js. This prevents:

- Dev server crashes
- Compilation timeouts
- Memory pressure during hot reload

This change benefits all developers and should be merged to main.

## Note on Shell Scripts

The `dev.sh` and `restart-dev.sh` scripts are specific to the agent workspace and are intentionally gitignored. When working in the main repo, developers should use `yarn dev` directly, which will use the default port 3000.

## Setting Up a New Agent Workspace

To set up a new agent workspace (e.g., agent-3, agent-4, etc.):

1. **Copy the example files:**

   ```bash
   cd packages/cloudwatchlive/frontend
   cp dev.sh.example dev.sh
   cp restart-dev.sh.example restart-dev.sh
   ```

2. **Edit both files and change the PORT variable:**

   ```bash
   # In dev.sh and restart-dev.sh, update:
   PORT=3003  # For agent-3, use 3003; for agent-4, use 3004, etc.
   ```

3. **Make them executable:**

   ```bash
   chmod +x dev.sh restart-dev.sh
   ```

4. **Run your dev server:**
   ```bash
   ./dev.sh
   # or
   ./restart-dev.sh
   ```

The `.gitignore` ensures these customized scripts won't be committed, while the `.example` files remain tracked for reference.

## Port Allocation

- **Port 3000**: Main nl-mono-repo
- **Port 3001**: Agent-1 workspace
- **Port 3002**: Agent-2 workspace
- **Port 3003+**: Available for additional agent workspaces
