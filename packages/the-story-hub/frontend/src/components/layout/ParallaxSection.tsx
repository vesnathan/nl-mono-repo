"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  background?: string; // background color or gradient
  minHeight?: string;
};

/**
 * ParallaxSection - A content section with a solid background that scrolls normally.
 * This sits between ParallaxGap sections to create the "content area" effect.
 */
export default function ParallaxSection({
  children,
  className = "",
  background = "#000000",
  minHeight = "auto",
}: Props) {
  return (
    <section
      className={`relative w-full ${className}`}
      style={{
        background,
        minHeight,
      }}
    >
      <div className="relative z-10">{children}</div>
    </section>
  );
}
