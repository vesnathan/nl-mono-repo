import { useState, useEffect } from "react";
import { getSiteSettingsAPI } from "@/lib/api/settings";
import type { SiteSettings } from "@/types/SettingsSchemas";

/**
 * Hook to fetch and cache site settings
 * Used for checking ad configuration, OAuth providers, etc.
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await getSiteSettingsAPI();
        setSettings(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load site settings:", err);
        setError("Failed to load site settings");
        // Set defaults if loading fails
        setSettings({
          grantOGBadgeToPatreonSupporters: false,
          googleOAuthEnabled: true,
          facebookOAuthEnabled: false,
          appleOAuthEnabled: false,
          adsEnabled: false,
          adsensePublisherId: null,
          adsenseVerificationCode: null,
          showAdsOnHomepage: false,
          showAdsOnStoryEnd: false,
          showAdsInFooter: false,
          homepageAdSlot: null,
          storyEndAdSlot: null,
          footerAdSlot: null,
          sentryDsn: null,
          sentryEnabled: false,
          updatedAt: new Date().toISOString(),
          updatedBy: null,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { settings, isLoading, error };
}
