'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import {
  getClubCollection,
  getDocs,
  query,
  orderBy,
} from '@/lib/firebase/firestore';
import { Court } from '@/lib/types';
import { motion } from 'framer-motion';
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  MapPin,
  Sun,
  Lightbulb,
  DollarSign,
  Loader2,
} from 'lucide-react';

export default function CourtsPage() {
  const t = useTranslations('courts');
  const { selectedClub } = useClubStore();
  const { hasPermission } = useAuthStore();

  const [courts, setCourts] = useState<Court[]>([]);
  const [filteredCourts, setFilteredCourts] = useState<Court[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Check permission
  const canManageCourts = hasPermission('courtManagements');

  // Fetch courts
  useEffect(() => {
    const fetchCourts = async () => {
      if (!selectedClub) return;

      try {
        const courtsRef = getClubCollection(selectedClub.id, 'courts');
        const courtsQuery = query(courtsRef, orderBy('name'));
        const snapshot = await getDocs(courtsQuery);

        const courtsData: Court[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Court[];

        // If no courts, add demo data
        if (courtsData.length === 0) {
          courtsData.push(
            {
              id: '1',
              name: 'Court 1',
              type: 'Tennis',
              surface: 'hard',
              indoor: false,
              lights: true,
              status: 'active',
              hourlyRate: 50,
            },
            {
              id: '2',
              name: 'Court 2',
              type: 'Tennis',
              surface: 'clay',
              indoor: false,
              lights: true,
              status: 'active',
              hourlyRate: 60,
            },
            {
              id: '3',
              name: 'Court 3',
              type: 'Tennis',
              surface: 'grass',
              indoor: true,
              lights: true,
              status: 'maintenance',
              hourlyRate: 70,
            }
          );
        }

        setCourts(courtsData);
        setFilteredCourts(courtsData);
      } catch (error) {
        console.error('Error fetching courts:', error);
        toast.error('Failed to load courts');
      } finally {
        setLoading(false);
      }
    };

    fetchCourts();
  }, [selectedClub]);

  // Filter courts based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredCourts(courts);
    } else {
      const filtered = courts.filter(
        (court) =>
          court.name?.toLowerCase().includes(search.toLowerCase()) ||
          court.type?.toLowerCase().includes(search.toLowerCase()) ||
          court.surface?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredCourts(filtered);
    }
  }, [search, courts]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">{t('status.active')}</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-500">{t('status.maintenance')}</Badge>;
      case 'inactive':
        return <Badge variant="destructive">{t('status.inactive')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSurfaceLabel = (surface?: string) => {
    if (!surface) return '-';
    const key = `surfaces.${surface}` as any;
    return t(key) || surface;
  };

  if (!canManageCourts) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">
            You don't have permission to view this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your club courts
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('addCourt')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Courts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCourts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No courts found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourts.map((court, index) => (
            <motion.div
              key={court.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Court Image */}
                <div className="h-40 bg-gradient-to-br from-green-400 to-green-600 relative">
                  {court.image ? (
                    <img
                      src={court.image}
                      alt={court.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <MapPin className="h-16 w-16 text-white/30" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    {getStatusBadge(court.status)}
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-3 right-3 h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t('editCourt')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    {court.name}
                    <span className="text-sm font-normal text-muted-foreground">
                      {court.type}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Surface */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Surface</span>
                      <span className="font-medium capitalize">
                        {getSurfaceLabel(court.surface)}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-2">
                      {court.indoor && (
                        <Badge variant="outline" className="gap-1">
                          <Sun className="h-3 w-3" />
                          Indoor
                        </Badge>
                      )}
                      {court.lights && (
                        <Badge variant="outline" className="gap-1">
                          <Lightbulb className="h-3 w-3" />
                          Lights
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    {court.hourlyRate && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-muted-foreground text-sm">
                          Hourly Rate
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-green-600">
                          <DollarSign className="h-4 w-4" />
                          {court.hourlyRate}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
