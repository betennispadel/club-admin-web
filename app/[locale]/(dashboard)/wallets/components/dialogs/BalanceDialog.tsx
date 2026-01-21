'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, PlusCircle, MinusCircle, Wallet } from 'lucide-react';

import type { UserWallet, BalanceOperationType } from '@/lib/types/wallets';
import { addBalance, setNegativeLimit } from '@/lib/firebase/wallets';

interface BalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: UserWallet | null;
  onSuccess: () => void;
}

export default function BalanceDialog({
  open,
  onOpenChange,
  wallet,
  onSuccess,
}: BalanceDialogProps) {
  const t = useTranslations('wallets');
  const { selectedClub } = useClubStore();
  const { currentUser } = useAuthStore();

  const [operationType, setOperationType] = useState<BalanceOperationType>('add');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedClub || !wallet || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error(t('errors.invalidAmount'));
      return;
    }

    setLoading(true);
    try {
      if (operationType === 'add') {
        await addBalance(selectedClub.id, wallet.id, numAmount, currentUser?.email || 'Admin');
        toast.success(t('messages.balanceAdded'));
      } else {
        await setNegativeLimit(selectedClub.id, wallet.id, numAmount, currentUser?.email || 'Admin');
        toast.success(t('messages.limitSet'));
      }
      setAmount('');
      onSuccess();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error(t('errors.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setOperationType('add');
      onOpenChange(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  if (!wallet) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t('dialogs.balance.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dialogs.balance.description', { name: wallet.name })}
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

        <Tabs value={operationType} onValueChange={(v) => setOperationType(v as BalanceOperationType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              {t('dialogs.balance.addBalance')}
            </TabsTrigger>
            <TabsTrigger value="setNegativeLimit" className="flex items-center gap-2">
              <MinusCircle className="h-4 w-4" />
              {t('dialogs.balance.setLimit')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="addAmount">{t('labels.amount')}</Label>
              <Input
                id="addAmount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </TabsContent>

          <TabsContent value="setNegativeLimit" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="limitAmount">{t('labels.negativeLimit')}</Label>
              <Input
                id="limitAmount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                {t('dialogs.balance.limitHint')}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !amount}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {operationType === 'add' ? t('actions.addBalance') : t('actions.setLimit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
