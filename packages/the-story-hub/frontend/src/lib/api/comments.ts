import { client } from "@/lib/amplify";
import {
  CommentSchema,
  CommentConnectionSchema,
  type Comment,
  type CommentConnection,
  type CommentSortBy,
  type CommentVoteType,
} from "@/types/CommentSchemas";

// GraphQL Queries
const LIST_COMMENTS = /* GraphQL */ `
  query ListComments(
    $storyId: ID!
    $nodeId: ID!
    $sortBy: CommentSortBy
    $limit: Int
    $nextToken: String
  ) {
    listComments(
      storyId: $storyId
      nodeId: $nodeId
      sortBy: $sortBy
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        commentId
        storyId
        nodeId
        authorId
        authorName
        authorPatreonSupporter
        authorOGSupporter
        content
        parentCommentId
        depth
        createdAt
        updatedAt
        edited
        stats {
          upvotes
          downvotes
          replyCount
          totalReplyCount
        }
        replyCount
        replies {
          commentId
          storyId
          nodeId
          authorId
          authorName
          authorPatreonSupporter
          authorOGSupporter
          content
          parentCommentId
          depth
          createdAt
          updatedAt
          edited
          stats {
            upvotes
            downvotes
            replyCount
            totalReplyCount
          }
          replies {
            commentId
            storyId
            nodeId
            authorId
            authorName
            authorPatreonSupporter
            authorOGSupporter
            content
            parentCommentId
            depth
            createdAt
            updatedAt
            edited
            stats {
              upvotes
              downvotes
              replyCount
              totalReplyCount
            }
          }
        }
      }
      nextToken
      total
    }
  }
`;

const LIST_REPLIES = /* GraphQL */ `
  query ListReplies(
    $storyId: ID!
    $nodeId: ID!
    $parentCommentId: ID!
    $limit: Int
    $nextToken: String
  ) {
    listReplies(
      storyId: $storyId
      nodeId: $nodeId
      parentCommentId: $parentCommentId
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        commentId
        storyId
        nodeId
        authorId
        authorName
        authorPatreonSupporter
        authorOGSupporter
        content
        parentCommentId
        depth
        createdAt
        updatedAt
        edited
        stats {
          upvotes
          downvotes
          replyCount
          totalReplyCount
        }
      }
      nextToken
      total
    }
  }
`;

const GET_COMMENT = /* GraphQL */ `
  query GetComment(
    $storyId: ID!
    $nodeId: ID!
    $commentId: ID!
    $includeReplies: Boolean
  ) {
    getComment(
      storyId: $storyId
      nodeId: $nodeId
      commentId: $commentId
      includeReplies: $includeReplies
    ) {
      commentId
      storyId
      nodeId
      authorId
      authorName
      authorPatreonSupporter
      authorOGSupporter
      content
      parentCommentId
      depth
      createdAt
      updatedAt
      edited
      stats {
        upvotes
        downvotes
        replyCount
        totalReplyCount
      }
      replies {
        commentId
        authorName
        content
        createdAt
      }
    }
  }
`;

// GraphQL Mutations
const CREATE_COMMENT = /* GraphQL */ `
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      commentId
      storyId
      nodeId
      authorId
      authorName
      authorPatreonSupporter
      authorOGSupporter
      content
      parentCommentId
      depth
      createdAt
      updatedAt
      edited
      stats {
        upvotes
        downvotes
        replyCount
        totalReplyCount
      }
    }
  }
`;

const UPDATE_COMMENT = /* GraphQL */ `
  mutation UpdateComment($input: UpdateCommentInput!) {
    updateComment(input: $input) {
      commentId
      storyId
      nodeId
      authorId
      authorName
      content
      parentCommentId
      depth
      createdAt
      updatedAt
      edited
      stats {
        upvotes
        downvotes
        replyCount
        totalReplyCount
      }
    }
  }
`;

const DELETE_COMMENT = /* GraphQL */ `
  mutation DeleteComment($input: DeleteCommentInput!) {
    deleteComment(input: $input) {
      success
      message
    }
  }
`;

const VOTE_ON_COMMENT = /* GraphQL */ `
  mutation VoteOnComment(
    $storyId: ID!
    $nodeId: ID!
    $commentId: ID!
    $voteType: CommentVoteType!
  ) {
    voteOnComment(
      storyId: $storyId
      nodeId: $nodeId
      commentId: $commentId
      voteType: $voteType
    ) {
      commentId
      storyId
      nodeId
      authorId
      authorName
      content
      parentCommentId
      depth
      createdAt
      updatedAt
      edited
      stats {
        upvotes
        downvotes
        replyCount
        totalReplyCount
      }
    }
  }
`;

// API Functions
export async function listCommentsAPI(
  storyId: string,
  nodeId: string,
  sortBy?: CommentSortBy,
  limit: number = 20, // Default to 20 comments for better performance
  nextToken?: string,
): Promise<CommentConnection> {
  console.log("===== API CALL: listCommentsAPI =====");
  console.log("Request params:", {
    storyId,
    nodeId,
    sortBy,
    limit,
    nextToken,
  });

  const response = await client.graphql({
    query: LIST_COMMENTS,
    variables: {
      storyId,
      nodeId,
      sortBy,
      limit,
      nextToken,
    },
    // No authMode specified - uses default (Cognito with guest access)
  });

  console.log("Response:", JSON.stringify(response.data.listComments, null, 2));
  console.log("=====================================\n");

  // Validate response with Zod
  try {
    const result = CommentConnectionSchema.parse(response.data.listComments);

    // Calculate total using stats.totalReplyCount from backend
    // Each top-level comment counts as 1, plus all its nested replies from stats
    let totalActivity = 0;
    for (const comment of result.items) {
      totalActivity += 1; // Count the comment itself
      if (comment.stats?.totalReplyCount) {
        totalActivity += comment.stats.totalReplyCount; // Add all nested replies
      }
    }

    console.log(
      `Calculated total activity (top-level + nested): ${totalActivity}`,
    );

    return {
      ...result,
      total: totalActivity, // Override with accurate count including all nested
    };
  } catch (error) {
    console.error("===== ZOD VALIDATION ERROR =====");
    console.error("Error:", error);
    console.error("================================\n");
    throw error;
  }
}

export async function listRepliesAPI(
  storyId: string,
  nodeId: string,
  parentCommentId: string,
  limit?: number,
  nextToken?: string,
): Promise<CommentConnection> {
  const response = await client.graphql({
    query: LIST_REPLIES,
    variables: {
      storyId,
      nodeId,
      parentCommentId,
      limit,
      nextToken,
    },
    // No authMode specified - uses default (Cognito with guest access)
  });

  // Validate response with Zod
  return CommentConnectionSchema.parse(response.data.listReplies);
}

export async function getCommentAPI(
  storyId: string,
  nodeId: string,
  commentId: string,
  includeReplies?: boolean,
): Promise<Comment> {
  const response = await client.graphql({
    query: GET_COMMENT,
    variables: {
      storyId,
      nodeId,
      commentId,
      includeReplies,
    },
    // No authMode specified - uses default (Cognito with guest access)
  });

  // Validate response with Zod
  return CommentSchema.parse(response.data.getComment);
}

export async function createCommentAPI(
  storyId: string,
  nodeId: string,
  content: string,
  parentCommentId?: string,
): Promise<Comment> {
  const response = await client.graphql({
    query: CREATE_COMMENT,
    variables: {
      input: {
        storyId,
        nodeId,
        content,
        parentCommentId,
      },
    },
  });

  // Validate response with Zod
  return CommentSchema.parse(response.data.createComment);
}

export async function updateCommentAPI(
  storyId: string,
  nodeId: string,
  commentId: string,
  content: string,
): Promise<Comment> {
  const response = await client.graphql({
    query: UPDATE_COMMENT,
    variables: {
      input: {
        commentId,
        storyId,
        nodeId,
        content,
      },
    },
  });

  // Validate response with Zod
  return CommentSchema.parse(response.data.updateComment);
}

export async function deleteCommentAPI(
  storyId: string,
  nodeId: string,
  commentId: string,
): Promise<{ success: boolean; message?: string }> {
  const response = await client.graphql({
    query: DELETE_COMMENT,
    variables: {
      input: {
        commentId,
        storyId,
        nodeId,
      },
    },
  });

  return response.data.deleteComment;
}

export async function voteOnCommentAPI(
  storyId: string,
  nodeId: string,
  commentId: string,
  voteType: CommentVoteType,
): Promise<Comment> {
  const response = await client.graphql({
    query: VOTE_ON_COMMENT,
    variables: {
      storyId,
      nodeId,
      commentId,
      voteType,
    },
  });

  // Validate response with Zod
  return CommentSchema.parse(response.data.voteOnComment);
}
