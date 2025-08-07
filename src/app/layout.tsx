import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';

export const metadata: Metadata = {
  title: 'Clearpoint AV Management | Technology + Design',
  description: 'AV Management Platform for Clearpoint Technology + Design',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased min-h-screen">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}