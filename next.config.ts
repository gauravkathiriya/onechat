import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['qvnkmfrzkxbrgbfxzchk.supabase.co'], // Replace with your Supabase URL
  },
};

export default nextConfig;
