'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

import type { StudentOption, Lesson } from '@/lib/types/private-lessons';

interface StudentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentOption | null;
  lessons: Lesson[];
}

export default function StudentDetailsDialog({
  open,
  onOpenChange,
  student,
  lessons,
}: StudentDetailsDialogProps) {
  const t = useTranslations('privateLessons');

  // Get student's lessons
  const studentLessons = useMemo(() => {
    if (!student) return [];
    return lessons.filter((lesson) =>
      lesson.students.some((s) => s.studentId === student.id)
    );
  }, [student, lessons]);

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMM yyyy', { locale: tr });
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case 'Ödendi':
        return (
          <Badge className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            {t('paymentStatus.paid')}
          </Badge>
        );
      case 'Beklemede':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600 gap-1">
            <Clock className="h-3 w-3" />
            {t('paymentStatus.pending')}
          </Badge>
        );
      case 'Gecikmiş':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {t('paymentStatus.overdue')}
          </Badge>
        );
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            {student.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Contact Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {t('sections.contactInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{student.phone}</span>
                  </div>
                )}
                {student.birthDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(student.birthDate)}</span>
                  </div>
                )}
                {student.level && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{t('labels.level')}:</span>
                    <Badge variant="outline">{student.level}</Badge>
                  </div>
                )}
                {student.gender && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{t('labels.gender')}:</span>
                    <span>{student.gender}</span>
                  </div>
                )}
                {student.profession && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{t('labels.profession')}:</span>
                    <span>{student.profession}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('sections.financialInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('labels.totalPrice')}</p>
                    <p className="text-lg font-semibold">{formatCurrency(student.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('labels.totalPaid')}</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(student.totalPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('labels.remaining')}</p>
                    <p className="text-lg font-semibold text-destructive">
                      {formatCurrency(student.remainingAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('labels.status')}</p>
                    <div className="mt-1">{getPaymentStatusBadge(student.paymentStatus)}</div>
                  </div>
                </div>

                <Separator />

                {/* Installments */}
                {student.installments && student.installments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t('labels.installments')}</p>
                    <div className="space-y-2">
                      {student.installments.map((installment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm border rounded-md p-2"
                        >
                          <span>
                            {t('labels.installment')} {installment.installmentNumber}
                          </span>
                          <span className="text-muted-foreground">
                            {formatDate(installment.dueDate)}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(installment.amount)}
                          </span>
                          <Badge
                            variant={
                              installment.status === 'Ödendi'
                                ? 'default'
                                : installment.status === 'Gecikmiş'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            {installment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Lessons */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {t('sections.activeLessons')} ({studentLessons.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentLessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t('empty.noActiveLessons')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {studentLessons.map((lesson) => {
                      const studentData = lesson.students.find(
                        (s) => s.studentId === student.id
                      );
                      const progress = studentData
                        ? `${studentData.attendedCount}/${lesson.packageSize}`
                        : '-';
                      const isFinished =
                        studentData &&
                        studentData.attendedCount >= lesson.packageSize;

                      return (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between text-sm border rounded-md p-3"
                        >
                          <div>
                            <p className="font-medium">{lesson.groupName}</p>
                            <p className="text-xs text-muted-foreground">
                              {lesson.coachName} - {lesson.lessonType}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={isFinished ? 'destructive' : 'outline'}
                            >
                              {progress}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lesson Memberships */}
            {student.lessonMemberships && student.lessonMemberships.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {t('sections.memberships')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {student.lessonMemberships.map((membership, index) => (
                      <div
                        key={index}
                        className="border rounded-md p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{membership.lessonName}</span>
                          <Badge
                            variant={
                              membership.status === 'Active' ? 'default' : 'secondary'
                            }
                          >
                            {membership.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <span>
                            {t('labels.startDate')}: {formatDate(membership.startDate)}
                          </span>
                          <span>
                            {t('labels.endDate')}: {formatDate(membership.endDate)}
                          </span>
                          <span>
                            {t('labels.price')}: {formatCurrency(membership.price)}
                          </span>
                          <span>
                            {t('labels.paid')}: {formatCurrency(membership.totalPaid)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {student.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{t('labels.notes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{student.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
