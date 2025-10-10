"use client";

import NextImage from "next/image";
import React from "react";
// Static import for logo image
// Use public image path to avoid Next's sharp native dependency
const LogoImg = "/images/logo.png";

interface LogoProps {
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  width = 150,
  height = 80,
  alt = "logo",
  className,
}) => {
  return (
    <NextImage
      src={LogoImg}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
};

export default Logo;
