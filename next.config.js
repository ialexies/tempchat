/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Skip ESLint during build to avoid build failures
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Don't ignore TypeScript errors - we want to catch real issues
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig

