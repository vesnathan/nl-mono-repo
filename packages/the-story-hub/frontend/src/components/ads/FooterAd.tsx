"use client";

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { AdSenseAd } from "./AdSenseAd";
import { PatreonHouseAd } from "./PatreonHouseAd";

/**
 * Footer ad placement
 * Shows at bottom of pages (unobtrusive)
 */
export function FooterAd() {
  const { settings } = useSiteSettings();

  if (!settings?.adsEnabled || !settings?.showAdsInFooter) {
    return null;
  }

  // Show Patreon house ad if no ad slot ID configured
  if (!settings?.footerAdSlot || !settings?.adsensePublisherId) {
    return <PatreonHouseAd />;
  }

  return (
    <div className="mt-12 mb-8 flex justify-center border-t border-gray-700 pt-8">
      <AdSenseAd
        adSlot={settings.footerAdSlot}
        adFormat="auto"
        publisherId={settings.adsensePublisherId}
        className="max-w-[728px] w-full"
      />
    </div>
  );
}
