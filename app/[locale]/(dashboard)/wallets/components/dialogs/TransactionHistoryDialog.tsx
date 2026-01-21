'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  History,
  Undo2,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Banknote,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';

import type { UserWallet, Transaction } from '@/lib/types/wallets';
import { fetchTransactionHistory, undoTransaction } from '@/lib/firebase/wallets';

interface TransactionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: UserWallet | null;
  onSuccess: () => void;
}

export default function TransactionHistoryDialog({
  open,
  onOpenChange,
  wallet,
  onSuccess,
}: TransactionHistoryDialogProps) {
  const t = useTranslations('wallets');
  const { selectedClub } = useClubStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [undoConfirmOpen, setUndoConfirmOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    if (open && wallet && selectedClub) {
      loadTransactions();
    }
  }, [open, wallet, selectedClub]);

  const loadTransactions = async () => {
    if (!selectedClub || !wallet) return;

    setLoading(true);
    try {
      const history = await fetchTransactionHistory(selectedClub.id, wallet.userId);
      setTransactions(history);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error(t('errors.loadTransactionsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleUndoClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setUndoConfirmOpen(true);
  };

  const handleConfirmUndo = async () => {
    if (!selectedClub || !wallet || !selectedTransaction) return;

    setUndoing(true);
    try {
      await undoTransaction(selectedClub.id, wallet.id, wallet.userId, selectedTransaction);
      toast.success(t('messages.transactionUndone'));
      await loadTransactions();
      onSuccess();
    } catch (error: any) {
      console.error('Error undoing transaction:', error);
      toast.error(error.message || t('errors.undoFailed'));
    } finally {
      setUndoing(false);
      setUndoConfirmOpen(false);
      setSelectedTransaction(null);
    }
  };

  const handleClose = () => {
    if (!loading && !undoing) {
      setTransactions([]);
      onOpenChange(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (timestamp: Timestamp | undefined | null): { date: string; time: string } => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return { date: '-', time: '-' };
    }
    try {
      const d = timestamp.toDate();
      return {
        date: d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      return { date: '-', time: '-' };
    }
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.isGift) {
      return <Gift className="h-5 w-5 text-purple-600" />;
    }
    if (transaction.type === 'reservation') {
      return <Calendar className="h-5 w-5 text-blue-600" />;
    }
    if (transaction.type === 'transfer') {
      return transaction.amount > 0 ? (
        <ArrowDownLeft className="h-5 w-5 text-green-600" />
      ) : (
        <ArrowUpRight className="h-5 w-5 text-red-600" />
      );
    }
    if (transaction.type === 'activity') {
      return transaction.amount > 0 ? (
        <Banknote className="h-5 w-5 text-green-600" />
      ) : (
        <CreditCard className="h-5 w-5 text-orange-600" />
      );
    }
    return <Banknote className="h-5 w-5 text-gray-600" />;
  };

  if (!wallet) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t('dialogs.history.title')}
            </DialogTitle>
            <DialogDescription>
              {t('dialogs.history.description', { name: wallet.name })}
            </DialogDescription>
          </DialogHeader>

          {/* Wallet Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('labels.currentBalance')}</span>
              <span className={`font-bold ${wallet.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(wallet.balance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('labels.negativeLimit')}</span>
              <span className="font-bold text-orange-600">
                {formatCurrency(wallet.negativeBalance)}
              </span>
            </div>
          </div>

          {/* Transaction List */}
          <ScrollArea className="h-[350px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mb-2" />
                <p>{t('labels.noTransactions')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const { date, time } = formatDate(transaction.date);
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getTransactionIcon(transaction)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm truncate">
                              {transaction.description}
                            </p>
                            {transaction.details && (
                              <p className="text-xs text-muted-foreground truncate">
                                {transaction.details}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {date} {time}
                              </span>
                              {transaction.status && (
                                <Badge variant="outline" className="text-xs">
                                  {transaction.status}
                                </Badge>
                              )}
                            </div>

                            {/* Discount info */}
                            {transaction.discountApplied && (
                              <p className="text-xs text-green-600 mt-1">
                                {t('labels.discount')}: %{transaction.discountPercentage} ({formatCurrency(transaction.discountAmount || 0)})
                              </p>
                            )}

                            {/* Coupon info */}
                            {transaction.couponApplied && (
                              <p className="text-xs text-purple-600 mt-1">
                                {t('labels.coupon')}: {transaction.couponCode} ({formatCurrency(transaction.couponDiscountAmount || 0)})
                              </p>
                            )}

                            {/* Gift info */}
                            {transaction.isGift && transaction.giftMessage && (
                              <p className="text-xs text-purple-600 mt-1 italic">
                                "{transaction.giftMessage}"
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`font-bold text-sm ${
                                transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {transaction.amount >= 0 ? '+' : ''}
                              {formatCurrency(transaction.amount)}
                            </span>

                            {transaction.isUndoable && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => handleUndoClick(transaction)}
                              >
                                <Undo2 className="h-3 w-3 mr-1" />
                                {t('actions.undo')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading || undoing}>
              {t('actions.close')}
            </Button>
            <Button onClick={loadTransactions} disabled={loading || undoing}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('actions.refresh')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Undo Confirmation Dialog */}
      <AlertDialog open={undoConfirmOpen} onOpenChange={setUndoConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              {t('dialogs.undoConfirm.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.undoConfirm.description')}
              {selectedTransaction && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="font-medium">{selectedTransaction.description}</p>
                  <p className="text-sm">
                    {t('labels.amount')}: {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={undoing}>
              {t('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUndo}
              disabled={undoing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {undoing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('actions.confirmUndo')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
