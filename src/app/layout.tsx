import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Polacheck\'s Jewelers | Internal Sales System',
  description: 'Phase 1 internal sales allocation system starter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
