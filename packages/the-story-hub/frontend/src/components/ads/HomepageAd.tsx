"use client";

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { AdSenseAd } from "./AdSenseAd";
import { PatreonHouseAd } from "./PatreonHouseAd";

/**
 * Homepage ad placement
 * Shows between story listings (unobtrusive)
 */
export function HomepageAd() {
  const { settings } = useSiteSettings();

  if (!settings?.adsEnabled || !settings?.showAdsOnHomepage) {
    return null;
  }

  // Show Patreon house ad if no ad slot ID configured
  if (!settings?.homepageAdSlot || !settings?.adsensePublisherId) {
    return <PatreonHouseAd />;
  }

  return (
    <div className="my-8 flex justify-center">
      <AdSenseAd
        adSlot={settings.homepageAdSlot}
        adFormat="auto"
        publisherId={settings.adsensePublisherId}
        className="max-w-[728px] w-full"
      />
    </div>
  );
}
