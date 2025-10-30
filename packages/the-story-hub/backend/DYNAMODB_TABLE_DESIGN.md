# DynamoDB Single-Table Design for Story Branching Platform

This document describes the single-table design pattern used for the Story Hub application.

## Table Structure

**Table Name**: `nlmonorepo-tsh-datatable-{Stage}`

**Primary Key**:
- `PK` (Partition Key) - String
- `SK` (Sort Key) - String

**Global Secondary Index (GSI1)**:
- `GSI1PK` (Partition Key) - String
- `GSI1SK` (Sort Key) - String

**Features**:
- Billing Mode: PAY_PER_REQUEST
- Encryption: KMS (from Shared Stack)
- Point-in-Time Recovery: Enabled
- DynamoDB Streams: Enabled (NEW_AND_OLD_IMAGES)

## Access Patterns

### 1. Get Story by ID
```typescript
{
  KeyConditionExpression: "PK = :pk AND SK = :sk",
  ExpressionAttributeValues: {
    ":pk": `STORY#${storyId}`,
    ":sk": "METADATA"
  }
}
```

### 2. Get all Chapters for a Story
```typescript
{
  KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
  ExpressionAttributeValues: {
    ":pk": `STORY#${storyId}`,
    ":sk": "CHAPTER#"
  }
}
```

### 3. Get User Profile
```typescript
{
  KeyConditionExpression: "PK = :pk AND SK = :sk",
  ExpressionAttributeValues: {
    ":pk": `USER#${userId}`,
    ":sk": `PROFILE#${userId}`
  }
}
```

### 4. Get User's Stories (created by user)
```typescript
{
  IndexName: "GSI1",
  KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
  ExpressionAttributeValues: {
    ":pk": `USER#${userId}`,
    ":sk": "STORY#"
  }
}
```

### 5. Get User's Branches (contributed by user)
```typescript
{
  IndexName: "GSI1",
  KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
  ExpressionAttributeValues: {
    ":pk": `USER#${userId}`,
    ":sk": "BRANCH#"
  }
}
```

### 6. Get Bookmark
```typescript
{
  KeyConditionExpression: "PK = :pk AND SK = :sk",
  ExpressionAttributeValues: {
    ":pk": `USER#${userId}`,
    ":sk": `BOOKMARK#${storyId}`
  }
}
```

### 7. Get User's Notifications
```typescript
{
  KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
  ExpressionAttributeValues: {
    ":pk": `USER#${userId}`,
    ":sk": "NOTIFICATION#"
  },
  ScanIndexForward: false, // Latest notifications first
  Limit: 20
}
```

### 8. Get Child Branches of a Chapter
```typescript
{
  KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
  ExpressionAttributeValues: {
    ":pk": `CHAPTER#${parentNodeId}`,
    ":sk": "CHILD#"
  }
}
```

### 9. Browse/Discover Stories (chronological)
```typescript
{
  IndexName: "GSI1",
  KeyConditionExpression: "GSI1PK = :pk",
  ExpressionAttributeValues: {
    ":pk": "STORY_LIST"
  },
  ScanIndexForward: false, // Latest stories first
  Limit: 20
}
```

## Entity Patterns

### Story Entity
```typescript
{
  PK: "STORY#{storyId}",
  SK: "METADATA",
  GSI1PK: "STORY_LIST",
  GSI1SK: "{createdAt}#{storyId}",

  // Story attributes
  storyId: string,
  title: string,
  synopsis: string,
  authorId: string,
  authorName: string,
  genre: string,
  ageRating: string,
  contentWarnings: string[],
  coverImageUrl?: string,
  status: "DRAFT" | "PUBLISHED" | "COMPLETED",
  createdAt: string, // ISO timestamp
  updatedAt: string,
  stats: {
    totalReads: number,
    totalUpvotes: number,
    totalBranches: number,
    totalChapters: number
  }
}
```

### Chapter Node Entity
```typescript
{
  PK: "STORY#{storyId}",
  SK: "CHAPTER#{nodeId}",
  GSI1PK: "USER#{authorId}",
  GSI1SK: "BRANCH#{createdAt}#{nodeId}",

  // Chapter attributes
  nodeId: string,
  storyId: string,
  parentNodeId?: string, // null for root chapter
  authorId: string,
  authorName: string,
  title: string,
  content: string, // Markdown content
  matchesVision: boolean, // Author's vision match
  authorApproved: boolean, // Original author approved this branch
  depth: number, // Distance from root (0 for first chapter)
  order: number, // Child order (for sorting siblings)
  createdAt: string,
  updatedAt: string,
  stats: {
    reads: number,
    upvotes: number,
    childCount: number
  }
}
```

### User Entity
```typescript
{
  PK: "USER#{userId}",
  SK: "PROFILE#{userId}",

  // User attributes (auto-synced from Cognito)
  userId: string, // Cognito sub
  email: string,
  displayName: string,
  bio?: string,
  profilePictureUrl?: string,
  createdAt: string,
  lastLoginAt: string,
  stats: {
    storiesCreated: number,
    branchesContributed: number,
    totalReads: number,
    totalUpvotes: number
  }
}
```

### Bookmark Entity
```typescript
{
  PK: "USER#{userId}",
  SK: "BOOKMARK#{storyId}",

  // Bookmark attributes
  userId: string,
  storyId: string,
  currentNodeId: string, // Last chapter read
  createdAt: string,
  updatedAt: string
}
```

### Vote Entity
```typescript
{
  PK: "USER#{userId}",
  SK: "VOTE#{nodeId}",

  // Vote attributes
  userId: string,
  nodeId: string,
  storyId: string,
  voteType: "UPVOTE" | "DOWNVOTE",
  createdAt: string
}
```

### Notification Entity
```typescript
{
  PK: "USER#{userId}",
  SK: "NOTIFICATION#{timestamp}#{notificationId}",
  GSI1PK: "NOTIFICATION#{notificationId}",
  GSI1SK: "USER#{userId}",

  // Notification attributes
  notificationId: string,
  userId: string,
  type: "NEW_BRANCH" | "UPVOTE" | "AUTHOR_APPROVED" | "STORY_COMPLETED",
  title: string,
  message: string,
  relatedStoryId?: string,
  relatedNodeId?: string,
  relatedUserId?: string,
  read: boolean,
  createdAt: string
}
```

### Child Relationship Entity (for efficient child queries)
```typescript
{
  PK: "CHAPTER#{parentNodeId}",
  SK: "CHILD#{order}#{nodeId}",

  // Minimal child reference
  nodeId: string,
  parentNodeId: string,
  storyId: string,
  order: number,
  authorId: string,
  createdAt: string
}
```

## Best Practices

### 1. Composite Sort Keys
Use composite sort keys for efficient sorting:
```typescript
GSI1SK: "{timestamp}#{id}" // Sorts by time, breaks ties with ID
SK: "NOTIFICATION#{timestamp}#{notificationId}"
```

### 2. Denormalization
Store frequently accessed data redundantly to minimize queries:
```typescript
// Store author name in chapter to avoid user lookup
{
  authorId: "user123",
  authorName: "John Doe" // Denormalized from User entity
}
```

### 3. Pagination
Always use pagination for large result sets:
```typescript
{
  Limit: 20,
  ExclusiveStartKey: lastEvaluatedKey // From previous query
}
```

### 4. Atomic Counters
Use atomic updates for counters:
```typescript
{
  UpdateExpression: "ADD stats.reads :incr",
  ExpressionAttributeValues: {
    ":incr": 1
  }
}
```

### 5. Conditional Writes
Prevent concurrent modification issues:
```typescript
{
  ConditionExpression: "attribute_not_exists(PK) OR version = :oldVersion",
  ExpressionAttributeValues: {
    ":oldVersion": currentVersion
  }
}
```

## Migration Notes

- The table uses KMS encryption from the Shared Stack
- Point-in-Time Recovery is enabled for production safety
- DynamoDB Streams can be used for EventBridge integration
- All timestamps should be ISO 8601 format for consistent sorting
- Use ULID or KSUID for IDs (lexicographically sortable)

## Performance Considerations

1. **Hot Partitions**: Distribute writes across partitions using random prefixes if needed
2. **GSI Throttling**: GSI inherits capacity from base table (PAY_PER_REQUEST)
3. **Item Size**: Keep items under 400KB (DynamoDB limit)
4. **Batch Operations**: Use BatchGetItem/BatchWriteItem for bulk operations (max 25 items)
5. **Eventually Consistent Reads**: Use for non-critical data to reduce costs
