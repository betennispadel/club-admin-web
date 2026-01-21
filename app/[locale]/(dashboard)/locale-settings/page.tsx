'use client';

import { useState, useEffect, useMemo } from 'react';
import { useClubStore } from '@/stores/clubStore';
import { useLocaleStore, LocaleConfig, DATE_FORMATS, CURRENCIES } from '@/stores/localeStore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Globe,
  Calendar,
  Clock,
  Banknote,
  Check,
  Save,
  Loader2,
  Eye,
  RefreshCw,
} from 'lucide-react';

// Timezone options
const TIMEZONES = [
  { value: 'Europe/Istanbul', label: 'Istanbul (UTC+3)', flag: '🇹🇷' },
  { value: 'Europe/London', label: 'London (UTC+0)', flag: '🇬🇧' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1)', flag: '🇫🇷' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1)', flag: '🇩🇪' },
  { value: 'America/New_York', label: 'New York (UTC-5)', flag: '🇺🇸' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)', flag: '🇺🇸' },
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)', flag: '🇦🇪' },
  { value: 'Asia/Riyadh', label: 'Riyadh (UTC+3)', flag: '🇸🇦' },
  { value: 'Europe/Moscow', label: 'Moscow (UTC+3)', flag: '🇷🇺' },
];

// Default config
const defaultConfig: LocaleConfig = {
  dateFormat: 'DD.MM.YYYY',
  timeFormat: '24h',
  currency: 'TRY',
  currencySymbol: '₺',
  numberFormat: 'comma',
  timezone: 'Europe/Istanbul',
};

export default function LocaleSettingsPage() {
  const { selectedClub } = useClubStore();
  const { setLocaleConfig: updateGlobalLocale } = useLocaleStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<LocaleConfig>(defaultConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<LocaleConfig>(defaultConfig);

  // Load locale config from Firebase
  useEffect(() => {
    const loadConfig = async () => {
      if (!selectedClub) return;

      setLoading(true);
      try {
        // Path: {clubId}/settings/settings/locale
        const localeDocRef = doc(db, selectedClub.id, 'settings', 'settings', 'locale');
        const docSnap = await getDoc(localeDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as LocaleConfig;
          const mergedConfig = { ...defaultConfig, ...data };
          setConfig(mergedConfig);
          setOriginalConfig(mergedConfig);
        } else {
          setConfig(defaultConfig);
          setOriginalConfig(defaultConfig);
        }
      } catch (error) {
        toast.error('Ayarlar yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [selectedClub]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasChanges(changed);
  }, [config, originalConfig]);

  // Save config to Firebase
  const handleSave = async () => {
    if (!selectedClub) {
      toast.error('Kulüp seçili değil');
      return;
    }

    setSaving(true);
    try {
      // Path: {clubId}/settings/settings/locale
      const localeDocRef = doc(db, selectedClub.id, 'settings', 'settings', 'locale');
      await setDoc(localeDocRef, config, { merge: true });

      // Update global locale store
      updateGlobalLocale(config);

      setOriginalConfig(config);
      setHasChanges(false);
      toast.success('Ayarlar başarıyla kaydedildi');
    } catch (error) {
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // Reset to original
  const handleReset = () => {
    setConfig(originalConfig);
  };

  // Update config helper
  const updateConfig = (updates: Partial<LocaleConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Format preview date
  const previewDate = useMemo(() => {
    return config.dateFormat
      .replace('DD', '31')
      .replace('MM', '12')
      .replace('YYYY', '2024');
  }, [config.dateFormat]);

  // Format preview time
  const previewTime = useMemo(() => {
    return config.timeFormat === '24h' ? '14:30' : '2:30 PM';
  }, [config.timeFormat]);

  // Format preview prices (small and large amounts)
  const previewPriceSmall = useMemo(() => {
    const amount = 1500; // Below 10,000 - no separator
    const decimalSep = config.numberFormat === 'comma' ? ',' : '.';
    const formatted = `${amount}${decimalSep}00`;
    if (config.currency === 'TRY') {
      return `${formatted} ${config.currencySymbol}`;
    }
    return `${config.currencySymbol}${formatted}`;
  }, [config.numberFormat, config.currencySymbol, config.currency]);

  const previewPriceLarge = useMemo(() => {
    const amount = 125000; // Above 10,000 - with separator
    const decimalSep = config.numberFormat === 'comma' ? ',' : '.';
    const thousandSep = config.numberFormat === 'comma' ? '.' : ',';
    const formatted = `125${thousandSep}000${decimalSep}00`;
    if (config.currency === 'TRY') {
      return `${formatted} ${config.currencySymbol}`;
    }
    return `${config.currencySymbol}${formatted}`;
  }, [config.numberFormat, config.currencySymbol, config.currency]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Ayarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-7 w-7" />
            Bölgesel Ayarlar
          </h1>
          <p className="text-muted-foreground">
            Tarih, saat ve para birimi formatlarını özelleştirin
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sıfırla
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Kaydet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date Format */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Tarih Formatı
                </CardTitle>
                <CardDescription>
                  Tarih gösterimini nasıl görmek istediğinizi seçin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DATE_FORMATS.map((format) => (
                    <button
                      key={format.value}
                      onClick={() => updateConfig({ dateFormat: format.value })}
                      className={cn(
                        "relative p-4 rounded-lg border-2 transition-all text-center",
                        config.dateFormat === format.value
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/50"
                      )}
                    >
                      <span className={cn(
                        "font-mono text-lg",
                        config.dateFormat === format.value && "text-primary font-semibold"
                      )}>
                        {format.label}
                      </span>
                      {config.dateFormat === format.value && (
                        <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Time Format */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  Saat Formatı
                </CardTitle>
                <CardDescription>
                  12 saat veya 24 saat formatını seçin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      {config.timeFormat === '24h' ? '24 Saat Formatı' : '12 Saat Formatı'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Örnek: {config.timeFormat === '24h' ? '14:30' : '2:30 PM'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-sm font-medium",
                      config.timeFormat === '12h' && "text-primary"
                    )}>
                      12h
                    </span>
                    <Switch
                      checked={config.timeFormat === '24h'}
                      onCheckedChange={(checked) =>
                        updateConfig({ timeFormat: checked ? '24h' : '12h' })
                      }
                    />
                    <span className={cn(
                      "text-sm font-medium",
                      config.timeFormat === '24h' && "text-primary"
                    )}>
                      24h
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Currency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-yellow-500" />
                  Para Birimi
                </CardTitle>
                <CardDescription>
                  Kullanılacak para birimini seçin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CURRENCIES.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() =>
                        updateConfig({
                          currency: currency.code,
                          currencySymbol: currency.symbol,
                        })
                      }
                      className={cn(
                        "relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                        config.currency === currency.code
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/50"
                      )}
                    >
                      <span className="text-2xl font-bold text-primary">
                        {currency.symbol}
                      </span>
                      <div className="text-left">
                        <p className={cn(
                          "font-semibold",
                          config.currency === currency.code && "text-primary"
                        )}>
                          {currency.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {currency.name}
                        </p>
                      </div>
                      {config.currency === currency.code && (
                        <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Timezone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-500" />
                  Saat Dilimi
                </CardTitle>
                <CardDescription>
                  Kulübünüzün bulunduğu saat dilimini seçin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TIMEZONES.map((tz) => (
                    <button
                      key={tz.value}
                      onClick={() => updateConfig({ timezone: tz.value })}
                      className={cn(
                        "relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                        config.timezone === tz.value
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/50"
                      )}
                    >
                      <span className="text-xl">{tz.flag}</span>
                      <span className={cn(
                        "text-sm",
                        config.timezone === tz.value && "text-primary font-medium"
                      )}>
                        {tz.label}
                      </span>
                      {config.timezone === tz.value && (
                        <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Number Format */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl font-mono">#</span>
                  Sayı Formatı
                </CardTitle>
                <CardDescription>
                  Sayıların nasıl gösterileceğini seçin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateConfig({ numberFormat: 'comma' })}
                    className={cn(
                      "relative p-4 rounded-lg border-2 transition-all text-center",
                      config.numberFormat === 'comma'
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                  >
                    <p className="font-mono text-lg mb-1">1.234,56</p>
                    <p className="text-sm text-muted-foreground">Virgül (Türkiye)</p>
                    {config.numberFormat === 'comma' && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => updateConfig({ numberFormat: 'dot' })}
                    className={cn(
                      "relative p-4 rounded-lg border-2 transition-all text-center",
                      config.numberFormat === 'dot'
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                  >
                    <p className="font-mono text-lg mb-1">1,234.56</p>
                    <p className="text-sm text-muted-foreground">Nokta (ABD/UK)</p>
                    {config.numberFormat === 'dot' && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="sticky top-24"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Önizleme
                </CardTitle>
                <CardDescription>
                  Ayarlarınızın nasıl görüneceğini görün
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Preview */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Tarih</span>
                  </div>
                  <p className="text-xl font-semibold font-mono">{previewDate}</p>
                </div>

                {/* Time Preview */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Saat</span>
                  </div>
                  <p className="text-xl font-semibold font-mono">{previewTime}</p>
                </div>

                {/* Price Preview - Small Amount */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Banknote className="h-4 w-4" />
                    <span>Fiyat (Küçük)</span>
                  </div>
                  <p className="text-xl font-semibold">{previewPriceSmall}</p>
                  <p className="text-xs text-muted-foreground">10.000 altı - ayraç yok</p>
                </div>

                {/* Price Preview - Large Amount */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Banknote className="h-4 w-4" />
                    <span>Fiyat (Büyük)</span>
                  </div>
                  <p className="text-xl font-semibold">{previewPriceLarge}</p>
                  <p className="text-xs text-muted-foreground">10.000 üstü - ayraç var</p>
                </div>

                <Separator />

                {/* Current Settings Summary */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Mevcut Ayarlar</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{config.dateFormat}</Badge>
                    <Badge variant="secondary">{config.timeFormat}</Badge>
                    <Badge variant="secondary">{config.currency}</Badge>
                    <Badge variant="secondary">
                      {config.numberFormat === 'comma' ? 'TR' : 'US'}
                    </Badge>
                  </div>
                </div>

                {hasChanges && (
                  <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                    Kaydedilmemiş değişiklikler var
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
