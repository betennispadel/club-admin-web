'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useClubStore } from '@/stores/clubStore';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Club } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, MapPin, Star, ChevronRight, Building2, Users } from 'lucide-react';

interface ClubWithDetails extends Club {
  memberCount?: number;
  status?: string;
}

export default function SelectClubPage() {
  const t = useTranslations('selectClub');
  const router = useRouter();
  const { selectClub } = useClubStore();

  const [clubs, setClubs] = useState<ClubWithDetails[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<ClubWithDetails[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch clubs from Firebase
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const clubsList: ClubWithDetails[] = [];
        let clubIds: string[] = [];

        // Get club IDs from clubRegistration collection
        try {
          const clubsRef = collection(db, 'clubRegistration');
          const clubsSnapshot = await getDocs(clubsRef);

          if (clubsSnapshot.size > 0) {
            clubIds = clubsSnapshot.docs.map((doc) => doc.id);
          }
        } catch (regError) {
          console.error('Error fetching club registrations:', regError);
        }

        // Fallback club IDs if no registrations found
        if (clubIds.length === 0) {
          clubIds = ['A Club', 'B Club', 'C Club', 'D Club', 'E Club', 'F Club', 'G Club', 'H Club'];
        }

        // Fetch details for each club
        for (const clubId of clubIds) {
          try {
            const clubInfoRef = doc(db, clubId, 'clubInfo');
            const clubInfoDoc = await getDoc(clubInfoRef);

            if (clubInfoDoc.exists()) {
              const clubData = clubInfoDoc.data();

              // Skip hidden clubs
              if (clubData.status === 'hidden') {
                continue;
              }

              // Build location string
              let locationString = '';
              if (clubData.city && clubData.countryName) {
                locationString = `${clubData.city}, ${clubData.countryName}`;
              } else if (clubData.city) {
                locationString = clubData.city;
              } else if (clubData.countryName) {
                locationString = clubData.countryName;
              }

              // Get member count
              let memberCount = 0;
              try {
                const usersRef = collection(db, clubId, 'users', 'users');
                const usersSnapshot = await getDocs(usersRef);
                memberCount = usersSnapshot.size;
              } catch (e) {
                // Silent error
              }

              // Get court count
              let courtCount = 0;
              try {
                const courtsRef = collection(db, clubId, 'courts', 'courts');
                const courtsSnapshot = await getDocs(courtsRef);
                courtCount = courtsSnapshot.size;
              } catch (e) {
                // Silent error
              }

              const club: ClubWithDetails = {
                id: clubId,
                name: clubData.clubName || clubId,
                logo: clubData.clubLogo || null,
                location: locationString || undefined,
                courts: courtCount,
                rating: clubData.rating || 4.0,
                themeColor: clubData.themeColor || '#007BFF',
                memberCount: memberCount,
                status: clubData.status || 'active',
              };

              clubsList.push(club);
            }
          } catch (clubError) {
            console.error(`Error fetching club ${clubId}:`, clubError);
          }
        }

        setClubs(clubsList);
        setFilteredClubs(clubsList);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        toast.error('Failed to load clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  // Filter clubs based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredClubs(clubs);
    } else {
      const filtered = clubs.filter(
        (club) =>
          club.name.toLowerCase().includes(search.toLowerCase()) ||
          club.location?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredClubs(filtered);
    }
  }, [search, clubs]);

  const handleSelectClub = (club: ClubWithDetails) => {
    setSelectedId(club.id);

    // Save club selection
    selectClub(club.id, club);

    // Navigate to login
    setTimeout(() => {
      router.push('/login');
    }, 300);
  };

  return (
    <div className="w-full max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{t('title')}</CardTitle>
            <CardDescription>{t('subtitle')}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Clubs List */}
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredClubs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('noClubs')}
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {filteredClubs.map((club, index) => (
                      <motion.div
                        key={club.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Button
                          variant="outline"
                          className={`w-full h-auto p-4 justify-start gap-4 transition-all ${
                            selectedId === club.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => handleSelectClub(club)}
                          disabled={selectedId !== null}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={club.logo || undefined} />
                            <AvatarFallback
                              style={{ backgroundColor: club.themeColor }}
                              className="text-white font-semibold"
                            >
                              {club.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 text-left">
                            <div className="font-semibold">{club.name}</div>
                            {club.location && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {club.location}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              {club.courts !== undefined && club.courts > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {club.courts} Kort
                                </Badge>
                              )}
                              {club.memberCount !== undefined && club.memberCount > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {club.memberCount} Üye
                                </div>
                              )}
                              {club.rating !== undefined && club.rating > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {club.rating.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </div>

                          {selectedId === club.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
