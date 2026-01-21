'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  CreditCard,
  Wallet,
  Globe,
  Shield,
  ChevronRight,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Settings,
  LayoutGrid,
  BookOpen,
  ExternalLink,
  Info,
  AlertTriangle,
  Layers,
} from 'lucide-react';

import type { ClubPaymentConfig } from '@/lib/types/pay-management';
import {
  getPaymentConfig,
  saveIyzicoConfig,
  saveParatikaConfig,
  saveWalletSettings,
} from '@/lib/firebase/pay-management';

import StripeSetupGuide from './components/StripeSetupGuide';
import IyzicoSetupGuide from './components/IyzicoSetupGuide';
import ParatikaSetupGuide from './components/ParatikaSetupGuide';

type TabType = 'overview' | 'stripe' | 'iyzico' | 'paratika' | 'wallet';

export default function PayManagementPage() {
  const t = useTranslations('payManagement');
  const { selectedClub } = useClubStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ClubPaymentConfig | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // iyzico form states
  const [iyzicoApiKey, setIyzicoApiKey] = useState('');
  const [iyzicoSecretKey, setIyzicoSecretKey] = useState('');
  const [showIyzicoSecretKey, setShowIyzicoSecretKey] = useState(false);
  const [iyzicoMerchantName, setIyzicoMerchantName] = useState('');
  const [iyzicoContactEmail, setIyzicoContactEmail] = useState('');
  const [iyzicoContactPhone, setIyzicoContactPhone] = useState('');
  const [iyzicoIban, setIyzicoIban] = useState('');
  const [iyzicoIdentityNumber, setIyzicoIdentityNumber] = useState('');
  const [iyzicoTaxOffice, setIyzicoTaxOffice] = useState('');
  const [iyzicoLegalCompanyTitle, setIyzicoLegalCompanyTitle] = useState('');
  const [iyzicoSubMerchantType, setIyzicoSubMerchantType] = useState<
    'PERSONAL' | 'PRIVATE_COMPANY' | 'LIMITED_OR_JOINT_STOCK_COMPANY'
  >('PRIVATE_COMPANY');
  const [iyzicoBaseUrl, setIyzicoBaseUrl] = useState<'sandbox' | 'production'>('sandbox');

  // Paratika form states
  const [paratikaMerchantCode, setParatikaMerchantCode] = useState('');
  const [paratikaMerchantUsername, setParatikaMerchantUsername] = useState('');
  const [paratikaMerchantPassword, setParatikaMerchantPassword] = useState('');
  const [showParatikaPassword, setShowParatikaPassword] = useState(false);
  const [paratikaTerminalId, setParatikaTerminalId] = useState('');
  const [paratikaPosnetId, setParatikaPosnetId] = useState('');
  const [paratikaMerchantName, setParatikaMerchantName] = useState('');
  const [paratikaContactEmail, setParatikaContactEmail] = useState('');
  const [paratikaContactPhone, setParatikaContactPhone] = useState('');
  const [paratikaIban, setParatikaIban] = useState('');
  const [paratikaTaxNumber, setParatikaTaxNumber] = useState('');
  const [paratikaTaxOffice, setParatikaTaxOffice] = useState('');
  const [paratikaLegalCompanyTitle, setParatikaLegalCompanyTitle] = useState('');
  const [paratikaBaseUrl, setParatikaBaseUrl] = useState<'test' | 'production'>('test');
  const [paratikaUse3DSecure, setParatikaUse3DSecure] = useState(true);
  const [paratikaStoreKey, setParatikaStoreKey] = useState('');
  const [paratikaInstallmentsEnabled, setParatikaInstallmentsEnabled] = useState(false);
  const [paratikaMaxInstallments, setParatikaMaxInstallments] = useState(1);

  // Wallet settings
  const [walletEnabled, setWalletEnabled] = useState(true);
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(true);
  const [defaultNegativeLimit, setDefaultNegativeLimit] = useState('500');

  // Guide visibility states
  const [showStripeGuide, setShowStripeGuide] = useState(false);
  const [showIyzicoGuide, setShowIyzicoGuide] = useState(false);
  const [showParatikaGuide, setShowParatikaGuide] = useState(false);

  useEffect(() => {
    if (selectedClub) {
      loadPaymentConfig();
    }
  }, [selectedClub]);

  const loadPaymentConfig = async () => {
    if (!selectedClub) return;

    setLoading(true);
    try {
      const data = await getPaymentConfig(selectedClub.id);
      if (data) {
        setConfig(data);
        populateFormStates(data);
      }
    } catch (error) {
      console.error('Error loading payment config:', error);
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const populateFormStates = (data: ClubPaymentConfig) => {
    // iyzico
    if (data.iyzico) {
      setIyzicoApiKey(data.iyzico.apiKey || '');
      setIyzicoSecretKey(data.iyzico.secretKey || '');
      setIyzicoMerchantName(data.iyzico.merchantName || '');
      setIyzicoContactEmail(data.iyzico.contactEmail || '');
      setIyzicoContactPhone(data.iyzico.contactPhone || '');
      setIyzicoIban(data.iyzico.iban || '');
      setIyzicoIdentityNumber(data.iyzico.identityNumber || '');
      setIyzicoTaxOffice(data.iyzico.taxOffice || '');
      setIyzicoLegalCompanyTitle(data.iyzico.legalCompanyTitle || '');
      setIyzicoSubMerchantType(data.iyzico.subMerchantType || 'PRIVATE_COMPANY');
      setIyzicoBaseUrl(data.iyzico.baseUrl || 'sandbox');
    }

    // Paratika
    if (data.paratika) {
      setParatikaMerchantCode(data.paratika.merchantCode || '');
      setParatikaMerchantUsername(data.paratika.merchantUsername || '');
      setParatikaMerchantPassword(data.paratika.merchantPassword || '');
      setParatikaTerminalId(data.paratika.terminalId || '');
      setParatikaPosnetId(data.paratika.posnetId || '');
      setParatikaMerchantName(data.paratika.merchantName || '');
      setParatikaContactEmail(data.paratika.contactEmail || '');
      setParatikaContactPhone(data.paratika.contactPhone || '');
      setParatikaIban(data.paratika.iban || '');
      setParatikaTaxNumber(data.paratika.taxNumber || '');
      setParatikaTaxOffice(data.paratika.taxOffice || '');
      setParatikaLegalCompanyTitle(data.paratika.legalCompanyTitle || '');
      setParatikaBaseUrl(data.paratika.baseUrl || 'test');
      setParatikaUse3DSecure(data.paratika.use3DSecure ?? true);
      setParatikaStoreKey(data.paratika.storeKey || '');
      setParatikaInstallmentsEnabled(data.paratika.installmentsEnabled ?? false);
      setParatikaMaxInstallments(data.paratika.maxInstallments || 1);
    }

    // Wallet
    setWalletEnabled(data.walletEnabled ?? true);
    setAllowNegativeBalance(data.allowNegativeBalance ?? true);
    setDefaultNegativeLimit(String(data.defaultNegativeBalanceLimit || 500));
  };

  const handleSaveIyzico = async () => {
    if (!selectedClub) return;

    if (!iyzicoApiKey || !iyzicoSecretKey) {
      toast.error(t('iyzico.errors.missingKeys'));
      return;
    }

    setSaving(true);
    try {
      await saveIyzicoConfig(selectedClub.id, {
        apiKey: iyzicoApiKey,
        secretKey: iyzicoSecretKey,
        baseUrl: iyzicoBaseUrl,
        subMerchantKey: config?.iyzico?.subMerchantKey || null,
        subMerchantType: iyzicoSubMerchantType,
        merchantName: iyzicoMerchantName,
        contactEmail: iyzicoContactEmail,
        contactPhone: iyzicoContactPhone,
        iban: iyzicoIban,
        identityNumber: iyzicoIdentityNumber,
        taxOffice: iyzicoTaxOffice,
        legalCompanyTitle: iyzicoLegalCompanyTitle,
      });
      toast.success(t('saveSuccess'));
      loadPaymentConfig();
    } catch (error) {
      console.error('Error saving iyzico config:', error);
      toast.error(t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveParatika = async () => {
    if (!selectedClub) return;

    if (!paratikaMerchantCode || !paratikaMerchantUsername || !paratikaMerchantPassword) {
      toast.error(t('paratika.errors.missingCredentials'));
      return;
    }

    setSaving(true);
    try {
      await saveParatikaConfig(selectedClub.id, {
        merchantCode: paratikaMerchantCode,
        merchantUsername: paratikaMerchantUsername,
        merchantPassword: paratikaMerchantPassword,
        baseUrl: paratikaBaseUrl,
        terminalId: paratikaTerminalId,
        posnetId: paratikaPosnetId,
        merchantName: paratikaMerchantName,
        contactEmail: paratikaContactEmail,
        contactPhone: paratikaContactPhone,
        iban: paratikaIban,
        taxNumber: paratikaTaxNumber,
        taxOffice: paratikaTaxOffice,
        legalCompanyTitle: paratikaLegalCompanyTitle,
        use3DSecure: paratikaUse3DSecure,
        storeKey: paratikaStoreKey,
        installmentsEnabled: paratikaInstallmentsEnabled,
        maxInstallments: paratikaMaxInstallments,
      });
      toast.success(t('saveSuccess'));
      loadPaymentConfig();
    } catch (error) {
      console.error('Error saving Paratika config:', error);
      toast.error(t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWallet = async () => {
    if (!selectedClub) return;

    setSaving(true);
    try {
      await saveWalletSettings(
        selectedClub.id,
        walletEnabled,
        allowNegativeBalance,
        parseInt(defaultNegativeLimit, 10) || 500
      );
      toast.success(t('saveSuccess'));
      loadPaymentConfig();
    } catch (error) {
      console.error('Error saving wallet settings:', error);
      toast.error(t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="stripe" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Stripe</span>
          </TabsTrigger>
          <TabsTrigger value="iyzico" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">iyzico</span>
          </TabsTrigger>
          <TabsTrigger value="paratika" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Paratika</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.wallet')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('overview.currentStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatusItem
                  label={t('wallet.title')}
                  active={walletEnabled}
                  activeText={t('common.active')}
                  inactiveText={t('common.inactive')}
                />
                <StatusItem
                  label="Stripe Connect"
                  active={config?.stripe?.enabled || false}
                  activeText={t('common.active')}
                  inactiveText={t('notConfigured')}
                />
                <StatusItem
                  label="iyzico"
                  active={config?.iyzico?.enabled || false}
                  activeText={t('common.active')}
                  inactiveText={t('notConfigured')}
                />
                <StatusItem
                  label="Paratika"
                  active={config?.paratika?.enabled || false}
                  activeText={t('common.active')}
                  inactiveText={t('notConfigured')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Provider Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Stripe Card */}
            <Card
              className="cursor-pointer hover:border-[#635BFF]/50 transition-colors border-l-4 border-l-[#635BFF]"
              onClick={() => setActiveTab('stripe')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#635BFF] flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Stripe Connect</h3>
                    <p className="text-sm text-muted-foreground">{t('stripe.description')}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        {t('international')}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        PCI DSS
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* iyzico Card */}
            <Card
              className="cursor-pointer hover:border-[#1D64C7]/50 transition-colors border-l-4 border-l-[#1D64C7]"
              onClick={() => setActiveTab('iyzico')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#1D64C7] flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">iyzico</h3>
                    <p className="text-sm text-muted-foreground">{t('iyzico.description')}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
                        {t('turkeyOnly')}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        3D Secure
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Paratika Card */}
            <Card
              className="cursor-pointer hover:border-[#E31E24]/50 transition-colors border-l-4 border-l-[#E31E24]"
              onClick={() => setActiveTab('paratika')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#E31E24] flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Paratika</h3>
                    <p className="text-sm text-muted-foreground">{t('paratika.description')}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
                        {t('turkeyOnly')}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        3D Secure
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Layers className="h-3 w-3 mr-1" />
                        {t('paratika.installments')}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Wallet Card */}
            <Card
              className="cursor-pointer hover:border-green-500/50 transition-colors border-l-4 border-l-green-500"
              onClick={() => setActiveTab('wallet')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{t('wallet.title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('wallet.description')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Non-Custodial Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Info className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">{t('nonCustodial.title')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('nonCustodial.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stripe Tab */}
        <TabsContent value="stripe" className="space-y-6">
          {/* Header */}
          <div className="rounded-lg bg-[#635BFF] p-6 text-white text-center">
            <CreditCard className="h-10 w-10 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">Stripe Connect</h2>
            <p className="text-white/80 mt-1">{t('stripe.subtitle')}</p>
          </div>

          {/* Guide Button */}
          <Button
            variant="outline"
            className="w-full border-[#635BFF] text-[#635BFF] hover:bg-[#635BFF]/10"
            onClick={() => setShowStripeGuide(true)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {t('guides.openGuide', { provider: 'Stripe' })}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>

          {/* Connection Status */}
          <Card>
            <CardContent className="p-8 text-center">
              {config?.stripe?.onboardingCompleted ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="text-lg font-semibold">{t('stripe.connected')}</span>
                  </div>
                  <p className="text-muted-foreground">
                    Account: {config.stripe.accountId}
                  </p>
                  <div className="flex justify-center gap-6">
                    <div className="flex items-center gap-2">
                      {config.stripe.chargesEnabled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">{t('stripe.chargesEnabled')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.stripe.payoutsEnabled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">{t('stripe.payoutsEnabled')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="font-medium">{t('stripe.notConnected')}</p>
                  <p className="text-sm text-muted-foreground">{t('stripe.notConnectedDesc')}</p>
                  <Button
                    className="bg-[#635BFF] hover:bg-[#635BFF]/90"
                    onClick={() => window.open('https://stripe.com/connect', '_blank')}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {t('stripe.connectAccount')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Shield className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-700 dark:text-green-400">
                    {t('stripe.securityTitle')}
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    {t('stripe.securityDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* iyzico Tab */}
        <TabsContent value="iyzico" className="space-y-6">
          {/* Header */}
          <div className="rounded-lg bg-[#1D64C7] p-6 text-white text-center">
            <Wallet className="h-10 w-10 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">iyzico</h2>
            <p className="text-white/80 mt-1">{t('iyzico.subtitle')}</p>
          </div>

          {/* Guide Button */}
          <Button
            variant="outline"
            className="w-full border-[#1D64C7] text-[#1D64C7] hover:bg-[#1D64C7]/10"
            onClick={() => setShowIyzicoGuide(true)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {t('guides.openGuide', { provider: 'iyzico' })}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>

          {/* Turkey Only Warning */}
          <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <span className="text-2xl">🇹🇷</span>
                <div>
                  <h4 className="font-semibold text-orange-700 dark:text-orange-400">
                    {t('iyzico.turkeyOnlyTitle')}
                  </h4>
                  <p className="text-sm text-orange-600 dark:text-orange-500">
                    {t('iyzico.turkeyOnlyDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>{t('iyzico.environment')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={iyzicoBaseUrl === 'sandbox' ? 'default' : 'outline'}
                  className={iyzicoBaseUrl === 'sandbox' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                  onClick={() => setIyzicoBaseUrl('sandbox')}
                >
                  Sandbox
                </Button>
                <Button
                  variant={iyzicoBaseUrl === 'production' ? 'default' : 'outline'}
                  className={iyzicoBaseUrl === 'production' ? 'bg-green-500 hover:bg-green-600' : ''}
                  onClick={() => setIyzicoBaseUrl('production')}
                >
                  Production
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Credentials */}
          <Card>
            <CardHeader>
              <CardTitle>{t('iyzico.apiCredentials')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Key *</Label>
                <Input
                  value={iyzicoApiKey}
                  onChange={(e) => setIyzicoApiKey(e.target.value)}
                  placeholder={t('iyzico.apiKeyPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label>Secret Key *</Label>
                <div className="relative">
                  <Input
                    type={showIyzicoSecretKey ? 'text' : 'password'}
                    value={iyzicoSecretKey}
                    onChange={(e) => setIyzicoSecretKey(e.target.value)}
                    placeholder={t('iyzico.secretKeyPlaceholder')}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowIyzicoSecretKey(!showIyzicoSecretKey)}
                  >
                    {showIyzicoSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sub-merchant Type */}
          <Card>
            <CardHeader>
              <CardTitle>{t('iyzico.subMerchantType')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { value: 'PERSONAL', label: t('iyzico.personal') },
                  { value: 'PRIVATE_COMPANY', label: t('iyzico.privateCompany') },
                  { value: 'LIMITED_OR_JOINT_STOCK_COMPANY', label: t('iyzico.limitedCompany') },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      iyzicoSubMerchantType === type.value
                        ? 'border-[#1D64C7] bg-[#1D64C7]/10'
                        : 'border-border hover:border-[#1D64C7]/50'
                    }`}
                    onClick={() => setIyzicoSubMerchantType(type.value as typeof iyzicoSubMerchantType)}
                  >
                    <span className={iyzicoSubMerchantType === type.value ? 'text-[#1D64C7] font-medium' : ''}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('iyzico.businessInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('iyzico.merchantName')} *</Label>
                  <Input
                    value={iyzicoMerchantName}
                    onChange={(e) => setIyzicoMerchantName(e.target.value)}
                    placeholder={t('iyzico.merchantNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('iyzico.contactEmail')} *</Label>
                  <Input
                    type="email"
                    value={iyzicoContactEmail}
                    onChange={(e) => setIyzicoContactEmail(e.target.value)}
                    placeholder="ornek@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('iyzico.contactPhone')} *</Label>
                  <Input
                    value={iyzicoContactPhone}
                    onChange={(e) => setIyzicoContactPhone(e.target.value)}
                    placeholder="+905551234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IBAN *</Label>
                  <Input
                    value={iyzicoIban}
                    onChange={(e) => setIyzicoIban(e.target.value.toUpperCase())}
                    placeholder="TR..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {iyzicoSubMerchantType === 'PERSONAL' ? t('iyzico.tcIdentity') : t('iyzico.taxNumber')} *
                  </Label>
                  <Input
                    value={iyzicoIdentityNumber}
                    onChange={(e) => setIyzicoIdentityNumber(e.target.value)}
                    placeholder={iyzicoSubMerchantType === 'PERSONAL' ? '12345678901' : '1234567890'}
                  />
                </div>
                {iyzicoSubMerchantType !== 'PERSONAL' && (
                  <>
                    <div className="space-y-2">
                      <Label>{t('iyzico.taxOffice')}</Label>
                      <Input
                        value={iyzicoTaxOffice}
                        onChange={(e) => setIyzicoTaxOffice(e.target.value)}
                        placeholder={t('iyzico.taxOfficePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>{t('iyzico.legalCompanyTitle')}</Label>
                      <Input
                        value={iyzicoLegalCompanyTitle}
                        onChange={(e) => setIyzicoLegalCompanyTitle(e.target.value)}
                        placeholder={t('iyzico.legalCompanyTitlePlaceholder')}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            className="w-full bg-[#1D64C7] hover:bg-[#1D64C7]/90"
            onClick={handleSaveIyzico}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('saveConfig')}
          </Button>
        </TabsContent>

        {/* Paratika Tab */}
        <TabsContent value="paratika" className="space-y-6">
          {/* Header */}
          <div className="rounded-lg bg-[#E31E24] p-6 text-white text-center">
            <CreditCard className="h-10 w-10 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">Paratika</h2>
            <p className="text-white/80 mt-1">{t('paratika.subtitle')}</p>
          </div>

          {/* Guide Button */}
          <Button
            variant="outline"
            className="w-full border-[#E31E24] text-[#E31E24] hover:bg-[#E31E24]/10"
            onClick={() => setShowParatikaGuide(true)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {t('guides.openGuide', { provider: 'Paratika' })}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>

          {/* Turkey Only Warning */}
          <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <span className="text-2xl">🇹🇷</span>
                <div>
                  <h4 className="font-semibold text-orange-700 dark:text-orange-400">
                    {t('paratika.turkeyOnlyTitle')}
                  </h4>
                  <p className="text-sm text-orange-600 dark:text-orange-500">
                    {t('paratika.turkeyOnlyDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>{t('paratika.environment')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={paratikaBaseUrl === 'test' ? 'default' : 'outline'}
                  className={paratikaBaseUrl === 'test' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                  onClick={() => setParatikaBaseUrl('test')}
                >
                  Test
                </Button>
                <Button
                  variant={paratikaBaseUrl === 'production' ? 'default' : 'outline'}
                  className={paratikaBaseUrl === 'production' ? 'bg-green-500 hover:bg-green-600' : ''}
                  onClick={() => setParatikaBaseUrl('production')}
                >
                  Production
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Credentials */}
          <Card>
            <CardHeader>
              <CardTitle>{t('paratika.apiCredentials')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('paratika.merchantCode')} *</Label>
                  <Input
                    value={paratikaMerchantCode}
                    onChange={(e) => setParatikaMerchantCode(e.target.value)}
                    placeholder={t('paratika.merchantCodePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('paratika.merchantUsername')} *</Label>
                  <Input
                    value={paratikaMerchantUsername}
                    onChange={(e) => setParatikaMerchantUsername(e.target.value)}
                    placeholder={t('paratika.merchantUsernamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('paratika.merchantPassword')} *</Label>
                  <div className="relative">
                    <Input
                      type={showParatikaPassword ? 'text' : 'password'}
                      value={paratikaMerchantPassword}
                      onChange={(e) => setParatikaMerchantPassword(e.target.value)}
                      placeholder={t('paratika.merchantPasswordPlaceholder')}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowParatikaPassword(!showParatikaPassword)}
                    >
                      {showParatikaPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('paratika.terminalId')} *</Label>
                  <Input
                    value={paratikaTerminalId}
                    onChange={(e) => setParatikaTerminalId(e.target.value)}
                    placeholder={t('paratika.terminalIdPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('paratika.posnetId')}</Label>
                  <Input
                    value={paratikaPosnetId}
                    onChange={(e) => setParatikaPosnetId(e.target.value)}
                    placeholder={t('paratika.posnetIdPlaceholder')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('paratika.securitySettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Shield className={`h-5 w-5 ${paratikaUse3DSecure ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <div>
                    <Label className="cursor-pointer">{t('paratika.use3DSecure')}</Label>
                    <p className="text-sm text-muted-foreground">{t('paratika.use3DSecureDesc')}</p>
                  </div>
                </div>
                <Switch checked={paratikaUse3DSecure} onCheckedChange={setParatikaUse3DSecure} />
              </div>

              {paratikaUse3DSecure && (
                <div className="space-y-2">
                  <Label>{t('paratika.storeKey')}</Label>
                  <Input
                    value={paratikaStoreKey}
                    onChange={(e) => setParatikaStoreKey(e.target.value)}
                    placeholder={t('paratika.storeKeyPlaceholder')}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Installment Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('paratika.installmentSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Layers className={`h-5 w-5 ${paratikaInstallmentsEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <Label className="cursor-pointer">{t('paratika.enableInstallments')}</Label>
                    <p className="text-sm text-muted-foreground">{t('paratika.enableInstallmentsDesc')}</p>
                  </div>
                </div>
                <Switch checked={paratikaInstallmentsEnabled} onCheckedChange={setParatikaInstallmentsEnabled} />
              </div>

              {paratikaInstallmentsEnabled && (
                <div className="space-y-2">
                  <Label>{t('paratika.maxInstallments')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 6, 9, 12].map((num) => (
                      <Button
                        key={num}
                        type="button"
                        variant={paratikaMaxInstallments === num ? 'default' : 'outline'}
                        className={paratikaMaxInstallments === num ? 'bg-[#E31E24] hover:bg-[#E31E24]/90' : ''}
                        onClick={() => setParatikaMaxInstallments(num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('paratika.businessInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('paratika.merchantName')} *</Label>
                  <Input
                    value={paratikaMerchantName}
                    onChange={(e) => setParatikaMerchantName(e.target.value)}
                    placeholder={t('paratika.merchantNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('paratika.contactEmail')} *</Label>
                  <Input
                    type="email"
                    value={paratikaContactEmail}
                    onChange={(e) => setParatikaContactEmail(e.target.value)}
                    placeholder="ornek@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('paratika.contactPhone')} *</Label>
                  <Input
                    value={paratikaContactPhone}
                    onChange={(e) => setParatikaContactPhone(e.target.value)}
                    placeholder="+905551234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IBAN *</Label>
                  <Input
                    value={paratikaIban}
                    onChange={(e) => setParatikaIban(e.target.value.toUpperCase())}
                    placeholder="TR..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('paratika.taxNumber')} *</Label>
                  <Input
                    value={paratikaTaxNumber}
                    onChange={(e) => setParatikaTaxNumber(e.target.value)}
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('paratika.taxOffice')} *</Label>
                  <Input
                    value={paratikaTaxOffice}
                    onChange={(e) => setParatikaTaxOffice(e.target.value)}
                    placeholder={t('paratika.taxOfficePlaceholder')}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{t('paratika.legalCompanyTitle')}</Label>
                  <Input
                    value={paratikaLegalCompanyTitle}
                    onChange={(e) => setParatikaLegalCompanyTitle(e.target.value)}
                    placeholder={t('paratika.legalCompanyTitlePlaceholder')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            className="w-full bg-[#E31E24] hover:bg-[#E31E24]/90"
            onClick={handleSaveParatika}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('saveConfig')}
          </Button>

          {/* Security Info */}
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Shield className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-700 dark:text-green-400">
                    {t('paratika.securityTitle')}
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    {t('paratika.securityDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="space-y-6">
          {/* Header */}
          <div className="rounded-lg bg-green-500 p-6 text-white text-center">
            <Wallet className="h-10 w-10 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">{t('wallet.title')}</h2>
            <p className="text-white/80 mt-1">{t('wallet.subtitle')}</p>
          </div>

          {/* Wallet Settings */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">{t('wallet.enableWallet')}</Label>
                  <p className="text-sm text-muted-foreground">{t('wallet.enableWalletDesc')}</p>
                </div>
                <Switch checked={walletEnabled} onCheckedChange={setWalletEnabled} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">{t('wallet.allowNegative')}</Label>
                  <p className="text-sm text-muted-foreground">{t('wallet.allowNegativeDesc')}</p>
                </div>
                <Switch checked={allowNegativeBalance} onCheckedChange={setAllowNegativeBalance} />
              </div>

              {allowNegativeBalance && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>{t('wallet.defaultNegativeLimit')}</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{config?.walletCurrency === 'TRY' ? '₺' : '$'}</span>
                      <Input
                        type="number"
                        value={defaultNegativeLimit}
                        onChange={(e) => setDefaultNegativeLimit(e.target.value)}
                        placeholder="500"
                        className="max-w-[200px]"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            className="w-full bg-green-500 hover:bg-green-600"
            onClick={handleSaveWallet}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('saveConfig')}
          </Button>

          {/* Non-Custodial Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Info className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">{t('wallet.nonCustodialTitle')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('wallet.nonCustodialDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Guide Dialogs */}
      <StripeSetupGuide open={showStripeGuide} onOpenChange={setShowStripeGuide} />
      <IyzicoSetupGuide open={showIyzicoGuide} onOpenChange={setShowIyzicoGuide} />
      <ParatikaSetupGuide open={showParatikaGuide} onOpenChange={setShowParatikaGuide} />
    </div>
  );
}

// Status Item Component
function StatusItem({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-3 h-3 rounded-full ${active ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className={`text-xs ${active ? 'text-green-600' : 'text-muted-foreground'}`}>
          {active ? activeText : inactiveText}
        </p>
      </div>
    </div>
  );
}
