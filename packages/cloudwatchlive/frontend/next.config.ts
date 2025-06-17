/** @type {import('next').NextConfig} */

const nextConfig = {
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  },
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  compiler: {
    styledComponents: true,
  },
  // Only use "export" for production builds, not during development
  ...(process.env.NODE_ENV === 'production' ? { output: "export" } : {}),
  images: {
    unoptimized: true,
  },
  transpilePackages: ["cloudwatchlive"],
  pageExtensions: ["tsx", "mdx"],
  // needed to make the url works on cloudfront
  trailingSlash: true,
};

// Remove or comment out this debug log in production
// console.log(`next.config.js: NODE_ENV is ${process.env.NODE_ENV}`);

export default nextConfig;
