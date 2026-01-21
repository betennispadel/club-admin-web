'use client';

import { useState, useEffect } from 'react';
import { useClubStore } from '@/stores/clubStore';
import { ApiKey } from '@/lib/types';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';
import {
  Key,
  Plus,
  Download,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  Cloud,
  Bot,
  Sparkles,
  Mic,
  RefreshCw,
  Shield,
  AlertTriangle,
} from 'lucide-react';

// Provider options with icons
const PROVIDERS = [
  { value: 'OpenWeatherMap', label: 'OpenWeatherMap', icon: Cloud, color: 'text-blue-500' },
  { value: 'OpenAI', label: 'OpenAI', icon: Bot, color: 'text-green-500' },
  { value: 'Google', label: 'Google Gemini', icon: Sparkles, color: 'text-purple-500' },
  { value: 'Google Cloud', label: 'Google Cloud', icon: Mic, color: 'text-yellow-500' },
  { value: 'Other', label: 'Diğer', icon: Key, color: 'text-gray-500' },
];

// Default API keys template
const DEFAULT_API_KEYS = [
  {
    name: 'OpenWeatherMap API',
    key: '',
    provider: 'OpenWeatherMap',
    description: 'Hava durumu verileri için API anahtarı',
  },
  {
    name: 'OpenAI API',
    key: '',
    provider: 'OpenAI',
    description: 'AI metin üretimi ve TTS için API anahtarı',
  },
  {
    name: 'Google Gemini API',
    key: '',
    provider: 'Google',
    description: 'Gemini AI modeli için API anahtarı',
  },
  {
    name: 'Google Cloud Speech API',
    key: '',
    provider: 'Google Cloud',
    description: 'Konuşmadan metine dönüştürme için API anahtarı',
  },
];

// Form data interface
interface ApiKeyFormData {
  name: string;
  key: string;
  provider: string;
  description: string;
}

const initialFormData: ApiKeyFormData = {
  name: '',
  key: '',
  provider: '',
  description: '',
};

export default function ApiKeysPage() {
  const { selectedClub } = useClubStore();

  // State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null);
  const [formData, setFormData] = useState<ApiKeyFormData>(initialFormData);

  // Visibility states
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load API keys
  useEffect(() => {
    if (selectedClub) {
      loadApiKeys();
    }
  }, [selectedClub]);

  const loadApiKeys = async () => {
    if (!selectedClub) return;

    setLoading(true);
    try {
      const apiKeysRef = collection(db, selectedClub.id, 'apiKeys', 'apiKeys');
      const snapshot = await getDocs(apiKeysRef);
      const keys = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ApiKey[];
      setApiKeys(keys);
    } catch (error) {
      toast.error('API anahtarları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Load default API keys
  const loadDefaultApiKeys = async () => {
    if (!selectedClub) return;

    setSaving(true);
    try {
      const apiKeysRef = collection(db, selectedClub.id, 'apiKeys', 'apiKeys');

      const promises = DEFAULT_API_KEYS.map(async (apiKey, index) => {
        const id = `api_${apiKey.provider.toLowerCase().replace(/\s+/g, '_')}_${index}`;
        const keyData = {
          name: apiKey.name,
          key: apiKey.key,
          provider: apiKey.provider,
          description: apiKey.description,
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await setDoc(doc(apiKeysRef, id), keyData);
      });

      await Promise.all(promises);
      await loadApiKeys();
      toast.success('Varsayılan API anahtarları yüklendi');
    } catch (error) {
      toast.error('Varsayılan API anahtarları yüklenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // Save API key (create or update)
  const saveApiKey = async () => {
    if (!selectedClub) return;
    if (!formData.name || !formData.key || !formData.provider) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      const apiKeysRef = collection(db, selectedClub.id, 'apiKeys', 'apiKeys');
      const keyData = {
        name: formData.name,
        key: formData.key,
        provider: formData.provider,
        description: formData.description,
        isActive: true,
        updatedAt: Timestamp.now(),
        ...(editingKey ? {} : { createdAt: Timestamp.now() }),
      };

      if (editingKey) {
        await updateDoc(doc(apiKeysRef, editingKey.id), keyData);
        toast.success('API anahtarı güncellendi');
      } else {
        const id = `api_${Date.now()}`;
        await setDoc(doc(apiKeysRef, id), keyData);
        toast.success('API anahtarı eklendi');
      }

      await loadApiKeys();
      closeForm();
    } catch (error) {
      toast.error('API anahtarı kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // Delete API key
  const deleteApiKey = async () => {
    if (!selectedClub || !deletingKey) return;

    setSaving(true);
    try {
      const apiKeysRef = collection(db, selectedClub.id, 'apiKeys', 'apiKeys');
      await deleteDoc(doc(apiKeysRef, deletingKey.id));
      await loadApiKeys();
      toast.success('API anahtarı silindi');
      setIsDeleteOpen(false);
      setDeletingKey(null);
    } catch (error) {
      toast.error('API anahtarı silinirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // Toggle API key status
  const toggleApiKeyStatus = async (apiKey: ApiKey) => {
    if (!selectedClub) return;

    try {
      const apiKeysRef = collection(db, selectedClub.id, 'apiKeys', 'apiKeys');
      await updateDoc(doc(apiKeysRef, apiKey.id), {
        isActive: !apiKey.isActive,
        updatedAt: Timestamp.now(),
      });
      await loadApiKeys();
      toast.success(`API anahtarı ${!apiKey.isActive ? 'aktif' : 'pasif'} edildi`);
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  // Open edit form
  const openEditForm = (apiKey: ApiKey) => {
    setEditingKey(apiKey);
    setFormData({
      name: apiKey.name,
      key: apiKey.key,
      provider: apiKey.provider,
      description: apiKey.description || '',
    });
    setIsFormOpen(true);
  };

  // Open new form
  const openNewForm = () => {
    setEditingKey(null);
    setFormData(initialFormData);
    setIsFormOpen(true);
  };

  // Close form
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingKey(null);
    setFormData(initialFormData);
  };

  // Toggle key visibility
  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  // Copy key to clipboard
  const copyToClipboard = async (key: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(keyId);
      toast.success('API anahtarı kopyalandı');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Kopyalama başarısız');
    }
  };

  // Mask API key
  const maskApiKey = (key: string, isVisible: boolean) => {
    if (isVisible) return key;
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  // Get provider icon
  const getProviderIcon = (provider: string) => {
    const found = PROVIDERS.find(p => p.value.toLowerCase() === provider.toLowerCase());
    return found || PROVIDERS[PROVIDERS.length - 1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">API anahtarları yükleniyor...</p>
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
            <Key className="h-7 w-7" />
            API Anahtar Yönetimi
          </h1>
          <p className="text-muted-foreground">
            Uygulamanızın API anahtarlarını güvenli bir şekilde yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDefaultApiKeys} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Varsayılan Anahtarları Yükle
          </Button>
          <Button onClick={openNewForm}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Anahtar Ekle
          </Button>
        </div>
      </div>

      {/* Security Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">Güvenlik Uyarısı</p>
            <p className="text-sm text-yellow-700">
              API anahtarlarınızı güvende tutun ve asla herkese açık yerlerde paylaşmayın.
              Anahtarlar Firebase'de şifrelenmiş olarak saklanır.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Key className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">API Anahtarı Bulunamadı</h3>
            <p className="text-muted-foreground text-center mb-6">
              Henüz API anahtarı eklenmemiş. Varsayılan anahtarları yükleyebilir
              <br />veya manuel olarak yeni anahtar ekleyebilirsiniz.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadDefaultApiKeys}>
                <Download className="h-4 w-4 mr-2" />
                Varsayılanları Yükle
              </Button>
              <Button onClick={openNewForm}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Ekle
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence>
            {apiKeys.map((apiKey, index) => {
              const providerInfo = getProviderIcon(apiKey.provider);
              const ProviderIcon = providerInfo.icon;
              const isVisible = visibleKeys.has(apiKey.id);
              const isCopied = copiedKey === apiKey.id;

              return (
                <motion.div
                  key={apiKey.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={cn(
                    "transition-all hover:shadow-md",
                    !apiKey.isActive && "opacity-60"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg bg-muted",
                            providerInfo.color
                          )}>
                            <ProviderIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{apiKey.name}</CardTitle>
                            <CardDescription>{apiKey.provider}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={apiKey.isActive ? "default" : "secondary"}
                            className={cn(
                              apiKey.isActive
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : "bg-gray-100 text-gray-500"
                            )}
                          >
                            {apiKey.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                          <Switch
                            checked={apiKey.isActive}
                            onCheckedChange={() => toggleApiKeyStatus(apiKey)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* API Key Value */}
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
                          {maskApiKey(apiKey.key, isVisible)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {isVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                        >
                          {isCopied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Description */}
                      {apiKey.description && (
                        <p className="text-sm text-muted-foreground">
                          {apiKey.description}
                        </p>
                      )}

                      {/* Actions */}
                      <Separator />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(apiKey)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Düzenle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setDeletingKey(apiKey);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Sil
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingKey ? (
                <>
                  <Pencil className="h-5 w-5" />
                  API Anahtarını Düzenle
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Yeni API Anahtarı Ekle
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              API anahtarı bilgilerini girin. Tüm alanlar zorunludur.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">API Adı *</Label>
              <Input
                id="name"
                placeholder="Örn: OpenAI API"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label htmlFor="provider">Sağlayıcı *</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sağlayıcı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((provider) => {
                    const Icon = provider.icon;
                    return (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", provider.color)} />
                          {provider.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="key">API Anahtarı *</Label>
              <Input
                id="key"
                type="password"
                placeholder="API anahtarını girin"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Bu API anahtarının kullanım amacı"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              İptal
            </Button>
            <Button onClick={saveApiKey} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {editingKey ? 'Güncelle' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>API Anahtarını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deletingKey?.name}</strong> API anahtarını silmek istediğinizden
              emin misiniz? Bu işlem geri alınamaz ve bu anahtarı kullanan servisler
              çalışmayı durduracaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteApiKey}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
