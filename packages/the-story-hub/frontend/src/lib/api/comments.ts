import { client } from "@/lib/amplify";
import {
  CommentSchema,
  CommentConnectionSchema,
  type Comment,
  type CommentConnection,
  type CommentSortBy,
  type CommentVoteType,
} from "@/types/CommentSchemas";
import {
  shouldUseLocalData,
  getCommentsForNode,
  setUsingLocalData,
} from "@/lib/local-data";

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

  // Use local data if enabled
  if (shouldUseLocalData()) {
    console.log("Using local data with pagination");
    const result = getCommentsForNode(storyId, nodeId, {
      limit,
      nextToken,
      sortBy,
    });
    console.log("Local data result:", {
      itemsCount: result.items.length,
      total: result.total,
      nextToken: result.nextToken,
    });
    return result as CommentConnection;
  }

  try {
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
    const result = CommentConnectionSchema.parse(response.data.listComments);

    // Recursively count all comments in the fetched response
    function countAllComments(comment: Comment): number {
      let count = 1; // Count this comment
      if (comment.replies && comment.replies.length > 0) {
        for (const reply of comment.replies) {
          count += countAllComments(reply);
        }
      }
      return count;
    }

    // Calculate total by recursively counting all fetched comments and replies
    let totalActivity = 0;
    for (const comment of result.items) {
      totalActivity += countAllComments(comment);
    }

    console.log(
      `Calculated total activity (recursively counted from response): ${totalActivity}`,
    );

    return {
      ...result,
      total: totalActivity, // Total includes all nested replies in response
    };
  } catch (error) {
    console.error("===== API ERROR - Falling back to local data =====");
    console.error("Error:", error);
    console.error("==================================================\n");
    setUsingLocalData();
    const result = getCommentsForNode(storyId, nodeId, {
      limit,
      nextToken,
      sortBy,
    });
    console.log("Fallback to local data result:", {
      itemsCount: result.items.length,
      total: result.total,
      nextToken: result.nextToken,
    });
    return result as CommentConnection;
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
