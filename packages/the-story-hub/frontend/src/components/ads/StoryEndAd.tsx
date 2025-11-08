"use client";

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { AdSenseAd } from "./AdSenseAd";
import { PatreonHouseAd } from "./PatreonHouseAd";

/**
 * Story end ad placement
 * Shows after completing a chapter, before branch selection
 */
export function StoryEndAd() {
  const { settings } = useSiteSettings();

  if (!settings?.adsEnabled || !settings?.showAdsOnStoryEnd) {
    return null;
  }

  // Show Patreon house ad if no ad slot ID configured
  if (!settings?.storyEndAdSlot || !settings?.adsensePublisherId) {
    return <PatreonHouseAd />;
  }

  return (
    <div className="my-8 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
      <div className="flex justify-center">
        <AdSenseAd
          adSlot={settings.storyEndAdSlot}
          adFormat="auto"
          publisherId={settings.adsensePublisherId}
          className="max-w-[728px] w-full"
        />
      </div>
    </div>
  );
}
