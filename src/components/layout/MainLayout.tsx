import { ReactNode } from 'react';
import BottomNav from '../navigation/BottomNav';
import { PWAInstallPrompt } from '../pwa';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <div className="pb-20">{children}</div>
      <PWAInstallPrompt bottomOffset={80} />
      <BottomNav />
    </>
  );
}
