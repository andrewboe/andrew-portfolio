import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force Node.js runtime for all API routes that use crypto/WhatsApp functionality
  experimental: {
    // Ensure crypto operations work properly in serverless environment
    serverComponentsExternalPackages: ['@whiskeysockets/baileys', 'sharp', 'qrcode'],
  },
  // Webpack configuration to handle Node.js modules properly
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      // Handle crypto and other Node.js modules
      config.externals = config.externals || [];
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
        'sharp': 'commonjs sharp',
      });

      // Ensure Node.js crypto module is properly handled
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false, // Use Node.js crypto instead of polyfill
        stream: false,
        buffer: false,
        util: false,
        path: false,
        fs: false,
      };

      // Optimize for serverless
      config.optimization = {
        ...config.optimization,
        minimize: !dev,
      };
    }

    // Handle WebSocket and binary operations
    config.module.rules.push({
      test: /\.node$/,
      use: 'raw-loader',
    });

    return config;
  },
  // Ensure proper handling of serverless functions
  output: 'standalone',
};

export default nextConfig;
