/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Skip ESLint during build to avoid build failures
  // Linting should be done separately in CI/CD
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TypeScript type checking during build for faster builds
  // Type checking should be done separately
  typescript: {
    ignoreBuildErrors: false, // Keep this false to catch real TS errors
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig

