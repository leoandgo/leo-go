import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qdktllvmegsdulrebfaf.supabase.co',
      },
    ],
  },
};

export default nextConfig;
