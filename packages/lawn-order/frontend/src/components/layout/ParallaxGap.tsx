"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  image: string; // path to image (e.g., "/images/hero2_backyard_weeding_1872x800.jpg")
  minHeight?: string; // viewport height (e.g., "100vh", "80vh")
  overlay?: string; // optional gradient overlay (e.g., "linear-gradient(0deg, rgba(0,0,0,0.35) 85%, rgb(0,0,0) 100%)")
  className?: string;
  children?: React.ReactNode;
};

/**
 * ParallaxGap - A gap section with a fixed background image that creates a parallax effect.
 * The background stays fixed while content scrolls over it.
 * Based on CSS background-attachment: fixed pattern from Kadence Blocks.
 */
export default function ParallaxGap({
  image,
  minHeight = "100vh",
  overlay,
  className = "",
  children,
}: Props) {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!bgRef.current) return;

      const rect = bgRef.current.getBoundingClientRect();
      // Calculate a very subtle offset based on viewport position
      const offset = rect.top * 0.03; // Only 3% movement
      bgRef.current.style.backgroundPosition = `center calc(50% + ${offset}px)`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        minHeight,
      }}
    >
      {/* Fixed background image with subtle parallax */}
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: `url(${image})`,
        }}
      />

      {/* Optional overlay gradient */}
      {overlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: overlay,
          }}
        />
      )}

      {/* Content (if any) */}
      {children && (
        <div className="relative z-10 flex items-start justify-center min-h-full">
          {children}
        </div>
      )}
    </section>
  );
}
