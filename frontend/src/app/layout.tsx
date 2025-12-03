'use client';

import './globals.css';
import { AuthProvider } from '@/contexts';
import { ConnectProvider } from '@/components/providers';
import BuildInfo from '@/components/BuildInfo';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConnectProvider>
          <AuthProvider>
            {children}
            <BuildInfo />
          </AuthProvider>
        </ConnectProvider>
      </body>
    </html>
  );
}
