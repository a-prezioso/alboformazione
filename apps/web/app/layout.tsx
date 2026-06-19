import type { Metadata } from 'next';
import '@esh/tokens/css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Albo Formazione',
  description:
    'Piattaforma formativa digitale per Associazioni Professionali — eventi Live, contenuti in differita, crediti formativi, attestati ed e-commerce.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" data-brand="business" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
