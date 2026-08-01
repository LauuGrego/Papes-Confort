/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@papes-confort/shared'],
  reactStrictMode: true,
  eslint: {
    // Ignora ESLint durante el proceso de build de producción
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
