/* GraphQL operations for Site Settings */

export const getSiteSettings = /* GraphQL */ `
  query GetSiteSettings {
    getSiteSettings {
      grantOGBadgeToPatreonSupporters
      updatedAt
      updatedBy
    }
  }
`;

export const updateSiteSettings = /* GraphQL */ `
  mutation UpdateSiteSettings($input: UpdateSiteSettingsInput!) {
    updateSiteSettings(input: $input) {
      grantOGBadgeToPatreonSupporters
      updatedAt
      updatedBy
    }
  }
`;
