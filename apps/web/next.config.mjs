/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@smart-dj/core"],
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
