'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Filter,
  RefreshCw,
  UserCog,
  GraduationCap,
  Dumbbell,
  Users,
} from 'lucide-react';

import type { Coach, Lesson } from '@/lib/types/private-lessons';
import { deleteCoach } from '@/lib/firebase/private-lessons';
import AddEditCoachDialog from './dialogs/AddEditCoachDialog';

interface CoachesTabProps {
  coaches: Coach[];
  lessons: Lesson[];
  onRefresh: () => void;
}

export default function CoachesTab({
  coaches,
  lessons,
  onRefresh,
}: CoachesTabProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();

  // Local States
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Dialog States
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [coachToDelete, setCoachToDelete] = useState<Coach | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filtered Coaches
  const filteredCoaches = useMemo(() => {
    return coaches.filter((coach) => {
      // Search filter
      const searchMatch =
        !search.trim() ||
        coach.name.toLowerCase().includes(search.toLowerCase()) ||
        coach.email?.toLowerCase().includes(search.toLowerCase()) ||
        coach.phone?.includes(search);

      // Role filter
      const roleMatch =
        roleFilter === 'all' ||
        (roleFilter === 'tennis' && coach.role === 'coach') ||
        (roleFilter === 'conditioning' && coach.role === 'conditioning');

      return searchMatch && roleMatch;
    });
  }, [coaches, search, roleFilter]);

  // Handlers
  const handleAddCoach = () => {
    setSelectedCoach(null);
    setAddEditDialogOpen(true);
  };

  const handleEditCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    setAddEditDialogOpen(true);
  };

  const handleDeleteClick = (coach: Coach) => {
    setCoachToDelete(coach);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!coachToDelete || !selectedClub) return;

    setDeleting(true);
    try {
      await deleteCoach(selectedClub.id, coachToDelete.id, coachToDelete.isManual);
      toast.success(t('messages.coachDeleted'));
      setDeleteDialogOpen(false);
      setCoachToDelete(null);
    } catch (error) {
      console.error('Error deleting coach:', error);
      toast.error(t('errors.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'coach':
        return (
          <Badge className="bg-blue-500 gap-1">
            <GraduationCap className="h-3 w-3" />
            {t('coachRoles.tennis')}
          </Badge>
        );
      case 'conditioning':
        return (
          <Badge className="bg-orange-500 gap-1">
            <Dumbbell className="h-3 w-3" />
            {t('coachRoles.conditioning')}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{role || '-'}</Badge>;
    }
  };

  const getCoachLessons = (coachId: string) => {
    return lessons.filter((lesson) => lesson.coachId === coachId);
  };

  const getCoachStudentCount = (coachId: string) => {
    const coachLessons = getCoachLessons(coachId);
    const studentIds = new Set<string>();
    coachLessons.forEach((lesson) => {
      lesson.students.forEach((s) => studentIds.add(s.studentId));
    });
    return studentIds.size;
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 flex-wrap">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search.coaches')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('filters.role')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="tennis">{t('coachRoles.tennis')}</SelectItem>
              <SelectItem value="conditioning">{t('coachRoles.conditioning')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleAddCoach}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.addCoach')}
          </Button>
        </div>
      </div>

      {/* Coaches Grid */}
      {filteredCoaches.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('empty.coaches')}</p>
            <Button variant="outline" className="mt-4" onClick={handleAddCoach}>
              <Plus className="mr-2 h-4 w-4" />
              {t('actions.addFirstCoach')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCoaches.map((coach, index) => {
            const coachLessons = getCoachLessons(coach.id);
            const studentCount = getCoachStudentCount(coach.id);

            return (
              <motion.div
                key={coach.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCog className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg line-clamp-1">
                            {coach.name}
                          </CardTitle>
                          {getRoleBadge(coach.role)}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCoach(coach)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('actions.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClick(coach)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Contact Info */}
                    {coach.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">
                          {coach.email}
                        </span>
                      </div>
                    )}
                    {coach.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{coach.phone}</span>
                      </div>
                    )}

                    {/* Specialization */}
                    {coach.specialization && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">{t('labels.specialization')}: </span>
                        <span className="font-medium">{coach.specialization}</span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{coachLessons.length}</span>
                        <span className="text-muted-foreground">{t('labels.lessons')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{studentCount}</span>
                        <span className="text-muted-foreground">{t('labels.students')}</span>
                      </div>
                    </div>

                    {/* Manual Badge */}
                    {coach.isManual && (
                      <Badge variant="outline" className="text-xs">
                        {t('labels.manualEntry')}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AddEditCoachDialog
        open={addEditDialogOpen}
        onOpenChange={setAddEditDialogOpen}
        coach={selectedCoach}
        onSuccess={() => {
          setAddEditDialogOpen(false);
          setSelectedCoach(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deleteCoach.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.deleteCoach.description', { name: coachToDelete?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t('actions.deleting') : t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
