import { client } from "@/lib/amplify";
import {
  Comment,
  CommentConnection,
  CommentSortBy,
  CommentVoteType,
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
        content
        parentCommentId
        depth
        createdAt
        updatedAt
        edited
        deleted
        stats {
          upvotes
          downvotes
          replyCount
          totalReplyCount
        }
        replyCount
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
        content
        parentCommentId
        depth
        createdAt
        updatedAt
        edited
        deleted
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
      content
      parentCommentId
      depth
      createdAt
      updatedAt
      edited
      deleted
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
      content
      updatedAt
      edited
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
      stats {
        upvotes
        downvotes
      }
    }
  }
`;

// API Functions
export async function listCommentsAPI(
  storyId: string,
  nodeId: string,
  sortBy?: CommentSortBy,
  limit?: number,
  nextToken?: string
): Promise<CommentConnection> {
  const response = await client.graphql({
    query: LIST_COMMENTS,
    variables: {
      storyId,
      nodeId,
      sortBy,
      limit,
      nextToken,
    },
    authMode: "iam", // Use IAM for public access (unauthenticated users)
  });

  return response.data.listComments as CommentConnection;
}

export async function listRepliesAPI(
  storyId: string,
  nodeId: string,
  parentCommentId: string,
  limit?: number,
  nextToken?: string
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
    authMode: "iam", // Use IAM for public access (unauthenticated users)
  });

  return response.data.listReplies as CommentConnection;
}

export async function getCommentAPI(
  storyId: string,
  nodeId: string,
  commentId: string,
  includeReplies?: boolean
): Promise<Comment> {
  const response = await client.graphql({
    query: GET_COMMENT,
    variables: {
      storyId,
      nodeId,
      commentId,
      includeReplies,
    },
    authMode: "iam", // Use IAM for public access (unauthenticated users)
  });

  return response.data.getComment as Comment;
}

export async function createCommentAPI(
  storyId: string,
  nodeId: string,
  content: string,
  parentCommentId?: string
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

  return response.data.createComment as Comment;
}

export async function updateCommentAPI(
  storyId: string,
  nodeId: string,
  commentId: string,
  content: string
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

  return response.data.updateComment as Comment;
}

export async function deleteCommentAPI(
  storyId: string,
  nodeId: string,
  commentId: string
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
  voteType: CommentVoteType
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

  return response.data.voteOnComment as Comment;
}
