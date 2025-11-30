'use client';

import './globals.css';
import BuildInfo from '@/components/BuildInfo';

/**
 * Marketing site layout - minimal, no Redux/Connect providers needed
 * This layout is copied over layout.tsx in Dockerfile.marketing
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <BuildInfo />
      </body>
    </html>
  );
}
