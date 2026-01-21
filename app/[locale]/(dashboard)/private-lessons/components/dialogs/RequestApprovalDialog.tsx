'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, CalendarIcon, User, BookOpen, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { Request, TemplateRequest, StudentOption, RequestFinancialData } from '@/lib/types/private-lessons';
import { approveRequest, approveTemplateRequest } from '@/lib/firebase/private-lessons';

interface RequestApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: Request | TemplateRequest | null;
  students: StudentOption[];
  onSuccess: () => void;
}

interface ApprovalFormState {
  price: string;
  membershipYears: string;
  installmentCount: string;
  installmentDay: string;
  startDate: Date | null;
  notes: string;
}

const initialFormState: ApprovalFormState = {
  price: '',
  membershipYears: '1',
  installmentCount: '1',
  installmentDay: '1',
  startDate: new Date(),
  notes: '',
};

export default function RequestApprovalDialog({
  open,
  onOpenChange,
  request,
  students,
  onSuccess,
}: RequestApprovalDialogProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();

  const [formData, setFormData] = useState<ApprovalFormState>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);

  // Check if this is a template request
  const isTemplateRequest = request && 'lessonTemplateId' in request;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(initialFormState);
    }
  }, [open]);

  // Handle form field change
  const handleChange = (field: keyof ApprovalFormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Get student info
  const getStudentInfo = (): StudentOption | undefined => {
    if (!request) return undefined;
    return students.find((s) => s.id === request.studentId);
  };

  // Validate form
  const isValid =
    formData.price &&
    parseFloat(formData.price) >= 0 &&
    formData.membershipYears &&
    parseInt(formData.membershipYears) > 0 &&
    formData.installmentCount &&
    parseInt(formData.installmentCount) > 0 &&
    formData.installmentDay &&
    parseInt(formData.installmentDay) >= 1 &&
    parseInt(formData.installmentDay) <= 28 &&
    formData.startDate;

  // Calculate installments
  const calculateInstallments = () => {
    const price = parseFloat(formData.price) || 0;
    const count = parseInt(formData.installmentCount) || 1;
    const installmentAmount = price / count;
    return {
      count,
      amount: installmentAmount,
      total: price,
    };
  };

  // Handle approve
  const handleApprove = async () => {
    if (!selectedClub || !request || !isValid || !formData.startDate) return;

    setSaving(true);
    try {
      const financialData: RequestFinancialData = {
        price: parseFloat(formData.price),
        membershipYears: parseInt(formData.membershipYears),
        installmentCount: parseInt(formData.installmentCount),
        installmentDay: parseInt(formData.installmentDay),
        membershipStartDate: formData.startDate,
        lessonType: request.lessonType,
        notes: formData.notes,
      };

      if (isTemplateRequest) {
        await approveTemplateRequest(
          selectedClub.id,
          request.id,
          {
            price: financialData.price,
            membershipYears: financialData.membershipYears,
            installmentCount: financialData.installmentCount,
            installmentDay: financialData.installmentDay,
            startDate: financialData.membershipStartDate,
            notes: financialData.notes,
          }
        );
      } else {
        await approveRequest(
          selectedClub.id,
          request as Request,
          financialData,
          students
        );
      }

      toast.success(t('messages.requestApproved'));
      onSuccess();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(t('errors.approveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const studentInfo = getStudentInfo();
  const installmentInfo = calculateInstallments();

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t('dialogs.approveRequest.title')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.approveRequest.description')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {/* Request Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('sections.requestInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('labels.student')}
                  </span>
                  <span className="font-medium">
                    {request.studentName || studentInfo?.name || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('labels.lesson')}
                  </span>
                  <span className="font-medium">
                    {isTemplateRequest
                      ? (request as TemplateRequest).templateName
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('labels.lessonType')}
                  </span>
                  <Badge variant="outline">{request.lessonType}</Badge>
                </div>
                {request.notes && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground block mb-1">
                      {t('labels.notes')}
                    </span>
                    <p className="text-sm bg-muted p-2 rounded">
                      {request.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Financial Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('sections.financialSettings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">{t('fields.price')} *</Label>
                  <div className="relative">
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      placeholder={t('placeholders.price')}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ₺
                    </span>
                  </div>
                </div>

                {/* Membership Years */}
                <div className="space-y-2">
                  <Label>{t('fields.membershipYears')} *</Label>
                  <Select
                    value={formData.membershipYears}
                    onValueChange={(v) => handleChange('membershipYears', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year} {t('labels.year')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Installment Count */}
                <div className="space-y-2">
                  <Label>{t('fields.installmentCount')} *</Label>
                  <Select
                    value={formData.installmentCount}
                    onValueChange={(v) => handleChange('installmentCount', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 6, 12].map((count) => (
                        <SelectItem key={count} value={count.toString()}>
                          {count} {t('labels.installment')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Installment Day */}
                <div className="space-y-2">
                  <Label>{t('fields.installmentDay')} *</Label>
                  <Select
                    value={formData.installmentDay}
                    onValueChange={(v) => handleChange('installmentDay', v)}
                  >
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

                {/* Start Date */}
                <div className="space-y-2">
                  <Label>{t('fields.startDate')} *</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate
                          ? format(formData.startDate, 'dd/MM/yyyy')
                          : t('placeholders.selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate || undefined}
                        onSelect={(date) => {
                          handleChange('startDate', date);
                          setStartDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Installment Preview */}
                {formData.price && parseFloat(formData.price) > 0 && (
                  <div className="bg-muted p-3 rounded-lg space-y-1">
                    <p className="text-sm font-medium">
                      {t('labels.installmentPreview')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {installmentInfo.count} x{' '}
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(installmentInfo.amount)}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      {t('labels.total')}:{' '}
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(installmentInfo.total)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('fields.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder={t('placeholders.approvalNotes')}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleApprove} disabled={!isValid || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('actions.approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
