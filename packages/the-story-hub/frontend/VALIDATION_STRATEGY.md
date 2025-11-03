# API Response Validation Strategy

## Overview

All GraphQL API responses are validated using Zod schemas to ensure type safety and runtime validation. This document describes our validation approach and how to use it.

## Architecture

### 1. Centralized Validation Schemas (`/src/types/ValidationSchemas.ts`)

This file contains Zod validation schemas for all GraphQL response types:

- **Chapter Types**: `ChapterNodeSchema`, `ChapterStatsSchema`, `ChapterBadgesSchema`
- **Story Types**: `StorySchema`, `StoryStatsSchema`, `StoryConnectionSchema`
- **User Types**: `UserSchema`, `UserStatsSchema`
- **Notification Types**: `NotificationSchema`, `NotificationConnectionSchema`
- **Tree Types**: `TreeDataSchema`, `TreeNodeSchema`
- **Bookmark Types**: `BookmarkSchema`

### 2. Type Safety with GraphQL Types

All validation schemas use the `z.ZodType<GQLType>` constraint to ensure they match GraphQL types exactly:

```typescript
export const StorySchema: z.ZodType<GQLStory> = z.object({
  __typename: z.literal("Story"),
  // ... fields match gqlTypes.Story exactly
});

export type Story = GQLStory; // Use GraphQL type directly
```

**Benefits:**
- ✅ **Runtime validation** - Zod validates API responses at runtime
- ✅ **Compile-time type safety** - TypeScript ensures schema matches GraphQL types
- ✅ **Single source of truth** - GraphQL types drive TypeScript types
- ✅ **Automatic validation** - Parse errors are caught immediately

### 3. API Layer Validation

All API functions use Zod schemas to parse GraphQL responses:

#### Example: chapters.ts
```typescript
export async function createChapterAPI(
  input: CreateChapterInput,
): Promise<ChapterNode> {
  const result = await client.graphql({
    query: createChapter,
    variables: { input },
  });
  return ChapterNodeSchema.parse(result.data.createChapter);
}
```

#### Example: stories.ts
```typescript
export async function listStoriesAPI(
  filter?: StoryFilter,
  limit?: number,
  nextToken?: string,
): Promise<StoryConnection> {
  const result = await client.graphql({
    query: listStories,
    variables: { filter, limit, nextToken },
  });
  return StoryConnectionSchema.parse(result.data.listStories);
}
```

### 4. Form Validation Schemas

Form validation schemas remain separate and are defined in their respective files:

- `/src/types/StorySchemas.ts` - Story form schemas (`CreateStoryFormSchema`, `UpdateStoryFormSchema`)
- `/src/types/CommentSchemas.ts` - Comment schemas and validation

These files re-export response validation schemas from `ValidationSchemas.ts` for backwards compatibility.

## Usage Guidelines

### Adding a New API Endpoint

1. **Check if GraphQL type exists** in `/src/types/gqlTypes.ts`
2. **Create Zod schema** in `/src/types/ValidationSchemas.ts`:
   ```typescript
   export const YourTypeSchema: z.ZodType<GQLYourType> = z.object({
     __typename: z.literal("YourType"),
     // ... fields
   });

   export type YourType = GQLYourType;
   ```
3. **Use schema in API function**:
   ```typescript
   import { YourTypeSchema, type YourType } from "@/types/ValidationSchemas";

   export async function getYourTypeAPI(): Promise<YourType> {
     const result = await client.graphql({ query: getYourType });
     return YourTypeSchema.parse(result.data.getYourType);
   }
   ```

### Handling Arrays

Use `z.array()` for array responses:

```typescript
return z.array(ChapterNodeSchema).parse(result.data.listBranches);
```

### Handling Nullable Responses

Check for null before parsing:

```typescript
if (!result.data.getStory) return null;
return StorySchema.parse(result.data.getStory);
```

### Recursive Types

Use `z.lazy()` for recursive types:

```typescript
export const TreeNodeSchema: z.ZodType<GQLTreeNode> = z.lazy(() =>
  z.object({
    __typename: z.literal("TreeNode"),
    // ... fields
    children: z.array(TreeNodeSchema), // Recursive!
  })
);
```

## Validation Locations

| API Module | Validation Applied | Schema Location |
|------------|-------------------|-----------------|
| `/lib/api/chapters.ts` | ✅ All endpoints | `ValidationSchemas.ts` |
| `/lib/api/stories.ts` | ✅ All endpoints | `ValidationSchemas.ts` |
| `/lib/api/users.ts` | ✅ All endpoints | `ValidationSchemas.ts` |
| `/lib/api/comments.ts` | ✅ All endpoints | `CommentSchemas.ts` |

## Error Handling

Zod parse errors will throw with detailed information about what failed validation:

```typescript
try {
  return StorySchema.parse(result.data.getStory);
} catch (error) {
  // error will contain detailed validation errors
  console.error("Story validation failed:", error);
  throw error;
}
```

## Benefits

1. **Type Safety**: Catch type mismatches at both compile-time and runtime
2. **Data Integrity**: Ensure API responses match expected structure
3. **Developer Experience**: Clear error messages when validation fails
4. **Refactoring Safety**: Changes to GraphQL types are caught immediately
5. **Documentation**: Schemas serve as living documentation of API responses

## Migration Checklist

- [x] Create centralized `ValidationSchemas.ts`
- [x] Migrate Chapter types to ValidationSchemas
- [x] Migrate Story types to ValidationSchemas
- [x] Migrate User types to ValidationSchemas
- [x] Update all chapter API functions to use Zod validation
- [x] Update all story API functions to use Zod validation
- [x] Update all user API functions to use Zod validation
- [x] Update StorySchemas.ts to re-export from ValidationSchemas
- [x] Verify TypeScript compilation passes
- [ ] Add Notification API validation (when endpoints are created)
- [ ] Add Bookmark API validation (when endpoints are created)
