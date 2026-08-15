import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Papes Confort',
    short_name: 'Papes Confort',
    description: 'Encuentra los mejores electrodomésticos, climatización y confort para tu hogar en Basavilbaso, Entre Ríos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FB3640',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
