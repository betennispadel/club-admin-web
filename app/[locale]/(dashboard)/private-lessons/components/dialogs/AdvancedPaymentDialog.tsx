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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  Loader2,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Banknote,
  Wallet,
  Receipt,
  Info,
} from 'lucide-react';

import type { StudentOption, Installment, PaymentMethod, LessonMembership } from '@/lib/types/private-lessons';
import { PAYMENT_METHODS } from '@/lib/types/private-lessons';
import { processPayment } from '@/lib/firebase/private-lessons';

interface AdvancedPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentOption | null;
  onSuccess: () => void;
}

export default function AdvancedPaymentDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: AdvancedPaymentDialogProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();
  const { currentUser, userProfile } = useAuthStore();

  // Form States
  const [paymentType, setPaymentType] = useState<'installment' | 'partial' | 'full' | 'lateFee'>('installment');
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([]);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Nakit');
  const [notes, setNotes] = useState('');
  const [selectedMembershipId, setSelectedMembershipId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && student) {
      setPaymentType('installment');
      setSelectedInstallments([]);
      setCustomAmount('');
      setPaymentMethod('Nakit');
      setNotes('');

      // Auto-select first membership
      if (student.lessonMemberships && student.lessonMemberships.length > 0) {
        const activeMembership = student.lessonMemberships.find(m => m.status === 'Active');
        if (activeMembership) {
          setSelectedMembershipId(activeMembership.id);
        }
      }
    }
  }, [open, student]);

  // Get selected membership
  const selectedMembership = useMemo(() => {
    if (!student?.lessonMemberships) return null;
    return student.lessonMemberships.find(m => m.id === selectedMembershipId) || null;
  }, [student, selectedMembershipId]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    if (paymentType === 'full') {
      return student?.remainingAmount || 0;
    }
    if (paymentType === 'partial' || paymentType === 'lateFee') {
      return parseFloat(customAmount) || 0;
    }
    if (paymentType === 'installment' && selectedMembership) {
      return selectedMembership.installments
        .filter(inst => selectedInstallments.includes(inst.installmentNumber))
        .reduce((sum, inst) => sum + (inst.amount + (inst.lateFee || 0)), 0);
    }
    return 0;
  }, [paymentType, customAmount, selectedInstallments, selectedMembership, student]);

  // Get installment status
  const getInstallmentStatus = (installment: Installment) => {
    if (installment.status === 'Ödendi') return 'paid';
    const dueDate = installment.dueDate && typeof (installment.dueDate as any).toDate === 'function'
      ? (installment.dueDate as any).toDate()
      : new Date(installment.dueDate as any);
    if (dueDate < new Date()) return 'overdue';
    return 'pending';
  };

  const getInstallmentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />{t('paymentStatus.paid')}</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />{t('paymentStatus.overdue')}</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{t('paymentStatus.pending')}</Badge>;
    }
  };

  const handleInstallmentToggle = (installmentNumber: number) => {
    setSelectedInstallments(prev => {
      if (prev.includes(installmentNumber)) {
        return prev.filter(n => n !== installmentNumber);
      }
      return [...prev, installmentNumber];
    });
  };

  const handleSelectAllPending = () => {
    if (!selectedMembership) return;
    const pendingNumbers = selectedMembership.installments
      .filter(inst => inst.status !== 'Ödendi')
      .map(inst => inst.installmentNumber);
    setSelectedInstallments(pendingNumbers);
  };

  const handleSubmit = async () => {
    if (!selectedClub || !student || !currentUser) return;

    if (paymentType === 'installment' && selectedInstallments.length === 0) {
      toast.error(t('errors.selectInstallment'));
      return;
    }

    if ((paymentType === 'partial' || paymentType === 'lateFee') && !customAmount) {
      toast.error(t('errors.enterAmount'));
      return;
    }

    if (totalAmount <= 0) {
      toast.error(t('errors.invalidAmount'));
      return;
    }

    setLoading(true);
    try {
      await processPayment(selectedClub.id, student.id, {
        amount: totalAmount,
        paymentMethod,
        paymentType,
        installmentNumbers: paymentType === 'installment' ? selectedInstallments : undefined,
        lessonMembershipId: selectedMembershipId || undefined,
        notes: notes || undefined,
        processedBy: currentUser.email || currentUser.uid,
        playerName: student.name,
      });

      onSuccess();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(t('errors.paymentFailed'));
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
            <CreditCard className="h-5 w-5" />
            {t('dialogs.payment.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dialogs.payment.description', { name: student.name })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Student Summary */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('labels.totalPrice')}</p>
                    <p className="font-bold">{formatCurrency(student.price || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('labels.paid')}</p>
                    <p className="font-bold text-green-600">{formatCurrency(student.totalPaid || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('labels.remaining')}</p>
                    <p className="font-bold text-red-600">{formatCurrency(student.remainingAmount || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Membership Selection */}
            {student.lessonMemberships && student.lessonMemberships.length > 0 && (
              <div className="space-y-2">
                <Label>{t('labels.selectMembership')}</Label>
                <Select value={selectedMembershipId} onValueChange={setSelectedMembershipId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.selectMembership')} />
                  </SelectTrigger>
                  <SelectContent>
                    {student.lessonMemberships.map((membership) => (
                      <SelectItem key={membership.id} value={membership.id}>
                        {membership.lessonName} - {membership.lessonType}
                        {membership.status === 'Active' && ' (Aktif)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Type Tabs */}
            <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="installment">{t('paymentTypes.installment')}</TabsTrigger>
                <TabsTrigger value="partial">{t('paymentTypes.partial')}</TabsTrigger>
                <TabsTrigger value="full">{t('paymentTypes.full')}</TabsTrigger>
                <TabsTrigger value="lateFee">{t('paymentTypes.lateFee')}</TabsTrigger>
              </TabsList>

              {/* Installment Payment */}
              <TabsContent value="installment" className="space-y-4">
                {selectedMembership?.installments && selectedMembership.installments.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <Label>{t('labels.selectInstallments')}</Label>
                      <Button variant="link" size="sm" onClick={handleSelectAllPending}>
                        {t('actions.selectAllPending')}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {selectedMembership.installments.map((installment) => {
                        const status = getInstallmentStatus(installment);
                        const isDisabled = status === 'paid';
                        const dueDate = installment.dueDate && typeof (installment.dueDate as any).toDate === 'function'
                          ? (installment.dueDate as any).toDate()
                          : new Date(installment.dueDate as any);

                        return (
                          <div
                            key={installment.installmentNumber}
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              isDisabled ? 'bg-muted opacity-60' : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedInstallments.includes(installment.installmentNumber)}
                                onCheckedChange={() => handleInstallmentToggle(installment.installmentNumber)}
                                disabled={isDisabled}
                              />
                              <div>
                                <p className="font-medium">
                                  {t('labels.installment')} {installment.installmentNumber}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {format(dueDate, 'dd/MM/yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(installment.amount)}</p>
                                {installment.lateFee && installment.lateFee > 0 && (
                                  <p className="text-xs text-red-500">
                                    +{formatCurrency(installment.lateFee)} ({t('labels.lateFee')})
                                  </p>
                                )}
                              </div>
                              {getInstallmentStatusBadge(status)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2" />
                    <p>{t('messages.noInstallments')}</p>
                  </div>
                )}
              </TabsContent>

              {/* Partial Payment */}
              <TabsContent value="partial" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customAmount">{t('labels.paymentAmount')}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      max={student.remainingAmount || 0}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('labels.maxAmount')}: {formatCurrency(student.remainingAmount || 0)}
                  </p>
                </div>
              </TabsContent>

              {/* Full Payment */}
              <TabsContent value="full" className="space-y-4">
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600">{t('labels.fullPaymentAmount')}</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(student.remainingAmount || 0)}
                        </p>
                      </div>
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Late Fee */}
              <TabsContent value="lateFee" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lateFeeAmount">{t('labels.lateFeeAmount')}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lateFeeAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-700">{t('messages.lateFeeInfo')}</p>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>{t('labels.paymentMethod')}</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method === 'Nakit' && <Banknote className="h-4 w-4 inline mr-2" />}
                      {method === 'Kredi Kartı' && <CreditCard className="h-4 w-4 inline mr-2" />}
                      {method === 'Havale/EFT' && <Wallet className="h-4 w-4 inline mr-2" />}
                      {t(`paymentMethods.${method.toLowerCase().replace('/', '_')}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('labels.notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('placeholders.paymentNotes')}
                rows={3}
              />
            </div>

            {/* Total Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('labels.totalToPay')}</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                  <Receipt className="h-10 w-10 text-primary/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || totalAmount <= 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('actions.processPayment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
