'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  User,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Dumbbell,
  GraduationCap,
} from 'lucide-react';

import type { Lesson, StudentOption, DailyLesson, AttendanceRecord } from '@/lib/types/private-lessons';
import { fetchAttendanceRecords, saveAttendance } from '@/lib/firebase/private-lessons';
import AttendanceDialog from './dialogs/AttendanceDialog';

interface AttendanceTabProps {
  lessons: Lesson[];
  students: StudentOption[];
  onRefresh: () => void;
}

export default function AttendanceTab({
  lessons,
  students,
  onRefresh,
}: AttendanceTabProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();

  // Date States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Dialog States
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<DailyLesson | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Get day of week from date (1 = Monday, 7 = Sunday)
  const getDayOfWeek = (date: Date): string => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[date.getDay()];
  };

  // Build daily lessons based on schedules
  const dailyLessons = useMemo(() => {
    const dayOfWeek = getDayOfWeek(selectedDate);
    const enhancedLessons: DailyLesson[] = [];

    lessons.forEach((lesson) => {
      // Check training schedule
      if (lesson.trainingSchedule && lesson.trainingSchedule.length > 0) {
        const daySchedule = lesson.trainingSchedule.find(
          (s) => s.day === dayOfWeek
        );
        if (daySchedule) {
          enhancedLessons.push({
            ...lesson,
            dailyStartTime: daySchedule.startTime || '00:00',
            dailyEndTime: daySchedule.endTime || '00:00',
            dailyLocation: daySchedule.location,
            scheduleType: 'training',
          });
        }
      }

      // Check conditioning schedule
      if (lesson.conditioningSchedule && lesson.conditioningSchedule.length > 0) {
        const daySchedule = lesson.conditioningSchedule.find(
          (s) => s.day === dayOfWeek
        );
        if (daySchedule) {
          enhancedLessons.push({
            ...lesson,
            dailyStartTime: daySchedule.startTime || '00:00',
            dailyEndTime: daySchedule.endTime || '00:00',
            dailyLocation: daySchedule.location,
            scheduleType: 'conditioning',
          });
        }
      }
    });

    // Sort by start time
    return enhancedLessons.sort((a, b) =>
      a.dailyStartTime.localeCompare(b.dailyStartTime)
    );
  }, [lessons, selectedDate]);

  // Navigation handlers
  const goToPreviousDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Handle lesson click
  const handleLessonClick = useCallback(async (lesson: DailyLesson) => {
    if (!selectedClub) return;

    setSelectedLesson(lesson);
    setLoadingAttendance(true);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const records = await fetchAttendanceRecords(
        selectedClub.id,
        lesson.id,
        dateStr
      );
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error(t('errors.attendanceFetchFailed'));
    } finally {
      setLoadingAttendance(false);
      setAttendanceDialogOpen(true);
    }
  }, [selectedClub, selectedDate, t]);

  // Handle save attendance
  const handleSaveAttendance = useCallback(async (
    lessonId: string,
    studentId: string,
    status: string,
    rating?: number
  ) => {
    if (!selectedClub) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await saveAttendance(
        selectedClub.id,
        lessonId,
        studentId,
        dateStr,
        status as any,
        rating
      );
      toast.success(t('messages.attendanceSaved'));

      // Refresh attendance records
      const records = await fetchAttendanceRecords(
        selectedClub.id,
        lessonId,
        dateStr
      );
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error(t('errors.attendanceSaveFailed'));
    }
  }, [selectedClub, selectedDate, t]);

  // Get package progress for a lesson
  const getPackageProgress = (lesson: Lesson) => {
    const totalStudents = lesson.students.length;
    if (totalStudents === 0) return null;

    const finishedCount = lesson.students.filter(
      (s) => s.attendedCount >= lesson.packageSize
    ).length;

    return {
      finished: finishedCount,
      total: totalStudents,
      allFinished: finishedCount === totalStudents,
      partiallyFinished: finishedCount > 0 && finishedCount < totalStudents,
    };
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-4">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span className="font-semibold">
                      {format(selectedDate, 'dd MMMM yyyy, EEEE', { locale: tr })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {!isSameDay(selectedDate, new Date()) && (
                <Button variant="ghost" size="sm" onClick={goToToday}>
                  {t('actions.today')}
                </Button>
              )}
            </div>

            <Button variant="outline" size="icon" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lessons List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {t('attendance.lessonsForDate', {
              date: format(selectedDate, 'dd MMMM', { locale: tr }),
            })}
          </h3>
          <Badge variant="outline" className="text-sm">
            {dailyLessons.length} {t('labels.lessons')}
          </Badge>
        </div>

        {dailyLessons.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('empty.noLessonsToday')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {dailyLessons.map((lesson, index) => {
              const progress = getPackageProgress(lesson);

              return (
                <motion.div
                  key={`${lesson.id}-${lesson.scheduleType}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleLessonClick(lesson)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {lesson.scheduleType === 'conditioning' ? (
                            <Dumbbell className="h-5 w-5 text-orange-500" />
                          ) : (
                            <GraduationCap className="h-5 w-5 text-primary" />
                          )}
                          <div>
                            <CardTitle className="text-base line-clamp-1">
                              {lesson.groupName}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {lesson.dailyStartTime} - {lesson.dailyEndTime}
                            </div>
                          </div>
                        </div>

                        {/* Package Progress Badge */}
                        {progress && (
                          <>
                            {progress.allFinished && (
                              <Badge variant="destructive" className="text-xs">
                                {t('labels.packageFinished')}
                              </Badge>
                            )}
                            {progress.partiallyFinished && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                                {progress.finished}/{progress.total}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2">
                      {/* Coach */}
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{lesson.coachName}</span>
                      </div>

                      {/* Students */}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{lesson.students.length} {t('labels.students')}</span>
                      </div>

                      {/* Location */}
                      {lesson.dailyLocation && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{lesson.dailyLocation}</span>
                        </div>
                      )}

                      {/* Type Badge */}
                      <div className="pt-2 border-t">
                        <Badge
                          variant={lesson.scheduleType === 'conditioning' ? 'outline' : 'default'}
                          className={
                            lesson.scheduleType === 'conditioning'
                              ? 'border-orange-500 text-orange-500'
                              : ''
                          }
                        >
                          {lesson.scheduleType === 'conditioning'
                            ? t('lessonTypes.conditioning')
                            : t('labels.training')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance Dialog */}
      <AttendanceDialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
        lesson={selectedLesson}
        selectedDate={selectedDate}
        attendanceRecords={attendanceRecords}
        students={students}
        loading={loadingAttendance}
        onSaveAttendance={handleSaveAttendance}
      />
    </div>
  );
}
