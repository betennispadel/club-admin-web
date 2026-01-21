'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  Wallet,
  Search,
  Plus,
  ArrowLeftRight,
  MoreVertical,
  Lock,
  Unlock,
  Trash2,
  RotateCcw,
  History,
  PlusCircle,
  MinusCircle,
  Users,
  Ban,
  CheckCircle,
  Settings,
  Loader2,
  RefreshCw,
  ChevronDown,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

// Types
import type { UserWallet, WalletStats, WalletFilter, WalletUser, Court, WalletGlobalSettings } from '@/lib/types/wallets';

// Firebase
import {
  subscribeToWallets,
  fetchUsersMap,
  fetchCourtsMap,
  createWallet,
  addBalance,
  setNegativeLimit,
  toggleWalletBlock,
  deleteWallet,
  resetWallet,
  fetchGlobalSettings,
  updateGlobalSettings,
} from '@/lib/firebase/wallets';

// Dialogs
import BalanceDialog from './components/dialogs/BalanceDialog';
import TransferDialog from './components/dialogs/TransferDialog';
import TransactionHistoryDialog from './components/dialogs/TransactionHistoryDialog';
import CreateWalletDialog from './components/dialogs/CreateWalletDialog';

export default function WalletsPage() {
  const t = useTranslations('wallets');
  const { selectedClub } = useClubStore();
  const { currentUser } = useAuthStore();

  // Data states
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [stats, setStats] = useState<WalletStats>({
    totalWallets: 0,
    activeWallets: 0,
    blockedWallets: 0,
    totalBalance: 0,
    totalNegativeLimit: 0,
  });
  const [usersMap, setUsersMap] = useState<Map<string, WalletUser>>(new Map());
  const [courtsMap, setCourtsMap] = useState<Map<string, Court>>(new Map());
  const [globalSettings, setGlobalSettings] = useState<WalletGlobalSettings>({
    transferDisabled: false,
    addBalanceDisabled: false,
    payDisabled: false,
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<WalletFilter>('all');
  const [showSettings, setShowSettings] = useState(false);

  // Selected wallet
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);

  // Dialog states
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Confirmation dialogs
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Loading states
  const [isBlocking, setIsBlocking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  }, []);

  // Fetch initial data
  useEffect(() => {
    if (!selectedClub) return;

    const loadInitialData = async () => {
      try {
        const [users, courts, settings] = await Promise.all([
          fetchUsersMap(selectedClub.id),
          fetchCourtsMap(selectedClub.id),
          fetchGlobalSettings(selectedClub.id),
        ]);

        setUsersMap(users);
        setCourtsMap(courts);
        setGlobalSettings(settings);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error(t('errors.fetchFailed'));
      }
    };

    loadInitialData();
  }, [selectedClub, t]);

  // Subscribe to wallets
  useEffect(() => {
    if (!selectedClub || usersMap.size === 0) return;

    setLoading(true);

    const unsubscribe = subscribeToWallets(
      selectedClub.id,
      usersMap,
      (walletsList, walletStats) => {
        setWallets(walletsList);
        setStats(walletStats);
        setLoading(false);
      },
      (error) => {
        console.error('Error subscribing to wallets:', error);
        toast.error(t('errors.fetchFailed'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedClub, usersMap, t]);

  // Filter wallets
  const filteredWallets = useMemo(() => {
    let result = wallets;

    // Apply status filter
    if (filter === 'active') {
      result = result.filter((w) => !w.isBlocked);
    } else if (filter === 'blocked') {
      result = result.filter((w) => w.isBlocked);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.userName?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [wallets, filter, searchQuery]);

  // Handle block/unblock
  const handleBlockToggle = async () => {
    if (!selectedClub || !selectedWallet) return;

    setIsBlocking(true);
    try {
      await toggleWalletBlock(
        selectedClub.id,
        selectedWallet.id,
        !selectedWallet.isBlocked,
        currentUser?.email || 'Admin'
      );
      toast.success(
        selectedWallet.isBlocked ? t('messages.walletUnblocked') : t('messages.walletBlocked')
      );
      setBlockDialogOpen(false);
    } catch (error) {
      console.error('Error toggling block:', error);
      toast.error(t('errors.blockFailed'));
    } finally {
      setIsBlocking(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedClub || !selectedWallet) return;

    setIsDeleting(true);
    try {
      await deleteWallet(selectedClub.id, selectedWallet.id);
      toast.success(t('messages.walletDeleted'));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast.error(t('errors.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle reset
  const handleReset = async () => {
    if (!selectedClub || !selectedWallet) return;

    setIsResetting(true);
    try {
      await resetWallet(selectedClub.id, selectedWallet.id, currentUser?.email || 'Admin');
      toast.success(t('messages.walletReset'));
      setResetDialogOpen(false);
    } catch (error) {
      console.error('Error resetting wallet:', error);
      toast.error(t('errors.resetFailed'));
    } finally {
      setIsResetting(false);
    }
  };

  // Handle global setting toggle
  const handleGlobalSettingToggle = async (setting: 'transfer' | 'addBalance' | 'pay') => {
    if (!selectedClub) return;

    const newValue = !globalSettings[`${setting}Disabled` as keyof WalletGlobalSettings];

    try {
      await updateGlobalSettings(selectedClub.id, setting, newValue);
      setGlobalSettings((prev) => ({
        ...prev,
        [`${setting}Disabled`]: newValue,
      }));
      toast.success(t('messages.settingsUpdated'));
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(t('errors.settingsFailed'));
    }
  };

  // Wallet card actions
  const openBalanceDialog = (wallet: UserWallet) => {
    setSelectedWallet(wallet);
    setBalanceDialogOpen(true);
  };

  const openHistoryDialog = (wallet: UserWallet) => {
    setSelectedWallet(wallet);
    setHistoryDialogOpen(true);
  };

  const openBlockDialog = (wallet: UserWallet) => {
    setSelectedWallet(wallet);
    setBlockDialogOpen(true);
  };

  const openDeleteDialog = (wallet: UserWallet) => {
    setSelectedWallet(wallet);
    setDeleteDialogOpen(true);
  };

  const openResetDialog = (wallet: UserWallet) => {
    setSelectedWallet(wallet);
    setResetDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('actions.createWallet')}
          </Button>
          <Button variant="outline" onClick={() => setTransferDialogOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            {t('actions.transfer')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('stats.total')}</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalWallets}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">{t('stats.active')}</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.activeWallets}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">{t('stats.blocked')}</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.blockedWallets}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">{t('stats.totalBalance')}</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalBalance)}</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MinusCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">{t('stats.negativeLimit')}</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.totalNegativeLimit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(['all', 'active', 'blocked'] as WalletFilter[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {t(`filters.${f}`)}
              </Button>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-4 w-4 mr-2" />
          {t('actions.settings')}
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Global Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('settings.title')}</CardTitle>
            <CardDescription>{t('settings.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.transfer')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.transferDesc')}</p>
                </div>
                <Switch
                  checked={!globalSettings.transferDisabled}
                  onCheckedChange={() => handleGlobalSettingToggle('transfer')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.addBalance')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.addBalanceDesc')}</p>
                </div>
                <Switch
                  checked={!globalSettings.addBalanceDisabled}
                  onCheckedChange={() => handleGlobalSettingToggle('addBalance')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.pay')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.payDesc')}</p>
                </div>
                <Switch
                  checked={!globalSettings.payDisabled}
                  onCheckedChange={() => handleGlobalSettingToggle('pay')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWallets.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t('empty.title')}</h3>
            <p className="text-muted-foreground">{t('empty.description')}</p>
          </div>
        ) : (
          filteredWallets.map((wallet) => (
            <Card
              key={wallet.id}
              className={`relative ${wallet.isBlocked ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{wallet.name}</h3>
                      <p className="text-sm text-muted-foreground">@{wallet.userName}</p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openBalanceDialog(wallet)}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        {t('actions.addBalance')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openHistoryDialog(wallet)}>
                        <History className="h-4 w-4 mr-2" />
                        {t('actions.viewHistory')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openResetDialog(wallet)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {t('actions.reset')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openBlockDialog(wallet)}>
                        {wallet.isBlocked ? (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            {t('actions.unblock')}
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            {t('actions.block')}
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(wallet)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('labels.balance')}</p>
                    <p className={`text-lg font-bold ${wallet.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(wallet.balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('labels.negativeLimit')}</p>
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrency(wallet.negativeBalance)}
                    </p>
                  </div>
                </div>

                {wallet.isBlocked && (
                  <Badge variant="destructive" className="mt-4">
                    <Lock className="h-3 w-3 mr-1" />
                    {t('status.blocked')}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      <BalanceDialog
        open={balanceDialogOpen}
        onOpenChange={setBalanceDialogOpen}
        wallet={selectedWallet}
        onSuccess={() => setBalanceDialogOpen(false)}
      />

      <TransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        onSuccess={() => setTransferDialogOpen(false)}
      />

      <TransactionHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        wallet={selectedWallet}
        onSuccess={() => {}}
      />

      <CreateWalletDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => setCreateDialogOpen(false)}
      />

      {/* Block Confirmation Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedWallet?.isBlocked ? t('dialogs.unblock.title') : t('dialogs.block.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedWallet?.isBlocked
                ? t('dialogs.unblock.description', { name: selectedWallet?.name || '' })
                : t('dialogs.block.description', { name: selectedWallet?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlocking}>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockToggle} disabled={isBlocking}>
              {isBlocking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedWallet?.isBlocked ? t('actions.unblock') : t('actions.block')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.delete.description', { name: selectedWallet?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.reset.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.reset.description', { name: selectedWallet?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} disabled={isResetting}>
              {isResetting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('actions.reset')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
