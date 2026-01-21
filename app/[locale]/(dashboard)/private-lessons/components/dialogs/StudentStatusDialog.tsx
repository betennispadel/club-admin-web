'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Loader2,
  CalendarDays,
  Snowflake,
  Play,
  Pause,
  UserX,
  AlertCircle,
  Info,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type { StudentOption, PlayerStatus } from '@/lib/types/private-lessons';
import { PLAYER_STATUSES, FREEZE_REASONS, DELETE_REASONS } from '@/lib/types/private-lessons';
import { updateStudentStatus } from '@/lib/firebase/private-lessons';

interface StudentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentOption | null;
  onSuccess: () => void;
}

export default function StudentStatusDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: StudentStatusDialogProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();
  const { currentUser } = useAuthStore();

  // Form States
  const [newStatus, setNewStatus] = useState<PlayerStatus>('Aktif');
  const [freezeReason, setFreezeReason] = useState<string>('');
  const [customFreezeReason, setCustomFreezeReason] = useState('');
  const [freezeStartDate, setFreezeStartDate] = useState<Date>(new Date());
  const [freezeEndDate, setFreezeEndDate] = useState<Date | undefined>(undefined);
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && student) {
      setNewStatus(student.playerStatus || 'Aktif');
      setFreezeReason(student.freezeReason || '');
      setCustomFreezeReason('');
      if (student.freezeStartDate) {
        setFreezeStartDate(
          student.freezeStartDate && typeof (student.freezeStartDate as any).toDate === 'function'
            ? (student.freezeStartDate as any).toDate()
            : new Date(student.freezeStartDate as any)
        );
      } else {
        setFreezeStartDate(new Date());
      }
      if (student.freezeEndDate) {
        setFreezeEndDate(
          student.freezeEndDate && typeof (student.freezeEndDate as any).toDate === 'function'
            ? (student.freezeEndDate as any).toDate()
            : new Date(student.freezeEndDate as any)
        );
      } else {
        setFreezeEndDate(undefined);
      }
      setStatusChangeReason('');
    }
  }, [open, student]);

  const getCurrentStatusIcon = () => {
    switch (student?.playerStatus) {
      case 'Aktif':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'Dondurulmuş':
        return <Snowflake className="h-4 w-4 text-blue-500" />;
      case 'Geçici Dondurulmuş':
        return <Pause className="h-4 w-4 text-cyan-500" />;
      case 'Bıraktı':
        return <UserX className="h-4 w-4 text-gray-500" />;
      default:
        return <Play className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusIcon = (status: PlayerStatus) => {
    switch (status) {
      case 'Aktif':
        return <Play className="h-4 w-4" />;
      case 'Dondurulmuş':
        return <Snowflake className="h-4 w-4" />;
      case 'Geçici Dondurulmuş':
        return <Pause className="h-4 w-4" />;
      case 'Bıraktı':
        return <UserX className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: PlayerStatus) => {
    switch (status) {
      case 'Aktif':
        return 'default';
      case 'Dondurulmuş':
        return 'secondary';
      case 'Geçici Dondurulmuş':
        return 'outline';
      case 'Bıraktı':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const isFreezingStatus = (status: PlayerStatus) => {
    return status === 'Dondurulmuş' || status === 'Geçici Dondurulmuş';
  };

  const handleStatusChange = () => {
    // Validate
    if (isFreezingStatus(newStatus) && !freezeReason && !customFreezeReason) {
      toast.error(t('errors.selectFreezeReason'));
      return;
    }

    if (newStatus === 'Bıraktı') {
      // Show confirmation for quit status
      setConfirmDialogOpen(true);
      return;
    }

    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!selectedClub || !student || !currentUser) return;

    setLoading(true);
    try {
      const finalFreezeReason = freezeReason === 'Diğer' ? customFreezeReason : freezeReason;

      await updateStudentStatus(selectedClub.id, student.id, {
        playerStatus: newStatus,
        freezeReason: isFreezingStatus(newStatus) ? finalFreezeReason : undefined,
        freezeStartDate: isFreezingStatus(newStatus) ? freezeStartDate : undefined,
        freezeEndDate: newStatus === 'Geçici Dondurulmuş' ? freezeEndDate : undefined,
        statusChangeReason: statusChangeReason || undefined,
        statusChangeBy: currentUser.email || currentUser.uid,
      });

      onSuccess();
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('errors.statusUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getStatusIcon(newStatus)}
              {t('dialogs.status.title')}
            </DialogTitle>
            <DialogDescription>
              {t('dialogs.status.description', { name: student.name })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Status */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCurrentStatusIcon()}
                    <span className="text-sm text-muted-foreground">{t('labels.currentStatus')}</span>
                  </div>
                  <Badge variant={getStatusBadgeVariant(student.playerStatus || 'Aktif')}>
                    {t(`playerStatus.${(student.playerStatus || 'Aktif').toLowerCase().replace(' ', '_')}`)}
                  </Badge>
                </div>
                {student.freezeReason && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('labels.reason')}: {student.freezeReason}
                  </p>
                )}
                {student.lastStatusChange && (
                  <p className="text-xs text-muted-foreground">
                    {t('labels.lastChange')}: {format(
                      student.lastStatusChange && typeof (student.lastStatusChange as any).toDate === 'function'
                        ? (student.lastStatusChange as any).toDate()
                        : new Date(student.lastStatusChange as any),
                      'dd/MM/yyyy HH:mm'
                    )}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* New Status Selection */}
            <div className="space-y-2">
              <Label>{t('labels.newStatus')}</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as PlayerStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAYER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        {t(`playerStatus.${status.toLowerCase().replace(' ', '_')}`)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Freeze Options */}
            {isFreezingStatus(newStatus) && (
              <>
                <div className="space-y-2">
                  <Label>{t('labels.freezeReason')}</Label>
                  <Select value={freezeReason} onValueChange={setFreezeReason}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.selectReason')} />
                    </SelectTrigger>
                    <SelectContent>
                      {FREEZE_REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {freezeReason === 'Diğer' && (
                  <div className="space-y-2">
                    <Label>{t('labels.customReason')}</Label>
                    <Textarea
                      value={customFreezeReason}
                      onChange={(e) => setCustomFreezeReason(e.target.value)}
                      placeholder={t('placeholders.enterReason')}
                      rows={2}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('labels.freezeStartDate')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !freezeStartDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {freezeStartDate ? format(freezeStartDate, 'dd/MM/yyyy') : t('placeholders.selectDate')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={freezeStartDate}
                          onSelect={(date) => date && setFreezeStartDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {newStatus === 'Geçici Dondurulmuş' && (
                    <div className="space-y-2">
                      <Label>{t('labels.freezeEndDate')}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !freezeEndDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {freezeEndDate ? format(freezeEndDate, 'dd/MM/yyyy') : t('placeholders.selectDate')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={freezeEndDate}
                            onSelect={(date) => setFreezeEndDate(date)}
                            disabled={(date) => date < freezeStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Quit Reason */}
            {newStatus === 'Bıraktı' && (
              <div className="space-y-2">
                <Label>{t('labels.quitReason')}</Label>
                <Select value={statusChangeReason} onValueChange={setStatusChangeReason}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.selectReason')} />
                  </SelectTrigger>
                  <SelectContent>
                    {DELETE_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label>{t('labels.additionalNotes')}</Label>
              <Textarea
                value={statusChangeReason}
                onChange={(e) => setStatusChangeReason(e.target.value)}
                placeholder={t('placeholders.statusNotes')}
                rows={2}
              />
            </div>

            {/* Warning for quit status */}
            {newStatus === 'Bıraktı' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">{t('warnings.quitStatusTitle')}</p>
                  <p>{t('warnings.quitStatusDescription')}</p>
                </div>
              </div>
            )}

            {/* Info for temporary freeze */}
            {newStatus === 'Geçici Dondurulmuş' && freezeEndDate && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-700">
                  {t('messages.tempFreezeInfo', {
                    date: format(freezeEndDate, 'dd/MM/yyyy'),
                  })}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={loading || newStatus === student.playerStatus}
              variant={newStatus === 'Bıraktı' ? 'destructive' : 'default'}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('actions.updateStatus')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Quit */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.confirmQuit.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.confirmQuit.description', { name: student?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('actions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
