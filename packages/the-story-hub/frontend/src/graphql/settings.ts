/* GraphQL operations for Site Settings */

export const getSiteSettings = /* GraphQL */ `
  query GetSiteSettings {
    getSiteSettings {
      grantOGBadgeToPatreonSupporters
      googleOAuthEnabled
      facebookOAuthEnabled
      appleOAuthEnabled
      adsEnabled
      adsensePublisherId
      adsenseVerificationCode
      showAdsOnHomepage
      showAdsOnStoryEnd
      showAdsInFooter
      homepageAdSlot
      storyEndAdSlot
      footerAdSlot
      sentryDsn
      sentryEnabled
      updatedAt
      updatedBy
    }
  }
`;

export const updateSiteSettings = /* GraphQL */ `
  mutation UpdateSiteSettings($input: UpdateSiteSettingsInput!) {
    updateSiteSettings(input: $input) {
      grantOGBadgeToPatreonSupporters
      googleOAuthEnabled
      facebookOAuthEnabled
      appleOAuthEnabled
      adsEnabled
      adsensePublisherId
      adsenseVerificationCode
      showAdsOnHomepage
      showAdsOnStoryEnd
      showAdsInFooter
      homepageAdSlot
      storyEndAdSlot
      footerAdSlot
      sentryDsn
      sentryEnabled
      updatedAt
      updatedBy
    }
  }
`;
