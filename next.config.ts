import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    // Treat .wasm files as async asset resources — don't parse or inline them
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;
