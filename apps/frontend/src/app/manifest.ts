import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Papes Confort',
    short_name: 'Papes Confort',
    description: 'Encontrá los mejores electrodomésticos, tecnología, climatización y artículos para el hogar en Papes Confort. Servicio y calidad asegurados en Basavilbaso.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FB3640',
    icons: [
      {
        src: '/icon-48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/icon-96.png',
        sizes: '96x96',
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
