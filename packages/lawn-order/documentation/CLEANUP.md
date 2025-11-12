# Lawn Order Project Cleanup (2025-11-12)

## Summary

Comprehensive cleanup of the lawn-order project to remove all unused dependencies, files, and GraphQL/AppSync infrastructure that was copied from The Story Hub template but not needed for this simple static site.

## Files Removed

### Configuration Files (src/config/)
- `amplifyConfig.ts` - AWS Amplify configuration not needed for simple static site
- `deploymentOutputs.ts` - CloudFormation output parsing not needed
- `masterConfig.ts` - Complex configuration not needed
- `validEnvs.ts` - Environment validation not needed

### Pages (src/app/)
- `services/page.tsx` - Services list page not needed (homepage shows services inline, no backend to manage services)

### Hooks (src/hooks/)
- `useBookings.ts` - Booking functionality not implemented
- `useQuotes.ts` - Quote management not implemented (contact form uses Lambda directly)
- `useServices.ts` - Services hook removed (no backend, services shown statically on homepage)

### Providers (src/providers/)
- `QueryProvider.tsx` - React Query provider removed (only needed for useServices hook)

### Components (src/components/layout/)
- `TopBar.tsx` - Unused layout component

### Backend Files (Entire Directories)
- `backend/resolvers/` - GraphQL/AppSync resolvers not needed (no GraphQL)
  - `services/Queries/Query.listServices.ts`
  - `quotes/Mutations/Mutation.requestQuote.ts`
  - All empty subdirectories
- `backend/schema/` - GraphQL schema files not needed (no AppSync)
  - `User.graphql`
  - `Booking.graphql`
  - `Service.graphql`
  - `Quote.graphql`
- `backend/src/` - Empty directory

### Empty Directories Removed
All empty directories throughout the project were removed, including:
- `frontend/src/contexts`
- `frontend/src/config`
- `frontend/src/stores`
- `frontend/src/utils`
- `frontend/src/graphQL`
- `frontend/src/constants`
- Various backend resolver subdirectories

## Dependencies Removed

### Runtime Dependencies (19 packages)
- `@aws-amplify/auth` - Not using AWS Amplify auth
- `@hookform/resolvers` - Not using react-hook-form
- `@heroui/spinner` - Not using HeroUI components
- `@heroui/progress` - Not using HeroUI components
- `@heroui/theme` - Not using HeroUI theme
- `@heroui/system` - Not using HeroUI system
- `@tanstack/react-query` - Not fetching data from backend (services shown statically)
- `await-to-js` - Not using this utility
- `aws-amplify` - Not using AWS Amplify
- `lawn-order-backend` - Not used (no GraphQL integration)
- `framer-motion` - Not using animations
- `react-dom` - Included with Next.js already
- `react-error-boundary` - Not using error boundaries
- `react-hook-form` - Using native form handling
- `shared` - Not using shared package
- `sharp` - Not using image processing (Next.js handles it)
- `uuid` - Not generating UUIDs
- `zod` - Not using schema validation
- `zustand` - Not using state management

### Dev Dependencies (5 packages)
- `@types/react-dom` - Not needed
- `@types/uuid` - Not needed
- `eslint` - Not using linting
- `eslint-config-next` - Not using linting
- `eslint-import-resolver-typescript` - Not using linting

## Remaining Dependencies

### Runtime (6 packages)
- `@iconify/react` - Icon library used throughout site
- `@nextui-org/react` - UI component library (Button, Input, Textarea, etc.)
- `next` - Next.js framework
- `react` - React library
- `swiper` - Carousel/slider component
- `tailwindcss` - CSS framework

### Dev (5 packages)
- `@types/node` - Node.js types
- `@types/react` - React types
- `autoprefixer` - PostCSS plugin for Tailwind
- `postcss` - CSS processor
- `typescript` - TypeScript compiler

## Package Size Reduction

**Before:**
- Runtime dependencies: 25 packages
- Dev dependencies: 10 packages
- Total: 35 packages

**After:**
- Runtime dependencies: 6 packages (76% reduction)
- Dev dependencies: 5 packages (50% reduction)
- Total: 11 packages (69% reduction)

## Benefits

1. **Faster installs**: 69% fewer packages to download
2. **Smaller node_modules**: Reduced disk space usage
3. **Faster builds**: Fewer dependencies to process
4. **Cleaner codebase**: No unused files or dead code
5. **Easier maintenance**: Less code to maintain and update

## Verification

After cleanup, `knip` reports only two minor warnings:
- "Unlisted binaries: next, ts-node" (these are provided by Next.js and used in scripts - not an issue)

No unused files, dependencies, or exports remain.

## Final Backend Structure

After cleanup, the backend only contains what's actually needed:
```
backend/
├── lambda/
│   ├── sendContactEmail.ts  (The only Lambda function)
│   ├── package.json
│   └── dist/                (Generated during deployment)
├── package.json
└── tsconfig.json
```

## Note

This cleanup aligns with the project architecture:
- Simple static site with S3 hosting
- Contact/quote forms use Lambda Function URL directly
- **No GraphQL, no AppSync, no resolvers**
- No Amplify, no complex state management
- Just Next.js static export with form submission to Lambda
- All the GraphQL/AppSync files were leftover templates from The Story Hub that were never used
