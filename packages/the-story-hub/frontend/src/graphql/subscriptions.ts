/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../types/gqlTypes";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onNewNotification =
  /* GraphQL */ `subscription OnNewNotification($userId: ID!) {
  onNewNotification(userId: $userId) {
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
` as GeneratedSubscription<
    APITypes.OnNewNotificationSubscriptionVariables,
    APITypes.OnNewNotificationSubscription
  >;
export const onNewBranch =
  /* GraphQL */ `subscription OnNewBranch($storyId: ID!) {
  onNewBranch(storyId: $storyId) {
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
` as GeneratedSubscription<
    APITypes.OnNewBranchSubscriptionVariables,
    APITypes.OnNewBranchSubscription
  >;
