import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './globals.css';

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Papes Confort | Servicio y Calidad de Siempre',
  description: 'Encuentra los mejores electrodomésticos, climatización y confort para tu hogar en Basavilbaso, Entre Ríos.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${openSans.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-white text-brand-black antialiased">
        <Header />
        <main className="grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
