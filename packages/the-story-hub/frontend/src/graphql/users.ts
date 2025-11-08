export const checkUsernameAvailability = /* GraphQL */ `
  query CheckUsernameAvailability($username: String!) {
    checkUsernameAvailability(username: $username) {
      available
      username
    }
  }
`;
