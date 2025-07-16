import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force Node.js runtime for WhatsApp functionality
  experimental: {
    // Ensure crypto operations work properly in serverless environment
    serverComponentsExternalPackages: ['@whiskeysockets/baileys'],
  },
  // Webpack configuration to handle Baileys specifically
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      // Handle optional dependencies for Baileys
      config.externals = config.externals || [];
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }

    return config;
  },
};

export default nextConfig;
