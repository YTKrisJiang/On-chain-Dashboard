/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'imagedelivery.net',
      'twimg.com',
      'imgur.com',
      'postimg.cc',
      'i.imgur.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.imagedelivery.net',
      },
      {
        protocol: 'https',
        hostname: '**.twimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'postimg.cc',
      }
    ]
  }
};

export default nextConfig;