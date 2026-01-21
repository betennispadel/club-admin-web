'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import { fetchClubInfo } from '@/lib/firebase/firestore';
import { Club } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronsUpDown, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ClubSwitcher() {
  const t = useTranslations('selectClub');
  const router = useRouter();
  const {
    selectedClub,
    loggedInClubs,
    selectClub,
    hasMultipleLoggedInClubs,
  } = useClubStore();
  const { reset: resetAuth } = useAuthStore();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);

  // Load club details for all logged in clubs
  useEffect(() => {
    const loadClubs = async () => {
      if (loggedInClubs.length === 0) return;

      setLoading(true);
      const clubDetails: Club[] = [];

      for (const clubId of loggedInClubs) {
        try {
          const info = await fetchClubInfo(clubId);
          if (info) {
            clubDetails.push({
              id: clubId,
              name: info.clubName || clubId,
              logo: info.clubLogo || null,
              location: info.location,
              themeColor: info.themeColor || '#007BFF',
            });
          } else {
            clubDetails.push({
              id: clubId,
              name: clubId,
              logo: null,
            });
          }
        } catch (error) {
          clubDetails.push({
            id: clubId,
            name: clubId,
            logo: null,
          });
        }
      }

      setClubs(clubDetails);
      setLoading(false);
    };

    loadClubs();
  }, [loggedInClubs]);

  const handleClubSwitch = async (club: Club) => {
    if (club.id === selectedClub?.id) return;

    // Reset auth state for new club
    resetAuth();

    // Select new club
    selectClub(club.id, club);

    // Redirect to login for new club (unless we have a saved session)
    router.push('/login');
  };

  const handleAddClub = () => {
    router.push('/select-club');
  };

  // Don't render if only one club
  if (!hasMultipleLoggedInClubs() && loggedInClubs.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 border-dashed"
        >
          <ChevronsUpDown className="h-4 w-4" />
          <span className="hidden sm:inline-block">{t('switchClub')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{t('title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {clubs.map((club) => (
          <DropdownMenuItem
            key={club.id}
            onClick={() => handleClubSwitch(club)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={club.logo || undefined} alt={club.name} />
                <AvatarFallback
                  style={{ backgroundColor: club.themeColor }}
                  className="text-white text-xs"
                >
                  {club.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{club.name}</p>
                {club.location && (
                  <p className="text-xs text-muted-foreground truncate">
                    {club.location}
                  </p>
                )}
              </div>
              {selectedClub?.id === club.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleAddClub} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Add Club
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
