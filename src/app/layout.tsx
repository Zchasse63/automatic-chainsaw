import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hyrox AI Coach',
  description: 'Your AI-powered Hyrox training coach — personalized, science-backed, adaptive.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
