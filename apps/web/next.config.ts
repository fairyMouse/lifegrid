import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@lifegrid/types",
    "@lifegrid/domain",
    "@lifegrid/api",
    "@lifegrid/ui",
  ],
};

export default nextConfig;
