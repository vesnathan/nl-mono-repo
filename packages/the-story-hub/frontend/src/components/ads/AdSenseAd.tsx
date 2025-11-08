"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";
import { PatreonTier } from "@/types/gqlTypes";

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  adLayout?: string;
  adStyle?: React.CSSProperties;
  className?: string;
  publisherId?: string;
}

/**
 * Google AdSense ad component
 *
 * Features:
 * - Automatically hides ads for Bronze+ Patreon supporters
 * - Loads AdSense script dynamically
 * - Responsive ad sizing
 * - Unobtrusive placements
 *
 * Usage:
 * <AdSenseAd
 *   adSlot="1234567890"
 *   adFormat="auto"
 *   publisherId="ca-pub-XXXXXXXXXXXXXX"
 * />
 */
export function AdSenseAd({
  adSlot,
  adFormat = "auto",
  adLayout,
  adStyle = { display: "block" },
  className = "",
  publisherId,
}: AdSenseAdProps) {
  const { isLoading } = useAuth();
  const user = useUserStore((state) => state.user);
  const adRef = useRef<HTMLDivElement>(null);
  const adPushedRef = useRef(false);

  // Check if user is Bronze+ Patreon supporter (ad-free)
  const isPatreonSupporter = user?.patreonSupporter ?? false;
  const patreonTier = user?.patreonInfo?.tier ?? PatreonTier.NONE;
  const hasAdFreeAccess =
    isPatreonSupporter && patreonTier !== PatreonTier.NONE;

  useEffect(() => {
    // Don't show ads for Patreon supporters
    if (hasAdFreeAccess || isLoading) {
      return;
    }

    // Don't show ads if no publisher ID
    if (!publisherId) {
      console.warn("AdSense Publisher ID not configured");
      return;
    }

    // Load AdSense script if not already loaded
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      const script = document.createElement("script");
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    // Push ad to AdSense queue
    if (adRef.current && !adPushedRef.current) {
      try {
        // Wait for adsbygoogle to be available
        const checkAdsbygoogle = setInterval(() => {
          if (window.adsbygoogle) {
            clearInterval(checkAdsbygoogle);
            window.adsbygoogle.push({});
            adPushedRef.current = true;
          }
        }, 100);

        // Cleanup after 5 seconds if adsbygoogle not loaded
        setTimeout(() => clearInterval(checkAdsbygoogle), 5000);
      } catch (error) {
        console.error("AdSense error:", error);
      }
    }
  }, [hasAdFreeAccess, isLoading, publisherId]);

  // Don't render anything for Patreon supporters
  if (hasAdFreeAccess || isLoading || !publisherId) {
    return null;
  }

  return (
    <div ref={adRef} className={`adsense-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={adStyle}
        data-ad-client={publisherId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-ad-layout={adLayout}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Declare adsbygoogle for TypeScript
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adsbygoogle: any[];
  }
}
