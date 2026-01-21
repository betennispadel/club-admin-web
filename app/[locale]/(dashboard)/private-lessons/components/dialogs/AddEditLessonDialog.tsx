'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, X, Clock, MapPin } from 'lucide-react';

import type {
  Lesson,
  Coach,
  StudentOption,
  LessonFormState,
  ScheduleEntry,
} from '@/lib/types/private-lessons';
import {
  LESSON_TYPES,
  LESSON_LEVELS,
  LESSON_PACKAGE_SIZES,
  WEEK_DAYS,
  initialLessonFormState,
} from '@/lib/types/private-lessons';
import { createLesson, updateLesson } from '@/lib/firebase/private-lessons';

interface AddEditLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
  students: StudentOption[];
  coaches: Coach[];
  onSuccess: () => void;
}

export default function AddEditLessonDialog({
  open,
  onOpenChange,
  lesson,
  students,
  coaches,
  onSuccess,
}: AddEditLessonDialogProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();

  const [formData, setFormData] = useState<LessonFormState>(initialLessonFormState);
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens/closes or lesson changes
  useEffect(() => {
    if (open) {
      if (lesson) {
        setFormData({
          id: lesson.id,
          groupName: lesson.groupName,
          selectedCoachId: lesson.coachId,
          coachId: lesson.coachId,
          lessonType: lesson.lessonType,
          selectedStudentOptionIds: lesson.students.map((s) =>
            s.isManual ? `manual_${s.studentId}` : `user_${s.studentId}`
          ),
          status: lesson.status,
          level: lesson.level,
          packageSize: String(lesson.packageSize),
          trainingSchedule: lesson.trainingSchedule || [],
          conditioningSchedule: lesson.conditioningSchedule || [],
          startDate: lesson.startDate || null,
          price: lesson.price,
          notes: lesson.notes,
        });
      } else {
        setFormData(initialLessonFormState);
      }
    }
  }, [open, lesson]);

  // Filter coaches based on lesson type
  const filteredCoaches = useMemo(() => {
    return coaches.filter((c) => {
      if (formData.lessonType === 'Kondisyon') {
        return c.role === 'conditioning' || c.isManual;
      } else if (formData.lessonType === 'Bireysel' || formData.lessonType === 'Grup') {
        return c.role !== 'conditioning';
      }
      return true;
    });
  }, [coaches, formData.lessonType]);

  // Filter students based on lesson type
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (student.playerStatus && student.playerStatus !== 'Aktif') {
        return false;
      }
      if (!formData.lessonType) return true;

      if (student.lessonMemberships?.length) {
        return student.lessonMemberships.some(
          (m) => m.lessonType === formData.lessonType
        );
      }
      if (student.appliedLessonTypes?.length) {
        return student.appliedLessonTypes.includes(formData.lessonType);
      }
      if (student.lessonType) {
        return student.lessonType === formData.lessonType;
      }
      return false;
    });
  }, [students, formData.lessonType]);

  // Handle form field change
  const handleChange = (field: keyof LessonFormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Reset students when lesson type changes
    if (field === 'lessonType') {
      setFormData((prev) => ({ ...prev, selectedStudentOptionIds: [] }));
    }
  };

  // Toggle student selection
  const toggleStudent = (studentId: string) => {
    setFormData((prev) => {
      const isSelected = prev.selectedStudentOptionIds.includes(studentId);

      // For individual lessons, only allow one student
      if (prev.lessonType === 'Bireysel') {
        return {
          ...prev,
          selectedStudentOptionIds: isSelected ? [] : [studentId],
        };
      }

      return {
        ...prev,
        selectedStudentOptionIds: isSelected
          ? prev.selectedStudentOptionIds.filter((id) => id !== studentId)
          : [...prev.selectedStudentOptionIds, studentId],
      };
    });
  };

  // Toggle training day
  const toggleTrainingDay = (day: string) => {
    setFormData((prev) => {
      const existingIndex = prev.trainingSchedule.findIndex((s) => s.day === day);
      if (existingIndex >= 0) {
        return {
          ...prev,
          trainingSchedule: prev.trainingSchedule.filter((_, i) => i !== existingIndex),
        };
      } else {
        return {
          ...prev,
          trainingSchedule: [
            ...prev.trainingSchedule,
            { day, startTime: '18:00', endTime: '19:30', location: '' },
          ],
        };
      }
    });
  };

  // Update training schedule
  const updateTrainingSchedule = (
    day: string,
    field: keyof ScheduleEntry,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      trainingSchedule: prev.trainingSchedule.map((s) =>
        s.day === day ? { ...s, [field]: value } : s
      ),
    }));
  };

  // Toggle conditioning day
  const toggleConditioningDay = (day: string) => {
    setFormData((prev) => {
      const existingIndex = prev.conditioningSchedule.findIndex((s) => s.day === day);
      if (existingIndex >= 0) {
        return {
          ...prev,
          conditioningSchedule: prev.conditioningSchedule.filter((_, i) => i !== existingIndex),
        };
      } else {
        return {
          ...prev,
          conditioningSchedule: [
            ...prev.conditioningSchedule,
            { day, startTime: '17:00', endTime: '18:00', location: '' },
          ],
        };
      }
    });
  };

  // Update conditioning schedule
  const updateConditioningSchedule = (
    day: string,
    field: keyof ScheduleEntry,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      conditioningSchedule: prev.conditioningSchedule.map((s) =>
        s.day === day ? { ...s, [field]: value } : s
      ),
    }));
  };

  // Validate form
  const isValid = useMemo(() => {
    const hasStudents = formData.selectedStudentOptionIds.length > 0;
    const hasValidSchedule =
      formData.lessonType === 'Kondisyon'
        ? formData.conditioningSchedule.length > 0
        : formData.trainingSchedule.length > 0;

    return (
      formData.groupName.trim() &&
      hasStudents &&
      formData.selectedCoachId &&
      formData.lessonType &&
      formData.packageSize &&
      (formData.lessonType !== 'Bireysel' ||
        formData.selectedStudentOptionIds.length === 1) &&
      hasValidSchedule
    );
  }, [formData]);

  // Handle save
  const handleSave = async () => {
    if (!selectedClub || !isValid) return;

    setSaving(true);
    try {
      if (formData.id) {
        // Update existing lesson
        const existingLesson = lesson!;
        await updateLesson(
          selectedClub.id,
          formData.id,
          formData,
          coaches,
          students,
          existingLesson
        );
        toast.success(t('messages.lessonUpdated'));
      } else {
        // Create new lesson
        await createLesson(selectedClub.id, formData, coaches, students);
        toast.success(t('messages.lessonCreated'));
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error(t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {formData.id ? t('dialogs.editLesson.title') : t('dialogs.addLesson.title')}
          </DialogTitle>
          <DialogDescription>
            {formData.id
              ? t('dialogs.editLesson.description')
              : t('dialogs.addLesson.description')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="groupName">{t('fields.groupName')} *</Label>
              <Input
                id="groupName"
                value={formData.groupName}
                onChange={(e) => handleChange('groupName', e.target.value)}
                placeholder={t('placeholders.groupName')}
              />
            </div>

            {/* Lesson Type */}
            <div className="space-y-2">
              <Label>{t('fields.lessonType')} *</Label>
              <Select
                value={formData.lessonType}
                onValueChange={(v) => handleChange('lessonType', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectLessonType')} />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`lessonTypes.${type.toLowerCase()}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coach */}
            <div className="space-y-2">
              <Label>{t('fields.coach')} *</Label>
              <Select
                value={formData.selectedCoachId}
                onValueChange={(v) => handleChange('selectedCoachId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectCoach')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCoaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.name}
                      {coach.isManual && ' (M)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Students Selection */}
            <div className="space-y-2">
              <Label>
                {t('fields.students')} * ({formData.selectedStudentOptionIds.length}{' '}
                {t('labels.selected')})
              </Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {!formData.lessonType ? (
                  <p className="text-sm text-muted-foreground">
                    {t('messages.selectLessonTypeFirst')}
                  </p>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t('messages.noStudentsForType')}
                  </p>
                ) : (
                  filteredStudents.map((student) => {
                    const studentId = `${student.type}_${student.id}`;
                    const isSelected =
                      formData.selectedStudentOptionIds.includes(studentId);

                    return (
                      <div
                        key={studentId}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={studentId}
                          checked={isSelected}
                          onCheckedChange={() => toggleStudent(studentId)}
                        />
                        <label
                          htmlFor={studentId}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {student.name}
                          {student.type === 'manual' && (
                            <span className="text-muted-foreground"> (M)</span>
                          )}
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Package Size */}
            <div className="space-y-2">
              <Label>{t('fields.packageSize')} *</Label>
              <Select
                value={formData.packageSize}
                onValueChange={(v) => handleChange('packageSize', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_PACKAGE_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level */}
            <div className="space-y-2">
              <Label>{t('fields.level')}</Label>
              <Select
                value={formData.level}
                onValueChange={(v) => handleChange('level', v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Training Schedule (for non-conditioning) */}
            {formData.lessonType !== 'Kondisyon' && (
              <div className="space-y-3">
                <Label>{t('fields.trainingSchedule')} *</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map((day) => {
                    const isSelected = formData.trainingSchedule.some(
                      (s) => s.day === day
                    );
                    return (
                      <Badge
                        key={day}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTrainingDay(day)}
                      >
                        {day}
                      </Badge>
                    );
                  })}
                </div>

                {/* Time inputs for selected days */}
                {formData.trainingSchedule.map((schedule) => (
                  <div
                    key={schedule.day}
                    className="grid grid-cols-4 gap-2 items-center border rounded-md p-2"
                  >
                    <span className="text-sm font-medium">{schedule.day}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) =>
                          updateTrainingSchedule(schedule.day, 'startTime', e.target.value)
                        }
                        className="h-8"
                      />
                    </div>
                    <Input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) =>
                        updateTrainingSchedule(schedule.day, 'endTime', e.target.value)
                      }
                      className="h-8"
                    />
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <Input
                        value={schedule.location || ''}
                        onChange={(e) =>
                          updateTrainingSchedule(schedule.day, 'location', e.target.value)
                        }
                        placeholder={t('placeholders.location')}
                        className="h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Conditioning Schedule */}
            {formData.lessonType === 'Kondisyon' && (
              <div className="space-y-3">
                <Label>{t('fields.conditioningSchedule')} *</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map((day) => {
                    const isSelected = formData.conditioningSchedule.some(
                      (s) => s.day === day
                    );
                    return (
                      <Badge
                        key={day}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleConditioningDay(day)}
                      >
                        {day}
                      </Badge>
                    );
                  })}
                </div>

                {formData.conditioningSchedule.map((schedule) => (
                  <div
                    key={schedule.day}
                    className="grid grid-cols-4 gap-2 items-center border rounded-md p-2"
                  >
                    <span className="text-sm font-medium">{schedule.day}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) =>
                          updateConditioningSchedule(schedule.day, 'startTime', e.target.value)
                        }
                        className="h-8"
                      />
                    </div>
                    <Input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) =>
                        updateConditioningSchedule(schedule.day, 'endTime', e.target.value)
                      }
                      className="h-8"
                    />
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <Input
                        value={schedule.location || ''}
                        onChange={(e) =>
                          updateConditioningSchedule(schedule.day, 'location', e.target.value)
                        }
                        placeholder={t('placeholders.location')}
                        className="h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('fields.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder={t('placeholders.notes')}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {formData.id ? t('actions.save') : t('actions.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
