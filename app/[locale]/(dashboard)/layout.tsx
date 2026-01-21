'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/stores/authStore';
import { useClubStore } from '@/stores/clubStore';
import { useLocaleStore } from '@/stores/localeStore';
import { Header, TabBar } from '@/components/layout';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const { selectedClub } = useClubStore();
  const { subscribeToLocaleConfig, unsubscribeFromLocaleConfig } = useLocaleStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for hydration (localStorage to be read)
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Subscribe to locale config when club changes
  useEffect(() => {
    if (selectedClub) {
      subscribeToLocaleConfig(selectedClub.id);
    }
    return () => {
      unsubscribeFromLocaleConfig();
    };
  }, [selectedClub, subscribeToLocaleConfig, unsubscribeFromLocaleConfig]);

  useEffect(() => {
    if (!isHydrated) return;

    // If no club selected, redirect to club selection
    if (!selectedClub) {
      router.push('/select-club');
      return;
    }

    // If no user, redirect to login
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, selectedClub, isHydrated, router]);

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if no user or no club (will redirect)
  if (!currentUser || !selectedClub) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TabBar />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
