'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
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
import { Loader2, Wallet, Search, User, CheckCircle2 } from 'lucide-react';

import type { WalletUser } from '@/lib/types/wallets';
import { createWallet, fetchUsersWithoutWallet } from '@/lib/firebase/wallets';

interface CreateWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateWalletDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWalletDialogProps) {
  const t = useTranslations('wallets');
  const { selectedClub } = useClubStore();

  const [users, setUsers] = useState<WalletUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<WalletUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<WalletUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [initialBalance, setInitialBalance] = useState('0');

  useEffect(() => {
    if (open && selectedClub) {
      loadUsersWithoutWallet();
    }
  }, [open, selectedClub]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter((user) => {
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
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsersWithoutWallet = async () => {
    if (!selectedClub) return;

    setLoadingUsers(true);
    try {
      const usersWithoutWallet = await fetchUsersWithoutWallet(selectedClub.id);
      setUsers(usersWithoutWallet);
      setFilteredUsers(usersWithoutWallet);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('errors.loadUsersFailed'));
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClub || !selectedUser) return;

    const balance = parseFloat(initialBalance) || 0;

    setLoading(true);
    try {
      await createWallet(selectedClub.id, selectedUser.id, selectedUser.username, balance);
      toast.success(t('messages.walletCreated'));
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      toast.error(error.message || t('errors.createWalletFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSelectedUser(null);
    setInitialBalance('0');
    setUsers([]);
    setFilteredUsers([]);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSelectUser = (user: WalletUser) => {
    setSelectedUser(user);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t('dialogs.create.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dialogs.create.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Users */}
          <div className="space-y-2">
            <Label>{t('labels.selectUser')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('placeholders.searchUsers')}
                className="pl-9"
              />
            </div>
          </div>

          {/* Selected User Preview */}
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">{selectedUser.username}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="text-red-600 hover:text-red-700"
              >
                {t('actions.remove')}
              </Button>
            </div>
          )}

          {/* User List */}
          {!selectedUser && (
            <ScrollArea className="h-[200px] border rounded-md">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <User className="h-8 w-8 mb-2" />
                  <p className="text-sm">{t('labels.noUsersWithoutWallet')}</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {/* Initial Balance */}
          <div className="space-y-2">
            <Label htmlFor="initialBalance">{t('labels.initialBalance')}</Label>
            <Input
              id="initialBalance"
              type="number"
              min="0"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              {t('dialogs.create.initialBalanceHint')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedUser}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('actions.createWallet')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
