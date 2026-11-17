import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  agentRules: false,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
