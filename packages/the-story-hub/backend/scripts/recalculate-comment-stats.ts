import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME =
  process.env.TABLE_NAME || "nlmonorepo-thestoryhub-datatable-dev";

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

interface Comment {
  PK: string;
  SK: string;
  commentId: string;
  parentCommentId?: string | null;
  depth: number;
  stats: {
    upvotes: number;
    downvotes: number;
    replyCount: number;
    totalReplyCount: number;
  };
}

// Get all comments
async function getAllComments(): Promise<Comment[]> {
  const comments: Comment[] = [];
  let lastEvaluatedKey: any = undefined;

  do {
    const params: any = {
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":sk": "COMMENT#",
      },
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const result = await docClient.send(new ScanCommand(params));
    comments.push(...((result.Items as Comment[]) || []));
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return comments;
}

// Get direct replies for a comment
async function getDirectReplies(comment: Comment): Promise<Comment[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      FilterExpression: "parentCommentId = :parentId",
      ExpressionAttributeValues: {
        ":pk": comment.PK,
        ":sk": "COMMENT#",
        ":parentId": comment.commentId,
      },
    }),
  );

  return (result.Items as Comment[]) || [];
}

// Recursively count all descendants
async function countAllDescendants(
  comment: Comment,
  allComments: Map<string, Comment>,
): Promise<number> {
  // Find direct children from the map
  const directChildren = Array.from(allComments.values()).filter(
    (c) => c.parentCommentId === comment.commentId,
  );

  let total = 0;
  for (const child of directChildren) {
    // Count this child
    total += 1;
    // Recursively count this child's descendants
    total += await countAllDescendants(child, allComments);
  }

  return total;
}

// Calculate correct depth for a comment
function calculateDepth(
  comment: Comment,
  commentMap: Map<string, Comment>,
): number {
  if (!comment.parentCommentId) {
    return 0; // Top-level comment
  }

  const parent = commentMap.get(comment.parentCommentId);
  if (!parent) {
    console.warn(
      `Parent ${comment.parentCommentId} not found for comment ${comment.commentId}`,
    );
    return 1; // Default to depth 1 if parent missing
  }

  return calculateDepth(parent, commentMap) + 1;
}

async function main() {
  console.log("🔄 Recalculating comment stats...\n");

  // Get all comments
  console.log("📥 Fetching all comments from DynamoDB...");
  const allComments = await getAllComments();
  console.log(`Found ${allComments.length} total comments\n`);

  // Create a map for faster lookups
  const commentMap = new Map<string, Comment>();
  for (const comment of allComments) {
    commentMap.set(comment.commentId, comment);
  }

  let updated = 0;
  let skipped = 0;

  // Process each comment
  for (const comment of allComments) {
    // Find direct children
    const directChildren = Array.from(commentMap.values()).filter(
      (c) => c.parentCommentId === comment.commentId,
    );

    const directReplyCount = directChildren.length;

    // Count all descendants recursively
    const totalDescendants = await countAllDescendants(comment, commentMap);

    // Calculate correct depth
    const correctDepth = calculateDepth(comment, commentMap);

    // Check if anything needs updating
    const needsUpdate =
      comment.stats.replyCount !== directReplyCount ||
      comment.stats.totalReplyCount !== totalDescendants ||
      comment.depth !== correctDepth;

    if (needsUpdate) {
      console.log(
        `📝 Updating comment ${comment.commentId.substring(0, 8)}... (depth: ${comment.depth}→${correctDepth}, direct: ${directReplyCount}, total: ${totalDescendants})`,
      );

      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: comment.PK,
            SK: comment.SK,
          },
          UpdateExpression:
            "SET #stats.#replyCount = :replyCount, #stats.#totalReplyCount = :totalReplyCount, #depth = :depth",
          ExpressionAttributeNames: {
            "#stats": "stats",
            "#replyCount": "replyCount",
            "#totalReplyCount": "totalReplyCount",
            "#depth": "depth",
          },
          ExpressionAttributeValues: {
            ":replyCount": directReplyCount,
            ":totalReplyCount": totalDescendants,
            ":depth": correctDepth,
          },
        }),
      );

      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Updated: ${updated} comments`);
  console.log(`   Skipped: ${skipped} comments (already correct)`);
}

main().catch(console.error);
