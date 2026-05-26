import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/apps/omesham',
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8006/api/:path*',
      },
    ]
  }
};

export default nextConfig;
