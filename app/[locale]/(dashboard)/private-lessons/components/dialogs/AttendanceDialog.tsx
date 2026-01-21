'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Loader2,
} from 'lucide-react';

import type {
  DailyLesson,
  AttendanceRecord,
  StudentOption,
  AttendanceStatus,
} from '@/lib/types/private-lessons';
import { ATTENDANCE_STATUSES } from '@/lib/types/private-lessons';

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: DailyLesson | null;
  selectedDate: Date;
  attendanceRecords: AttendanceRecord[];
  students: StudentOption[];
  loading: boolean;
  onSaveAttendance: (
    lessonId: string,
    studentId: string,
    status: string,
    rating?: number
  ) => Promise<void>;
}

export default function AttendanceDialog({
  open,
  onOpenChange,
  lesson,
  selectedDate,
  attendanceRecords,
  students,
  loading,
  onSaveAttendance,
}: AttendanceDialogProps) {
  const t = useTranslations('privateLessons');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Get attendance status for a student
  const getStudentAttendance = (studentId: string): AttendanceRecord | undefined => {
    return attendanceRecords.find((r) => r.studentId === studentId);
  };

  // Get student info
  const getStudentInfo = (studentId: string): StudentOption | undefined => {
    return students.find((s) => s.id === studentId);
  };

  // Handle status change
  const handleStatusChange = async (studentId: string, status: AttendanceStatus) => {
    if (!lesson) return;

    setSavingId(studentId);
    try {
      await onSaveAttendance(lesson.id, studentId, status);
    } finally {
      setSavingId(null);
    }
  };

  // Get status icon
  const getStatusIcon = (status?: AttendanceStatus) => {
    switch (status) {
      case 'Geldi':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Gelmedi':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'İzinli':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status badge variant
  const getStatusBadge = (status?: AttendanceStatus) => {
    switch (status) {
      case 'Geldi':
        return <Badge className="bg-green-500">{t('attendanceStatus.present')}</Badge>;
      case 'Gelmedi':
        return <Badge variant="destructive">{t('attendanceStatus.absent')}</Badge>;
      case 'İzinli':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            {t('attendanceStatus.excused')}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{t('attendanceStatus.pending')}</Badge>;
    }
  };

  if (!lesson) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="space-y-1">
            <div>{lesson.groupName}</div>
            <div className="text-sm font-normal text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {format(selectedDate, 'dd MMMM yyyy, EEEE', { locale: tr })}
              <span className="mx-2">|</span>
              {lesson.dailyStartTime} - {lesson.dailyEndTime}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {lesson.students.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {t('empty.noStudentsInLesson')}
                </p>
              ) : (
                lesson.students.map((lessonStudent) => {
                  const attendance = getStudentAttendance(lessonStudent.studentId);
                  const studentInfo = getStudentInfo(lessonStudent.studentId);
                  const isSaving = savingId === lessonStudent.studentId;
                  const isPackageFinished =
                    lessonStudent.attendedCount >= lesson.packageSize;

                  return (
                    <div
                      key={lessonStudent.studentId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{lessonStudent.studentName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {t('labels.progress')}: {lessonStudent.attendedCount}/
                              {lesson.packageSize}
                            </span>
                            {isPackageFinished && (
                              <Badge variant="destructive" className="text-xs">
                                {t('labels.packageFinished')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Select
                            value={attendance?.status || 'Bekleniyor'}
                            onValueChange={(v) =>
                              handleStatusChange(
                                lessonStudent.studentId,
                                v as AttendanceStatus
                              )
                            }
                            disabled={isPackageFinished}
                          >
                            <SelectTrigger className="w-[130px]">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(attendance?.status)}
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {ATTENDANCE_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(status)}
                                    {status === 'Bekleniyor'
                                      ? t('attendanceStatus.pending')
                                      : status === 'Geldi'
                                      ? t('attendanceStatus.present')
                                      : status === 'Gelmedi'
                                      ? t('attendanceStatus.absent')
                                      : t('attendanceStatus.excused')}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </ScrollArea>

        {/* Summary */}
        {!loading && lesson.students.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {attendanceRecords.filter((r) => r.status === 'Geldi').length}
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-500" />
                {attendanceRecords.filter((r) => r.status === 'Gelmedi').length}
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                {attendanceRecords.filter((r) => r.status === 'İzinli').length}
              </span>
            </div>
            <span className="text-muted-foreground">
              {t('labels.total')}: {lesson.students.length} {t('labels.students')}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
