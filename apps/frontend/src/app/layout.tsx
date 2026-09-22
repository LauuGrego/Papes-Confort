import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GoogleAuthProvider from '../components/GoogleAuthProvider';
import './globals.css';

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const SITE_URL = 'https://www.papesconfort.com.ar';

const SITE_DESCRIPTION = 'Todo para equipar tu hogar. Electrodomésticos, climatización y confort para todos los días con la calidez y el respaldo de siempre en Basavilbaso, Entre Ríos.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Papes Confort — Confort para todos los días | Electrodomésticos y Hogar',
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-48.png', type: 'image/png', sizes: '48x48' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Papes Confort — Confort para todos los días',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'Papes Confort',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Papes Confort Logo',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      'name': 'Papes Confort',
      'url': SITE_URL,
      'logo': {
        '@type': 'ImageObject',
        'url': `${SITE_URL}/icon-512.png`,
        'width': 512,
        'height': 512,
      },
      'image': `${SITE_URL}/icon-512.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      'url': SITE_URL,
      'name': 'Papes Confort',
      'publisher': {
        '@id': `${SITE_URL}/#organization`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${openSans.variable} overflow-x-hidden`} suppressHydrationWarning>
      <head>
        <meta name="description" content={SITE_DESCRIPTION} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-48.png" type="image/png" sizes="48x48" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex flex-col min-h-screen bg-white text-brand-black antialiased overflow-x-hidden">
        <GoogleAuthProvider>
          <Header />
          <main className="grow">
            {children}
          </main>
          <Footer />
        </GoogleAuthProvider>
      </body>
    </html>
  );
}

