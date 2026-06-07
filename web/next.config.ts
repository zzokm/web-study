import type { NextConfig } from "next";
import path from "path";

const pdfjsV4Root = path.join(__dirname, "node_modules/pdfjs-dist");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    resolveAlias: {
      canvas: "./src/lib/empty-module.ts",
    },
  },
  webpack: (config, { webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      // Ensure react-pdf always resolves the hoisted v4 pdfjs-dist (avoids dev ENOENT lookups)
      "pdfjs-dist": pdfjsV4Root,
    };
    return config;
  },
};

export default nextConfig;
