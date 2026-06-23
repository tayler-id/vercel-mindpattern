import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/research/agentic-evals",
        destination: "/research/agentic-evals/index.html",
      },
    ];
  },
};

export default nextConfig;
