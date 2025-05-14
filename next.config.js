/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['bunkerhouse.com.ar', 'firebasestorage.googleapis.com'],
  },
};

module.exports = nextConfig; 