'use client';

import { useState, useEffect, useRef } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ArrowRightLeft, CheckCircle2, User, X } from 'lucide-react';

import type { WalletUser, UserWallet } from '@/lib/types/wallets';
import { fetchUsersMap, adminTransfer, subscribeToWallets } from '@/lib/firebase/wallets';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function TransferDialog({
  open,
  onOpenChange,
  onSuccess,
}: TransferDialogProps) {
  const t = useTranslations('wallets');
  const { selectedClub } = useClubStore();
  const { currentUser } = useAuthStore();

  // Users and wallets data
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [wallets, setWallets] = useState<Map<string, UserWallet>>(new Map());
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Sender state
  const [senderQuery, setSenderQuery] = useState('');
  const [selectedSender, setSelectedSender] = useState<WalletUser | null>(null);
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const [filteredSenders, setFilteredSenders] = useState<WalletUser[]>([]);
  const senderInputRef = useRef<HTMLInputElement>(null);

  // Receiver state
  const [receiverQuery, setReceiverQuery] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState<WalletUser | null>(null);
  const [showReceiverDropdown, setShowReceiverDropdown] = useState(false);
  const [filteredReceivers, setFilteredReceivers] = useState<WalletUser[]>([]);
  const receiverInputRef = useRef<HTMLInputElement>(null);

  // Amount and loading
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Load users when dialog opens
  useEffect(() => {
    if (open && selectedClub) {
      loadUsers();
    }
  }, [open, selectedClub]);

  const loadUsers = async () => {
    if (!selectedClub) return;

    setLoadingUsers(true);
    try {
      const usersMap = await fetchUsersMap(selectedClub.id);
      const usersList = Array.from(usersMap.values());
      setUsers(usersList);

      // Subscribe to wallets to get balance info
      const unsubscribe = subscribeToWallets(
        selectedClub.id,
        usersMap,
        (walletsList) => {
          const walletsMap = new Map<string, UserWallet>();
          walletsList.forEach((wallet) => {
            walletsMap.set(wallet.userId, wallet);
          });
          setWallets(walletsMap);
        },
        (error) => {
          console.error('Error fetching wallets:', error);
        }
      );

      // Store unsubscribe for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Get wallet balance for a user
  const getWalletBalance = (userId: string): number | null => {
    const wallet = wallets.get(userId);
    return wallet ? wallet.balance : null;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  // Filter senders based on query
  useEffect(() => {
    if (!senderQuery.trim()) {
      setFilteredSenders([]);
      return;
    }

    const query = senderQuery.toLowerCase();
    const filtered = users.filter((user) => {
      // Exclude already selected receiver
      if (selectedReceiver && user.id === selectedReceiver.id) return false;

      const username = (user.username || '').toLowerCase();
      const firstName = (user.firstName || '').toLowerCase();
      const lastName = (user.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.toLowerCase();

      return (
        username.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query) ||
        fullName.includes(query)
      );
    });

    setFilteredSenders(filtered.slice(0, 10));
  }, [senderQuery, users, selectedReceiver]);

  // Filter receivers based on query
  useEffect(() => {
    if (!receiverQuery.trim()) {
      setFilteredReceivers([]);
      return;
    }

    const query = receiverQuery.toLowerCase();
    const filtered = users.filter((user) => {
      // Exclude already selected sender
      if (selectedSender && user.id === selectedSender.id) return false;

      const username = (user.username || '').toLowerCase();
      const firstName = (user.firstName || '').toLowerCase();
      const lastName = (user.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.toLowerCase();

      return (
        username.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query) ||
        fullName.includes(query)
      );
    });

    setFilteredReceivers(filtered.slice(0, 10));
  }, [receiverQuery, users, selectedSender]);

  const handleSelectSender = (user: WalletUser) => {
    setSelectedSender(user);
    setSenderQuery('');
    setShowSenderDropdown(false);
  };

  const handleSelectReceiver = (user: WalletUser) => {
    setSelectedReceiver(user);
    setReceiverQuery('');
    setShowReceiverDropdown(false);
  };

  const handleClearSender = () => {
    setSelectedSender(null);
    setSenderQuery('');
    senderInputRef.current?.focus();
  };

  const handleClearReceiver = () => {
    setSelectedReceiver(null);
    setReceiverQuery('');
    receiverInputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!selectedClub) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error(t('errors.invalidAmount'));
      return;
    }

    if (!selectedSender) {
      toast.error(t('errors.senderNotFound'));
      return;
    }

    if (!selectedReceiver) {
      toast.error(t('errors.receiverNotFound'));
      return;
    }

    if (selectedSender.id === selectedReceiver.id) {
      toast.error(t('errors.sameUser'));
      return;
    }

    setLoading(true);
    try {
      await adminTransfer(
        selectedClub.id,
        selectedSender.id, // walletId = odacinId
        selectedReceiver.id,
        selectedSender.id, // userId
        selectedReceiver.id,
        selectedSender.username,
        selectedReceiver.username,
        numAmount,
        currentUser?.email || 'Admin'
      );
      toast.success(t('messages.transferCompleted'));
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('Error transferring:', error);
      toast.error(error.message || t('errors.transferFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSenderQuery('');
    setReceiverQuery('');
    setSelectedSender(null);
    setSelectedReceiver(null);
    setAmount('');
    setShowSenderDropdown(false);
    setShowReceiverDropdown(false);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onOpenChange(false);
    }
  };

  const isFormValid = selectedSender && selectedReceiver && amount.trim().length > 0 && parseFloat(amount) > 0;

  const UserDropdownItem = ({ user, onSelect }: { user: WalletUser; onSelect: () => void }) => {
    const balance = getWalletBalance(user.id);
    return (
      <button
        type="button"
        onClick={onSelect}
        className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <User className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">@{user.username}</p>
          <p className="text-xs text-muted-foreground truncate">
            {user.firstName} {user.lastName}
          </p>
        </div>
        {balance !== null && (
          <div className={`text-sm font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </div>
        )}
      </button>
    );
  };

  const SelectedUserBadge = ({ user, onClear, label }: { user: WalletUser; onClear: () => void; label?: string }) => {
    const balance = getWalletBalance(user.id);
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">@{user.username}</p>
          <p className="text-xs text-muted-foreground truncate">
            {user.firstName} {user.lastName}
          </p>
          {balance !== null && (
            <p className={`text-sm font-bold mt-1 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {t('labels.balance')}: {formatCurrency(balance)}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-red-600"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            {t('dialogs.transfer.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dialogs.transfer.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sender Selection */}
          <div className="space-y-2">
            <Label>{t('labels.senderUsername')}</Label>
            {selectedSender ? (
              <SelectedUserBadge user={selectedSender} onClear={handleClearSender} />
            ) : (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={senderInputRef}
                  value={senderQuery}
                  onChange={(e) => {
                    setSenderQuery(e.target.value);
                    setShowSenderDropdown(true);
                  }}
                  onFocus={() => setShowSenderDropdown(true)}
                  placeholder={t('placeholders.searchUsers')}
                  className="pl-9"
                  autoComplete="off"
                />
                {loadingUsers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {/* Sender Dropdown */}
                {showSenderDropdown && senderQuery.trim() && filteredSenders.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                    <ScrollArea className="max-h-[200px]">
                      <div className="p-1">
                        {filteredSenders.map((user) => (
                          <UserDropdownItem
                            key={user.id}
                            user={user}
                            onSelect={() => handleSelectSender(user)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {showSenderDropdown && senderQuery.trim() && filteredSenders.length === 0 && !loadingUsers && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground">
                    {t('errors.userNotFound')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Arrow indicator */}
          <div className="flex justify-center">
            <div className="p-2 rounded-full bg-muted">
              <ArrowRightLeft className="h-5 w-5 text-muted-foreground rotate-90" />
            </div>
          </div>

          {/* Receiver Selection */}
          <div className="space-y-2">
            <Label>{t('labels.receiverUsername')}</Label>
            {selectedReceiver ? (
              <SelectedUserBadge user={selectedReceiver} onClear={handleClearReceiver} />
            ) : (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={receiverInputRef}
                  value={receiverQuery}
                  onChange={(e) => {
                    setReceiverQuery(e.target.value);
                    setShowReceiverDropdown(true);
                  }}
                  onFocus={() => setShowReceiverDropdown(true)}
                  placeholder={t('placeholders.searchUsers')}
                  className="pl-9"
                  autoComplete="off"
                />
                {loadingUsers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {/* Receiver Dropdown */}
                {showReceiverDropdown && receiverQuery.trim() && filteredReceivers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                    <ScrollArea className="max-h-[200px]">
                      <div className="p-1">
                        {filteredReceivers.map((user) => (
                          <UserDropdownItem
                            key={user.id}
                            user={user}
                            onSelect={() => handleSelectReceiver(user)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {showReceiverDropdown && receiverQuery.trim() && filteredReceivers.length === 0 && !loadingUsers && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground">
                    {t('errors.userNotFound')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="transferAmount">{t('labels.amount')}</Label>
            <Input
              id="transferAmount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !isFormValid}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('actions.transfer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
