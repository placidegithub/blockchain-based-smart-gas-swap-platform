import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/components/providers/web3-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GasSwap - Blockchain Cylinder Exchange',
  description:
    'Secure, transparent, and fast gas cylinder exchange platform powered by blockchain technology',
  keywords: ['gas', 'cylinder', 'exchange', 'blockchain', 'swap', 'web3'],
  authors: [{ name: 'GasSwap Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
