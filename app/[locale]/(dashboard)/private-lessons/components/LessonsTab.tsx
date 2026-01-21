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
  CardDescription,
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
  Users,
  Clock,
  MapPin,
  User,
  Calendar,
  Filter,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import type { Lesson, Coach, StudentOption, LessonType } from '@/lib/types/private-lessons';
import { LESSON_TYPES, LESSON_LEVELS } from '@/lib/types/private-lessons';
import { deleteLesson } from '@/lib/firebase/private-lessons';
import AddEditLessonDialog from './dialogs/AddEditLessonDialog';

interface LessonsTabProps {
  lessons: Lesson[];
  students: StudentOption[];
  coaches: Coach[];
  onRefresh: () => void;
}

export default function LessonsTab({
  lessons,
  students,
  coaches,
  onRefresh,
}: LessonsTabProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();

  // Local States
  const [search, setSearch] = useState('');
  const [lessonTypeFilter, setLessonTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog States
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filtered Lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      // Search filter
      const searchMatch =
        !search.trim() ||
        lesson.groupName.toLowerCase().includes(search.toLowerCase()) ||
        lesson.coachName.toLowerCase().includes(search.toLowerCase()) ||
        lesson.students.some((s) =>
          s.studentName.toLowerCase().includes(search.toLowerCase())
        );

      // Lesson type filter
      const typeMatch =
        lessonTypeFilter === 'all' || lesson.lessonType === lessonTypeFilter;

      // Status filter
      const statusMatch =
        statusFilter === 'all' || lesson.status === statusFilter;

      return searchMatch && typeMatch && statusMatch;
    });
  }, [lessons, search, lessonTypeFilter, statusFilter]);

  // Handlers
  const handleAddLesson = () => {
    setSelectedLesson(null);
    setAddEditDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setAddEditDialogOpen(true);
  };

  const handleDeleteClick = (lesson: Lesson) => {
    setLessonToDelete(lesson);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!lessonToDelete || !selectedClub) return;

    setDeleting(true);
    try {
      await deleteLesson(selectedClub.id, lessonToDelete.id);
      toast.success(t('messages.lessonDeleted'));
      setDeleteDialogOpen(false);
      setLessonToDelete(null);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error(t('errors.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const getLessonTypeBadge = (type: LessonType) => {
    switch (type) {
      case 'Bireysel':
        return <Badge className="bg-blue-500">{t('lessonTypes.individual')}</Badge>;
      case 'Grup':
        return <Badge className="bg-green-500">{t('lessonTypes.group')}</Badge>;
      case 'Kondisyon':
        return <Badge className="bg-orange-500">{t('lessonTypes.conditioning')}</Badge>;
      default:
        return <Badge variant="secondary">{type || '-'}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Planlandı':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">{t('status.planned')}</Badge>;
      case 'Devam Ediyor':
        return <Badge className="bg-green-500">{t('status.ongoing')}</Badge>;
      case 'Tamamlandı':
        return <Badge variant="secondary">{t('status.completed')}</Badge>;
      case 'İptal Edildi':
        return <Badge variant="destructive">{t('status.cancelled')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPackageProgress = (lesson: Lesson) => {
    const totalStudents = lesson.students.length;
    if (totalStudents === 0) return { finished: 0, total: 0, allFinished: false };

    const finishedCount = lesson.students.filter(
      (s) => s.attendedCount >= lesson.packageSize
    ).length;

    return {
      finished: finishedCount,
      total: totalStudents,
      allFinished: finishedCount === totalStudents,
    };
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
              placeholder={t('search.lessons')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <Select value={lessonTypeFilter} onValueChange={setLessonTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('filters.lessonType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="Bireysel">{t('lessonTypes.individual')}</SelectItem>
              <SelectItem value="Grup">{t('lessonTypes.group')}</SelectItem>
              <SelectItem value="Kondisyon">{t('lessonTypes.conditioning')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="Planlandı">{t('status.planned')}</SelectItem>
              <SelectItem value="Devam Ediyor">{t('status.ongoing')}</SelectItem>
              <SelectItem value="Tamamlandı">{t('status.completed')}</SelectItem>
              <SelectItem value="İptal Edildi">{t('status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleAddLesson}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.addLesson')}
          </Button>
        </div>
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('empty.lessons')}</p>
            <Button variant="outline" className="mt-4" onClick={handleAddLesson}>
              <Plus className="mr-2 h-4 w-4" />
              {t('actions.addFirstLesson')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson, index) => {
            const progress = getPackageProgress(lesson);

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {lesson.groupName}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getLessonTypeBadge(lesson.lessonType)}
                          {getStatusBadge(lesson.status)}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditLesson(lesson)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('actions.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClick(lesson)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Coach */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('labels.coach')}:</span>
                      <span className="font-medium">{lesson.coachName}</span>
                    </div>

                    {/* Students */}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('labels.students')}:</span>
                      <span className="font-medium">{lesson.students.length}</span>
                      {progress.finished > 0 && (
                        <Badge
                          variant={progress.allFinished ? 'destructive' : 'outline'}
                          className="ml-auto text-xs"
                        >
                          {progress.finished}/{progress.total} {t('labels.finished')}
                        </Badge>
                      )}
                    </div>

                    {/* Package */}
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('labels.package')}:</span>
                      <span className="font-medium">{lesson.packageSize} {t('labels.lessons')}</span>
                    </div>

                    {/* Schedule */}
                    {lesson.trainingSchedule && lesson.trainingSchedule.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('labels.schedule')}:</span>
                        <span className="font-medium text-xs">
                          {lesson.trainingSchedule.map((s) => s.day).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Time & Location */}
                    {lesson.trainingSchedule?.[0] && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">
                            {lesson.trainingSchedule[0].startTime} - {lesson.trainingSchedule[0].endTime}
                          </span>
                        </div>
                        {lesson.trainingSchedule[0].location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{lesson.trainingSchedule[0].location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Level */}
                    {lesson.level && lesson.level !== 'Belirtilmedi' && (
                      <div className="text-xs text-muted-foreground">
                        {t('labels.level')}: {lesson.level}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AddEditLessonDialog
        open={addEditDialogOpen}
        onOpenChange={setAddEditDialogOpen}
        lesson={selectedLesson}
        students={students}
        coaches={coaches}
        onSuccess={() => {
          setAddEditDialogOpen(false);
          setSelectedLesson(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deleteLesson.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.deleteLesson.description', { name: lessonToDelete?.groupName || '' })}
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
