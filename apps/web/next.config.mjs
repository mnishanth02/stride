/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@workspace/ui",
    "@workspace/database",
    "@workspace/storage",
  ],
}

export default nextConfig
