/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Node.js runtime for WhatsApp functionality
  serverExternalPackages: ['@whiskeysockets/baileys'],
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

    // Alias keyv adapters to empty modules to prevent dynamic require errors
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@keyv/redis': false,
      '@keyv/mongo': false,
      '@keyv/sqlite': false,
      '@keyv/postgres': false,
      '@keyv/mysql': false,
      '@keyv/etcd': false,
      '@keyv/offline': false,
      '@keyv/tiered': false,
    };

    return config;
  },
};

module.exports = nextConfig; 