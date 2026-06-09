import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Photos are submitted through a Server Action. Raise the default 1 MB body
    // cap so uploads work even before client-side downscaling kicks in.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
