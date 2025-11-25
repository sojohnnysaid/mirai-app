'use client';

import './globals.css';
import { Provider } from 'react-redux';
import { store } from '@/store';
import BuildInfo from '@/components/BuildInfo';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          {children}
          <BuildInfo />
        </Provider>
      </body>
    </html>
  );
}
