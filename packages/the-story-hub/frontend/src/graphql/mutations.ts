/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../types/gqlTypes";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const saveBookmark =
  /* GraphQL */ `mutation SaveBookmark($input: SaveBookmarkInput!) {
  saveBookmark(input: $input) {
    userId
    storyId
    currentNodeId
    breadcrumbs
    lastRead
    __typename
  }
}
` as GeneratedMutation<
    APITypes.SaveBookmarkMutationVariables,
    APITypes.SaveBookmarkMutation
  >;
export const createChapter =
  /* GraphQL */ `mutation CreateChapter($input: CreateChapterInput!) {
  createChapter(input: $input) {
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
` as GeneratedMutation<
    APITypes.CreateChapterMutationVariables,
    APITypes.CreateChapterMutation
  >;
export const createBranch =
  /* GraphQL */ `mutation CreateBranch($input: CreateBranchInput!) {
  createBranch(input: $input) {
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
` as GeneratedMutation<
    APITypes.CreateBranchMutationVariables,
    APITypes.CreateBranchMutation
  >;
export const updateChapter =
  /* GraphQL */ `mutation UpdateChapter($input: UpdateChapterInput!) {
  updateChapter(input: $input) {
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
` as GeneratedMutation<
    APITypes.UpdateChapterMutationVariables,
    APITypes.UpdateChapterMutation
  >;
export const voteOnChapter =
  /* GraphQL */ `mutation VoteOnChapter($storyId: ID!, $nodeId: ID!, $voteType: VoteType!) {
  voteOnChapter(storyId: $storyId, nodeId: $nodeId, voteType: $voteType) {
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
` as GeneratedMutation<
    APITypes.VoteOnChapterMutationVariables,
    APITypes.VoteOnChapterMutation
  >;
export const awardBadge =
  /* GraphQL */ `mutation AwardBadge($input: AwardBadgeInput!) {
  awardBadge(input: $input) {
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
` as GeneratedMutation<
    APITypes.AwardBadgeMutationVariables,
    APITypes.AwardBadgeMutation
  >;
export const createStory =
  /* GraphQL */ `mutation CreateStory($input: CreateStoryInput!) {
  createStory(input: $input) {
    storyId
    authorId
    title
    synopsis
    genre
    ageRating
    contentWarnings
    ratingExplanation
    stats {
      totalBranches
      totalReads
      rating
      __typename
    }
    featured
    createdAt
    coverImageUrl
    __typename
  }
}
` as GeneratedMutation<
    APITypes.CreateStoryMutationVariables,
    APITypes.CreateStoryMutation
  >;
export const updateStory =
  /* GraphQL */ `mutation UpdateStory($input: UpdateStoryInput!) {
  updateStory(input: $input) {
    storyId
    authorId
    title
    synopsis
    genre
    ageRating
    contentWarnings
    ratingExplanation
    stats {
      totalBranches
      totalReads
      rating
      __typename
    }
    featured
    createdAt
    coverImageUrl
    __typename
  }
}
` as GeneratedMutation<
    APITypes.UpdateStoryMutationVariables,
    APITypes.UpdateStoryMutation
  >;
export const createNotification =
  /* GraphQL */ `mutation CreateNotification($input: CreateNotificationInput!) {
  createNotification(input: $input) {
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
}
` as GeneratedMutation<
    APITypes.CreateNotificationMutationVariables,
    APITypes.CreateNotificationMutation
  >;
export const markNotificationAsRead =
  /* GraphQL */ `mutation MarkNotificationAsRead($notificationId: ID!) {
  markNotificationAsRead(notificationId: $notificationId) {
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
}
` as GeneratedMutation<
    APITypes.MarkNotificationAsReadMutationVariables,
    APITypes.MarkNotificationAsReadMutation
  >;
export const markAllNotificationsAsRead =
  /* GraphQL */ `mutation MarkAllNotificationsAsRead($userId: ID!) {
  markAllNotificationsAsRead(userId: $userId)
}
` as GeneratedMutation<
    APITypes.MarkAllNotificationsAsReadMutationVariables,
    APITypes.MarkAllNotificationsAsReadMutation
  >;
