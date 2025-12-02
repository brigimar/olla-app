import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: 'E:/BuenosPasos/boilerplate/frontend', // usar ruta absoluta
  },
};

export default nextConfig;
