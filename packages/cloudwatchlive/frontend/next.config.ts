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
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["cloudwatchlive"],
  pageExtensions: ["tsx", "mdx"],
  // needed to make the url works on cloudfront
  trailingSlash: true,
};
export default nextConfig;
