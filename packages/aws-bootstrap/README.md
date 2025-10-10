aws-bootstrap

This package provides a CLI script to bootstrap a new package under `packages/` by copying the existing `packages/cloudwatchlive` package and performing substitutions to convert project identifiers from `cwl`/`cloudwatchlive` to `awsb`/`aws-bootstrap`.

Usage:

1. From the repository root, run:

   node packages/aws-bootstrap/scripts/create-template.js <new-package-name>

2. The script will create `packages/<new-package-name>` by copying the full contents of `packages/cloudwatchlive`, renaming files containing `cwl` to `awsb`, and replacing token occurrences in text files.

Notes:
- Review the created package and update any service-specific config (Sentry DSN, Amplify settings, ports) before using.
- The script avoids copying `node_modules` and `.next` directories.
