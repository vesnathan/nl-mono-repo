/**
 * Mock Patreon API responses for development and testing
 * Based on Patreon API v2 spec: https://docs.patreon.com/
 */

export const PATREON_TIER_MAPPING = {
  // Map Patreon tier IDs to our internal tier enum
  "tier-bronze-123": "BRONZE",
  "tier-silver-456": "SILVER",
  "tier-gold-789": "GOLD",
  "tier-platinum-012": "PLATINUM",
} as const;

export const PATREON_TIER_CENTS = {
  BRONZE: 300, // $3/month
  SILVER: 500, // $5/month
  GOLD: 1000, // $10/month
  PLATINUM: 2000, // $20/month
} as const;

/**
 * Mock Patreon OAuth token response
 */
export const MOCK_PATREON_TOKEN_RESPONSE = {
  access_token: "mock_patreon_access_token_xyz123",
  refresh_token: "mock_patreon_refresh_token_abc456",
  expires_in: 2678400, // 31 days
  scope: "identity identity[email] campaigns campaigns.members",
  token_type: "Bearer",
};

/**
 * Mock Patreon identity response (user who just authenticated)
 */
export const MOCK_PATREON_IDENTITY_RESPONSE = {
  data: {
    attributes: {
      email: "patron@example.com",
      first_name: "Alex",
      full_name: "Alex Patron",
      image_url: "https://c10.patreonusercontent.com/example.jpg",
      last_name: "Patron",
      social_connections: {
        discord: null,
        facebook: null,
        google: null,
        instagram: null,
        spotify: null,
        twitch: null,
        twitter: null,
        youtube: null,
      },
      thumb_url: "https://c10.patreonusercontent.com/example_thumb.jpg",
      url: "https://www.patreon.com/user?u=12345678",
      vanity: null,
    },
    id: "12345678",
    type: "user",
    relationships: {
      memberships: {
        data: [
          {
            id: "member-abc123",
            type: "member",
          },
        ],
      },
    },
  },
  included: [
    {
      attributes: {
        campaign_lifetime_support_cents: 15000, // $150 lifetime
        currently_entitled_amount_cents: 1000, // $10/month (GOLD tier)
        is_follower: false,
        last_charge_date: "2025-01-01T00:00:00.000+00:00",
        last_charge_status: "Paid",
        lifetime_support_cents: 15000,
        next_charge_date: "2025-02-01T00:00:00.000+00:00",
        note: "",
        patron_status: "active_patron",
        pledge_cadence: 1,
        pledge_relationship_start: "2024-01-01T00:00:00.000+00:00",
        will_pay_amount_cents: 1000,
      },
      id: "member-abc123",
      type: "member",
      relationships: {
        currently_entitled_tiers: {
          data: [
            {
              id: "tier-gold-789",
              type: "tier",
            },
          ],
        },
        user: {
          data: {
            id: "12345678",
            type: "user",
          },
        },
      },
    },
    {
      attributes: {
        amount_cents: 1000,
        created_at: "2024-01-01T00:00:00.000+00:00",
        description:
          "Gold Supporter - All Silver benefits plus exclusive Discord role and priority support",
        discord_role_ids: ["gold-role-123"],
        edited_at: "2024-01-01T00:00:00.000+00:00",
        image_url: null,
        patron_count: 42,
        post_count: null,
        published: true,
        published_at: "2024-01-01T00:00:00.000+00:00",
        remaining: null,
        requires_shipping: false,
        title: "Gold Supporter",
        unpublished_at: null,
        url: "/join/thestoryhub/checkout?rid=tier-gold-789",
        user_limit: null,
      },
      id: "tier-gold-789",
      type: "tier",
    },
  ],
  links: {
    self: "https://www.patreon.com/api/oauth2/v2/identity?include=memberships,memberships.currently_entitled_tiers&fields%5Buser%5D=email,first_name,full_name,image_url,last_name,social_connections,thumb_url,url,vanity&fields%5Bmember%5D=campaign_lifetime_support_cents,currently_entitled_amount_cents,is_follower,last_charge_date,last_charge_status,lifetime_support_cents,next_charge_date,note,patron_status,pledge_cadence,pledge_relationship_start,will_pay_amount_cents&fields%5Btier%5D=amount_cents,created_at,description,discord_role_ids,edited_at,image_url,patron_count,post_count,published,published_at,remaining,requires_shipping,title,unpublished_at,url,user_limit",
  },
};

/**
 * Mock webhook payload for members:update event
 */
export const MOCK_PATREON_WEBHOOK_MEMBER_UPDATE = {
  data: {
    attributes: {
      campaign_lifetime_support_cents: 18000,
      currently_entitled_amount_cents: 2000, // Upgraded to PLATINUM
      patron_status: "active_patron",
      last_charge_status: "Paid",
    },
    id: "member-abc123",
    type: "member",
    relationships: {
      currently_entitled_tiers: {
        data: [
          {
            id: "tier-platinum-012",
            type: "tier",
          },
        ],
      },
      user: {
        data: {
          id: "12345678",
          type: "user",
        },
      },
    },
  },
  included: [
    {
      attributes: {
        amount_cents: 2000,
        title: "Platinum Supporter",
      },
      id: "tier-platinum-012",
      type: "tier",
    },
  ],
};

/**
 * Mock webhook payload for members:delete event (patron canceled)
 */
export const MOCK_PATREON_WEBHOOK_MEMBER_DELETE = {
  data: {
    attributes: {
      patron_status: "former_patron",
      currently_entitled_amount_cents: 0,
    },
    id: "member-abc123",
    type: "member",
    relationships: {
      user: {
        data: {
          id: "12345678",
          type: "user",
        },
      },
    },
  },
};

/**
 * Helper to extract tier from Patreon API response
 */
export function extractPatreonTier(
  patreonResponse: typeof MOCK_PATREON_IDENTITY_RESPONSE,
): string {
  const member = patreonResponse.included?.find(
    (item) => item.type === "member",
  );

  if (!member || member.attributes.patron_status !== "active_patron") {
    return "NONE";
  }

  const entitledTiers =
    member.relationships?.currently_entitled_tiers?.data || [];
  if (entitledTiers.length === 0) {
    return "NONE";
  }

  // Get the highest tier (assumes tiers are sorted by amount)
  const tierId = entitledTiers[entitledTiers.length - 1].id;
  return (
    PATREON_TIER_MAPPING[tierId as keyof typeof PATREON_TIER_MAPPING] || "NONE"
  );
}
