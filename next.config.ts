import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FullCalendar (plugin interaction) casse le glisser-déposer sous le
  // double-montage de React StrictMode en dev : les events s'affichent et le
  // clic marche, mais le drag ne se ré-attache pas au remontage. StrictMode ne
  // double-monte qu'en dev — désactiver n'a aucun impact en production.
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.attijariwafabank.com' },
      { protocol: 'https', hostname: '**.gbp.ma' },
      { protocol: 'https', hostname: '**.cihbank.ma' },
      { protocol: 'https', hostname: '**.bankofafrica.ma' },
      { protocol: 'https', hostname: '**.societegenerale.ma' },
      { protocol: 'https', hostname: '**.creditagricole.ma' },
      { protocol: 'https', hostname: '**.creditdumaroc.ma' },
      { protocol: 'https', hostname: '**.cfgbank.com' },
      { protocol: 'https', hostname: '**.albaridbank.ma' },
    ],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type',           value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control',           value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed',  value: '/' },
        ],
      },
    ]
  },
}

export default nextConfig;
