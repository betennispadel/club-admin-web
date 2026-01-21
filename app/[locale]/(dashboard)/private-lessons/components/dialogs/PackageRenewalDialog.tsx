'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  RotateCcw,
  Loader2,
  DollarSign,
  CalendarDays,
  Package,
  Info,
  History,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type { StudentOption, Lesson, LessonMembership } from '@/lib/types/private-lessons';
import { INSTALLMENT_OPTIONS, MEMBERSHIP_YEARS_OPTIONS, LESSON_PACKAGE_SIZES } from '@/lib/types/private-lessons';
import { renewPackage } from '@/lib/firebase/private-lessons';

interface PackageRenewalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentOption | null;
  lessons: Lesson[];
  onSuccess: () => void;
}

export default function PackageRenewalDialog({
  open,
  onOpenChange,
  student,
  lessons,
  onSuccess,
}: PackageRenewalDialogProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();
  const { currentUser } = useAuthStore();

  // Form States
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [membershipYears, setMembershipYears] = useState<string>('1');
  const [membershipStartDate, setMembershipStartDate] = useState<Date>(new Date());
  const [installmentCount, setInstallmentCount] = useState<string>('1');
  const [installmentDay, setInstallmentDay] = useState<string>('1');
  const [newPackageSize, setNewPackageSize] = useState<string>('8');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Get student's lessons
  const studentLessons = useMemo(() => {
    if (!student) return [];
    return lessons.filter((lesson) =>
      lesson.students.some((s) => s.studentId === student.id)
    );
  }, [student, lessons]);

  // Get active membership
  const activeMembership = useMemo(() => {
    if (!student?.lessonMemberships) return null;
    return student.lessonMemberships.find(m => m.status === 'Active');
  }, [student]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && student) {
      // Set defaults from current membership
      if (activeMembership) {
        setNewPrice(activeMembership.price.toString());
        setMembershipYears(activeMembership.membershipYears.toString());
        setInstallmentCount(activeMembership.installmentCount.toString());
        setInstallmentDay(activeMembership.installmentDay.toString());
        if (activeMembership.lessonId) {
          setSelectedLessonId(activeMembership.lessonId);
        }
      } else if (student.price) {
        setNewPrice(student.price.toString());
      }

      // Select first lesson if available
      if (studentLessons.length > 0 && !selectedLessonId) {
        setSelectedLessonId(studentLessons[0].id);
        setNewPackageSize(studentLessons[0].packageSize.toString());
      }

      setMembershipStartDate(new Date());
      setNotes('');
    }
  }, [open, student, activeMembership, studentLessons]);

  // Calculate preview data
  const previewData = useMemo(() => {
    const price = parseFloat(newPrice) || 0;
    const years = parseInt(membershipYears) || 1;
    const installments = parseInt(installmentCount) || 1;
    const day = parseInt(installmentDay) || 1;

    const endDate = new Date(membershipStartDate);
    endDate.setFullYear(endDate.getFullYear() + years);

    const installmentAmount = price / installments;

    // Generate installment preview
    const installmentPreview = Array.from({ length: installments }, (_, i) => {
      const dueDate = new Date(membershipStartDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      dueDate.setDate(day);

      return {
        number: i + 1,
        amount: i === installments - 1 ? price - (installmentAmount * (installments - 1)) : installmentAmount,
        dueDate,
      };
    });

    return {
      price,
      endDate,
      installmentAmount,
      installmentPreview,
    };
  }, [newPrice, membershipYears, installmentCount, installmentDay, membershipStartDate]);

  const handleSubmit = async () => {
    if (!selectedClub || !student || !currentUser) return;

    if (!selectedLessonId) {
      toast.error(t('errors.selectLesson'));
      return;
    }

    if (!newPrice || parseFloat(newPrice) <= 0) {
      toast.error(t('errors.enterPrice'));
      return;
    }

    setLoading(true);
    try {
      await renewPackage(selectedClub.id, selectedLessonId, student.id, {
        newPrice: parseFloat(newPrice),
        membershipYears: parseInt(membershipYears),
        membershipStartDate,
        installmentCount: parseInt(installmentCount),
        installmentDay: parseInt(installmentDay),
        newPackageSize: parseInt(newPackageSize),
        notes: notes || undefined,
        renewedBy: currentUser.email || currentUser.uid,
      });

      onSuccess();
    } catch (error) {
      console.error('Error renewing package:', error);
      toast.error(t('errors.renewalFailed'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            {t('dialogs.renewal.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dialogs.renewal.description', { name: student.name })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Current Package Info */}
            {activeMembership && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    {t('labels.currentPackage')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t('labels.lesson')}</p>
                      <p className="font-medium">{activeMembership.lessonName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('labels.price')}</p>
                      <p className="font-medium">{formatCurrency(activeMembership.price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('labels.endDate')}</p>
                      <p className="font-medium">
                        {format(activeMembership.endDate.toDate(), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lesson Selection */}
            <div className="space-y-2">
              <Label>{t('labels.selectLesson')}</Label>
              <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectLesson')} />
                </SelectTrigger>
                <SelectContent>
                  {studentLessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.groupName} - {lesson.lessonType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* New Package Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPrice">{t('labels.newPrice')}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('labels.packageSize')}</Label>
                <Select value={newPackageSize} onValueChange={setNewPackageSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LESSON_PACKAGE_SIZES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('labels.membershipYears')}</Label>
                <Select value={membershipYears} onValueChange={setMembershipYears}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBERSHIP_YEARS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('labels.startDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !membershipStartDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {membershipStartDate ? format(membershipStartDate, 'dd/MM/yyyy') : t('placeholders.selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={membershipStartDate}
                      onSelect={(date) => date && setMembershipStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('labels.installmentCount')}</Label>
                <Select value={installmentCount} onValueChange={setInstallmentCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTALLMENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('labels.installmentDay')}</Label>
                <Select value={installmentDay} onValueChange={setInstallmentDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {t('labels.dayOfMonth', { day })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('labels.notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('placeholders.renewalNotes')}
                rows={3}
              />
            </div>

            <Separator />

            {/* Preview */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t('labels.renewalPreview')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">{t('labels.totalPrice')}</p>
                    <p className="font-bold text-lg">{formatCurrency(previewData.price)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('labels.installmentAmount')}</p>
                    <p className="font-bold">{formatCurrency(previewData.installmentAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('labels.endDate')}</p>
                    <p className="font-bold">{format(previewData.endDate, 'dd/MM/yyyy')}</p>
                  </div>
                </div>

                {parseInt(installmentCount) > 1 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t('labels.installmentSchedule')}</p>
                    <div className="grid gap-2">
                      {previewData.installmentPreview.slice(0, 4).map((inst) => (
                        <div
                          key={inst.number}
                          className="flex items-center justify-between text-sm p-2 bg-background rounded"
                        >
                          <span>
                            {t('labels.installment')} {inst.number}
                          </span>
                          <span className="text-muted-foreground">
                            {format(inst.dueDate, 'dd/MM/yyyy')}
                          </span>
                          <span className="font-medium">{formatCurrency(inst.amount)}</span>
                        </div>
                      ))}
                      {parseInt(installmentCount) > 4 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{parseInt(installmentCount) - 4} {t('labels.moreInstallments')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !newPrice || !selectedLessonId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('actions.renewPackage')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
