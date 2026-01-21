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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Receipt,
  Loader2,
  CreditCard,
  Banknote,
  Wallet,
  Calendar,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  User,
} from 'lucide-react';

import type { StudentOption, PaymentRecord, PaymentType } from '@/lib/types/private-lessons';
import { PAYMENT_DELETE_REASONS } from '@/lib/types/private-lessons';
import { fetchPaymentRecords, deletePaymentRecord } from '@/lib/firebase/private-lessons';

interface PaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentOption | null;
}

export default function PaymentHistoryDialog({
  open,
  onOpenChange,
  student,
}: PaymentHistoryDialogProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();
  const { currentUser } = useAuthStore();

  // States
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [customDeleteReason, setCustomDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Fetch payment records
  useEffect(() => {
    if (open && student && selectedClub) {
      loadPayments();
    }
  }, [open, student, selectedClub]);

  const loadPayments = async () => {
    if (!selectedClub || !student) return;

    setLoading(true);
    try {
      const records = await fetchPaymentRecords(selectedClub.id, student.id);
      setPayments(records);
    } catch (error) {
      console.error('Error fetching payment records:', error);
      toast.error(t('errors.fetchPaymentsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (payment: any) => {
    setPaymentToDelete(payment);
    setDeleteReason('');
    setCustomDeleteReason('');
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedClub || !student || !paymentToDelete || !currentUser) return;

    const finalReason = deleteReason === 'Diğer' ? customDeleteReason : deleteReason;
    if (!finalReason) {
      toast.error(t('errors.selectDeleteReason'));
      return;
    }

    setDeleting(true);
    try {
      await deletePaymentRecord(
        selectedClub.id,
        student.id,
        paymentToDelete.id,
        finalReason,
        currentUser.email || currentUser.uid
      );

      toast.success(t('messages.paymentDeleted'));
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
      loadPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error(t('errors.deletePaymentFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const getPaymentTypeLabel = (type: PaymentType) => {
    switch (type) {
      case 'installment':
        return t('paymentTypes.installment');
      case 'partial':
        return t('paymentTypes.partial');
      case 'full':
        return t('paymentTypes.full');
      case 'lateFee':
        return t('paymentTypes.lateFee');
      case 'renewal':
        return t('paymentTypes.renewal');
      default:
        return type;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Nakit':
        return <Banknote className="h-4 w-4" />;
      case 'Kredi Kartı':
        return <CreditCard className="h-4 w-4" />;
      case 'Havale/EFT':
        return <Wallet className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getPaymentTypeBadge = (type: PaymentType) => {
    switch (type) {
      case 'full':
        return <Badge className="bg-green-500">{getPaymentTypeLabel(type)}</Badge>;
      case 'installment':
        return <Badge variant="outline">{getPaymentTypeLabel(type)}</Badge>;
      case 'partial':
        return <Badge variant="secondary">{getPaymentTypeLabel(type)}</Badge>;
      case 'lateFee':
        return <Badge variant="destructive">{getPaymentTypeLabel(type)}</Badge>;
      case 'renewal':
        return <Badge className="bg-blue-500">{getPaymentTypeLabel(type)}</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // Calculate summary
  const summary = payments.reduce(
    (acc, payment) => ({
      total: acc.total + payment.amount,
      count: acc.count + 1,
    }),
    { total: 0, count: 0 }
  );

  if (!student) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {t('dialogs.paymentHistory.title')}
            </DialogTitle>
            <DialogDescription>
              {t('dialogs.paymentHistory.description', { name: student.name })}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Student Summary */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t('labels.totalPrice')}</p>
                      <p className="font-bold">{formatCurrency(student.price || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('labels.totalPaid')}</p>
                      <p className="font-bold text-green-600">{formatCurrency(student.totalPaid || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('labels.remaining')}</p>
                      <p className="font-bold text-red-600">{formatCurrency(student.remainingAmount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('labels.paymentCount')}</p>
                      <p className="font-bold">{summary.count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Records */}
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-10">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('messages.noPayments')}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('labels.date')}</TableHead>
                        <TableHead>{t('labels.type')}</TableHead>
                        <TableHead>{t('labels.method')}</TableHead>
                        <TableHead className="text-right">{t('labels.amount')}</TableHead>
                        <TableHead>{t('labels.details')}</TableHead>
                        <TableHead className="text-right">{t('labels.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => {
                        const paymentDate = payment.paymentDate?.toDate
                          ? payment.paymentDate.toDate()
                          : new Date(payment.paymentDate?.seconds * 1000 || payment.paymentDate);

                        return (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(paymentDate, 'dd/MM/yyyy')}
                                <span className="text-xs text-muted-foreground">
                                  {format(paymentDate, 'HH:mm')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getPaymentTypeBadge(payment.paymentType)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getPaymentMethodIcon(payment.paymentMethod)}
                                {payment.paymentMethod}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {payment.installmentNumbers && payment.installmentNumbers.length > 0 && (
                                  <p className="text-muted-foreground">
                                    {t('labels.installments')}: {payment.installmentNumbers.join(', ')}
                                  </p>
                                )}
                                {payment.notes && (
                                  <p className="text-muted-foreground truncate max-w-[200px]" title={payment.notes}>
                                    {payment.notes}
                                  </p>
                                )}
                                {payment.processedBy && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {payment.processedBy}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteClick(payment)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Installment Summary */}
              {student.installments && student.installments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium">{t('labels.installmentStatus')}</h4>
                    <div className="grid gap-2">
                      {student.installments.map((installment) => {
                        const dueDate = installment.dueDate && typeof (installment.dueDate as any).toDate === 'function'
                          ? (installment.dueDate as any).toDate()
                          : new Date(installment.dueDate as any);
                        const isOverdue = installment.status === 'Beklemede' && dueDate < new Date();

                        return (
                          <div
                            key={installment.installmentNumber}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              installment.status === 'Ödendi'
                                ? 'bg-green-50 dark:bg-green-950/20 border-green-200'
                                : isOverdue
                                ? 'bg-red-50 dark:bg-red-950/20 border-red-200'
                                : 'bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {installment.status === 'Ödendi' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : isOverdue ? (
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              ) : (
                                <Clock className="h-5 w-5 text-yellow-500" />
                              )}
                              <div>
                                <p className="font-medium">
                                  {t('labels.installment')} {installment.installmentNumber}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(dueDate, 'dd/MM/yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(installment.amount)}</p>
                              {installment.lateFee && installment.lateFee > 0 && (
                                <p className="text-xs text-red-500">
                                  +{formatCurrency(installment.lateFee)}
                                </p>
                              )}
                              <Badge
                                variant={
                                  installment.status === 'Ödendi'
                                    ? 'default'
                                    : isOverdue
                                    ? 'destructive'
                                    : 'outline'
                                }
                                className="mt-1"
                              >
                                {installment.status === 'Ödendi'
                                  ? t('paymentStatus.paid')
                                  : isOverdue
                                  ? t('paymentStatus.overdue')
                                  : t('paymentStatus.pending')}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deletePayment.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.deletePayment.description', {
                amount: formatCurrency(paymentToDelete?.amount || 0),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('labels.deleteReason')}</Label>
              <Select value={deleteReason} onValueChange={setDeleteReason}>
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectReason')} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_DELETE_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {deleteReason === 'Diğer' && (
              <div className="space-y-2">
                <Label>{t('labels.customReason')}</Label>
                <Textarea
                  value={customDeleteReason}
                  onChange={(e) => setCustomDeleteReason(e.target.value)}
                  placeholder={t('placeholders.enterReason')}
                  rows={2}
                />
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-700">{t('warnings.deletePayment')}</p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting || !deleteReason}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
