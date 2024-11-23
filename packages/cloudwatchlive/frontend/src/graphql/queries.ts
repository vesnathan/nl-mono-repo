/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./gqlTypes";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getAuthorizedUser = /* GraphQL */ `query GetAuthorizedUser($userId: String!) {
  getAuthorizedUser(userId: $userId) {
    userId
    userAddedById
    PrivacyPolicy
    TermsAndConditions
    userEmail
    userFirstName
    userLastName
    userPhone
    userTitle
    userProfilePicture {
      Bucket
      Key
      __typename
    }
    userCreated
    organizationId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAuthorizedUserQueryVariables,
  APITypes.GetAuthorizedUserQuery
>;
export const getCWLDataForUser = /* GraphQL */ `query GetCWLDataForUser($userId: String!) {
  getCWLDataForUser(userId: $userId) {
    dataValues {
      events
      __typename
    }
    lastUpdate
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetCWLDataForUserQueryVariables,
  APITypes.GetCWLDataForUserQuery
>;
