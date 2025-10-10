cloudwatchlive-template

This package provides a small CLI script to bootstrap a new package under `packages/` by copying the existing `packages/cloudwatchlive` package and performing minimal substitutions (package name, README title).

Usage:

1. From the repository root, run:

   yarn workspace @nl/cloudwatchlive-template run create -- <new-package-name>

   or

   node packages/cloudwatchlive-template/scripts/create-template.js <new-package-name>

2. The script will create `packages/<new-package-name>` by copying the full contents of `packages/cloudwatchlive` and updating the new package.json name and README title.

Notes:
- This is a convenience helper. Review the created package and update any service-specific config (Sentry, Amplify, dev ports) before using.
- The script avoids copying node_modules and .next directories.
