import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'KinéPro — Gestion Cabinet',
    short_name:       'KinéPro',
    description:      'La plateforme de gestion pour kinésithérapeutes marocains',
    start_url:        '/dashboard',
    display:          'standalone',
    background_color: '#1E3A5F',
    theme_color:      '#2563EB',
    orientation:      'portrait',
    categories:       ['medical', 'productivity', 'business'],
    lang:             'fr',
    icons: [
      { src: '/icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
      { src: '/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
      { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name:       'Agenda',
        short_name: 'Agenda',
        url:        '/agenda',
        icons:      [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name:       'Patients',
        short_name: 'Patients',
        url:        '/patients',
        icons:      [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name:       'Séances',
        short_name: 'Séances',
        url:        '/seances',
        icons:      [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
    ],
  }
}
