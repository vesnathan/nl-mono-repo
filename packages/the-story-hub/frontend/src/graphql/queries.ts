/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../types/gqlTypes";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getBookmark = /* GraphQL */ `query GetBookmark($storyId: ID!) {
  getBookmark(storyId: $storyId) {
    userId
    storyId
    currentNodeId
    breadcrumbs
    lastRead
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetBookmarkQueryVariables,
  APITypes.GetBookmarkQuery
>;
export const getChapter =
  /* GraphQL */ `query GetChapter($storyId: ID!, $nodeId: ID!) {
  getChapter(storyId: $storyId, nodeId: $nodeId) {
    nodeId
    storyId
    parentNodeId
    authorId
    authorName
    content
    branchDescription
    paragraphIndex
    chapterNumber
    createdAt
    editableUntil
    stats {
      reads
      upvotes
      downvotes
      childBranches
      __typename
    }
    badges {
      authorApproved
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<
    APITypes.GetChapterQueryVariables,
    APITypes.GetChapterQuery
  >;
export const listBranches =
  /* GraphQL */ `query ListBranches($storyId: ID!, $nodeId: ID!) {
  listBranches(storyId: $storyId, nodeId: $nodeId) {
    nodeId
    storyId
    parentNodeId
    authorId
    authorName
    content
    branchDescription
    paragraphIndex
    chapterNumber
    ageRating
    contentWarnings
    maxChildAgeRating
    createdAt
    editableUntil
    stats {
      reads
      upvotes
      downvotes
      childBranches
      __typename
    }
    badges {
      authorApproved
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<
    APITypes.ListBranchesQueryVariables,
    APITypes.ListBranchesQuery
  >;
export const getStory = /* GraphQL */ `query GetStory($storyId: ID!) {
  getStory(storyId: $storyId) {
    storyId
    authorId
    authorName
    title
    synopsis
    genre
    ageRating
    contentWarnings
    ratingExplanation
    stats {
      totalBranches
      totalReads
      totalComments
      rating
      __typename
    }
    featured
    createdAt
    coverImageUrl
    rootChapterId
    aiCreated
    allowAI
    __typename
  }
}
` as GeneratedQuery<APITypes.GetStoryQueryVariables, APITypes.GetStoryQuery>;
export const listStories =
  /* GraphQL */ `query ListStories($filter: StoryFilter, $limit: Int, $nextToken: String) {
  listStories(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      storyId
      authorId
      authorName
      title
      synopsis
      genre
      ageRating
      contentWarnings
      ratingExplanation
      stats {
        totalBranches
        totalReads
        totalComments
        rating
        __typename
      }
      featured
      createdAt
      coverImageUrl
      aiCreated
      allowAI
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
    APITypes.ListStoriesQueryVariables,
    APITypes.ListStoriesQuery
  >;
export const getStoryTree = /* GraphQL */ `query GetStoryTree($storyId: ID!) {
  getStoryTree(storyId: $storyId) {
    rootNode {
      nodeId
      title
      description
      stats {
        reads
        upvotes
        downvotes
        childBranches
        __typename
      }
      badges {
        authorApproved
        __typename
      }
      authorId
      children {
        nodeId
        title
        description
        stats {
          reads
          upvotes
          downvotes
          childBranches
          __typename
        }
        badges {
          authorApproved
          __typename
        }
        authorId
        children {
          nodeId
          title
          description
          stats {
            reads
            upvotes
            downvotes
            childBranches
            __typename
          }
          badges {
            authorApproved
            __typename
          }
          authorId
          children {
            nodeId
            title
            description
            stats {
              reads
              upvotes
              downvotes
              childBranches
              __typename
            }
            badges {
              authorApproved
              __typename
            }
            authorId
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
    totalNodes
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetStoryTreeQueryVariables,
  APITypes.GetStoryTreeQuery
>;
export const getReadingPath =
  /* GraphQL */ `query GetReadingPath($storyId: ID!, $nodePath: [ID!]!) {
  getReadingPath(storyId: $storyId, nodePath: $nodePath) {
    nodeId
    storyId
    parentNodeId
    authorId
    content
    branchDescription
    paragraphIndex
    chapterNumber
    createdAt
    editableUntil
    stats {
      reads
      upvotes
      downvotes
      childBranches
      __typename
    }
    badges {
      authorApproved
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<
    APITypes.GetReadingPathQueryVariables,
    APITypes.GetReadingPathQuery
  >;
export const getUserNotifications =
  /* GraphQL */ `query GetUserNotifications($userId: ID!, $limit: Int, $nextToken: String) {
  getUserNotifications(userId: $userId, limit: $limit, nextToken: $nextToken) {
    items {
      notificationId
      userId
      type
      message
      read
      relatedStoryId
      relatedNodeId
      relatedUserId
      createdAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
    APITypes.GetUserNotificationsQueryVariables,
    APITypes.GetUserNotificationsQuery
  >;
export const getUnreadCount =
  /* GraphQL */ `query GetUnreadCount($userId: ID!) {
  getUnreadCount(userId: $userId)
}
` as GeneratedQuery<
    APITypes.GetUnreadCountQueryVariables,
    APITypes.GetUnreadCountQuery
  >;
export const getUserProfile =
  /* GraphQL */ `query GetUserProfile($userId: ID!) {
  getUserProfile(userId: $userId) {
    userId
    username
    email
    bio
    stats {
      storiesCreated
      branchesContributed
      totalUpvotes
      __typename
    }
    patreonSupporter
    clientType
    createdAt
    __typename
  }
}
` as GeneratedQuery<
    APITypes.GetUserProfileQueryVariables,
    APITypes.GetUserProfileQuery
  >;
