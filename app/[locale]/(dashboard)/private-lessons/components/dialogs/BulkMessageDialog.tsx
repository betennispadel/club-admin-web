'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Loader2,
  Users,
  Search,
  ArrowRight,
  ArrowLeft,
  Check,
  Filter,
  Mail,
  CreditCard,
  Calendar,
  Snowflake,
  BookOpen,
  X,
} from 'lucide-react';

import type { StudentOption, Coach, Lesson } from '@/lib/types/private-lessons';

// Filter types and options
type FilterType =
  | 'all'
  | 'payment_overdue'
  | 'payment_upcoming'
  | 'payment_ok'
  | 'package_new'
  | 'package_half'
  | 'package_ending'
  | 'package_completed'
  | 'account_frozen'
  | 'lessons_low'
  | 'lessons_high';

interface FilterOption {
  value: FilterType;
  category: 'general' | 'payment' | 'package' | 'account' | 'lesson';
  icon: React.ReactNode;
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', category: 'general', icon: <Users className="h-4 w-4" /> },
  { value: 'payment_overdue', category: 'payment', icon: <CreditCard className="h-4 w-4 text-red-500" /> },
  { value: 'payment_upcoming', category: 'payment', icon: <Calendar className="h-4 w-4 text-yellow-500" /> },
  { value: 'payment_ok', category: 'payment', icon: <Check className="h-4 w-4 text-green-500" /> },
  { value: 'package_new', category: 'package', icon: <BookOpen className="h-4 w-4 text-blue-500" /> },
  { value: 'package_half', category: 'package', icon: <BookOpen className="h-4 w-4 text-yellow-500" /> },
  { value: 'package_ending', category: 'package', icon: <BookOpen className="h-4 w-4 text-orange-500" /> },
  { value: 'package_completed', category: 'package', icon: <BookOpen className="h-4 w-4 text-green-500" /> },
  { value: 'account_frozen', category: 'account', icon: <Snowflake className="h-4 w-4 text-blue-500" /> },
  { value: 'lessons_low', category: 'lesson', icon: <BookOpen className="h-4 w-4 text-red-500" /> },
  { value: 'lessons_high', category: 'lesson', icon: <BookOpen className="h-4 w-4 text-green-500" /> },
];

// Message templates
const MESSAGE_TEMPLATES = [
  'welcome',
  'payment_reminder',
  'lesson_info',
  'package_info',
  'holiday_notification',
  'custom',
];

interface BulkMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: (StudentOption | Coach)[];
  recipientType: 'students' | 'coaches';
  lessons?: Lesson[];
  onSuccess?: () => void;
}

export default function BulkMessageDialog({
  open,
  onOpenChange,
  recipients,
  recipientType,
  lessons = [],
  onSuccess,
}: BulkMessageDialogProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();
  const { currentUser } = useAuthStore();

  // State
  const [step, setStep] = useState<'filter' | 'select' | 'compose'>('filter');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Apply filter to recipients
  const applyFilter = (items: (StudentOption | Coach)[], filter: FilterType): (StudentOption | Coach)[] => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'all':
        return items;

      case 'payment_overdue':
        return items.filter((item) => {
          if ('remainingAmount' in item) {
            return (item.remainingAmount || 0) > 0 && (item as any).paymentStatus === 'Gecikmiş';
          }
          return false;
        });

      case 'payment_upcoming':
        return items.filter((item) => {
          if ('nextPaymentDate' in item && item.nextPaymentDate) {
            const nextDate = typeof (item.nextPaymentDate as any).toDate === 'function'
              ? (item.nextPaymentDate as any).toDate()
              : new Date(item.nextPaymentDate as any);
            return nextDate >= now && nextDate <= sevenDaysFromNow;
          }
          return false;
        });

      case 'payment_ok':
        return items.filter((item) => {
          if ('remainingAmount' in item) {
            return (item.remainingAmount || 0) <= 0;
          }
          return false;
        });

      case 'package_new':
        return items.filter((item) => {
          if ('addedDate' in item && item.addedDate) {
            const addedDate = typeof (item.addedDate as any).toDate === 'function'
              ? (item.addedDate as any).toDate()
              : new Date(item.addedDate as any);
            return addedDate >= sevenDaysAgo;
          }
          return false;
        });

      case 'account_frozen':
        return items.filter((item) => {
          if ('playerStatus' in item) {
            return item.playerStatus !== 'Aktif';
          }
          return false;
        });

      default:
        return items;
    }
  };

  // Filtered and searched recipients
  const filteredRecipients = useMemo(() => {
    let filtered = applyFilter(recipients, selectedFilter);
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(lowerSearch));
    }
    return filtered;
  }, [recipients, selectedFilter, searchQuery]);

  // Filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<FilterType, number> = {} as Record<FilterType, number>;
    FILTER_OPTIONS.forEach((filter) => {
      counts[filter.value] = applyFilter(recipients, filter.value).length;
    });
    return counts;
  }, [recipients]);

  // Apply template
  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId !== 'custom') {
      setSubject(t(`bulkMessage.templates.${templateId}.subject`));
      setContent(t(`bulkMessage.templates.${templateId}.content`));
    } else {
      setSubject('');
      setContent('');
    }
  };

  // Toggle recipient selection
  const toggleRecipient = (id: string) => {
    const newSelection = new Set(selectedRecipients);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRecipients(newSelection);
  };

  // Select/deselect all
  const selectAll = () => {
    setSelectedRecipients(new Set(filteredRecipients.map((r) => r.id)));
  };

  const deselectAll = () => {
    setSelectedRecipients(new Set());
  };

  // Send messages
  const handleSend = async () => {
    if (selectedRecipients.size === 0) {
      toast.error(t('bulkMessage.errors.selectRecipient'));
      return;
    }

    if (!subject.trim() || !content.trim()) {
      toast.error(t('messages.enterSubjectAndContent'));
      return;
    }

    if (!selectedClub) {
      toast.error(t('errors.noPermission'));
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const messagesRef = collection(db, selectedClub.id, 'messages', 'messages');

      const selectedItems = recipients.filter((r) => selectedRecipients.has(r.id));

      for (const recipient of selectedItems) {
        // Replace placeholders in content
        let personalizedContent = content
          .replace(/{name}/g, recipient.name)
          .replace(/{email}/g, recipient.email || '');

        if ('remainingAmount' in recipient) {
          personalizedContent = personalizedContent
            .replace(/{remainingAmount}/g, String(recipient.remainingAmount || 0))
            .replace(/{totalPaid}/g, String((recipient as StudentOption).totalPaid || 0));
        }

        const msgRef = doc(messagesRef);
        batch.set(msgRef, {
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientEmail: recipient.email || '',
          subject: subject.trim(),
          content: personalizedContent.trim(),
          sentBy: currentUser?.email || currentUser?.uid || 'Admin',
          sentAt: serverTimestamp(),
          read: false,
          type: 'bulk',
          bulkFilter: selectedFilter,
        });
      }

      await batch.commit();

      toast.success(t('bulkMessage.success', { count: selectedRecipients.size }));
      resetAndClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      toast.error(t('errors.messageSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Reset and close
  const resetAndClose = () => {
    setStep('filter');
    setSelectedFilter('all');
    setSelectedRecipients(new Set());
    setSearchQuery('');
    setSelectedTemplate(null);
    setSubject('');
    setContent('');
    onOpenChange(false);
  };

  // Auto-select when filter changes
  const handleFilterChange = (filter: FilterType) => {
    setSelectedFilter(filter);
    if (filter !== 'all') {
      const filtered = applyFilter(recipients, filter);
      setSelectedRecipients(new Set(filtered.map((r) => r.id)));
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general': return t('bulkMessage.categories.general');
      case 'payment': return t('bulkMessage.categories.payment');
      case 'package': return t('bulkMessage.categories.package');
      case 'account': return t('bulkMessage.categories.account');
      case 'lesson': return t('bulkMessage.categories.lesson');
      default: return category;
    }
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {step === 'filter' && t('bulkMessage.selectFilter')}
            {step === 'select' && t('bulkMessage.selectRecipients')}
            {step === 'compose' && t('bulkMessage.composeMessage')}
          </DialogTitle>
          <DialogDescription>
            {step === 'filter' && t('bulkMessage.filterDescription')}
            {step === 'select' && t('bulkMessage.selectDescription', { count: filteredRecipients.length })}
            {step === 'compose' && t('bulkMessage.composeDescription', { count: selectedRecipients.size })}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Filter Selection */}
        {step === 'filter' && (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {['general', 'payment', 'package', 'account', 'lesson'].map((category) => {
                const categoryFilters = FILTER_OPTIONS.filter((f) => f.category === category);
                if (categoryFilters.length === 0) return null;

                return (
                  <div key={category}>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="h-1 w-4 bg-primary rounded" />
                      {getCategoryLabel(category)}
                    </h4>
                    <div className="space-y-2">
                      {categoryFilters.map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => handleFilterChange(filter.value)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            selectedFilter === filter.value
                              ? 'bg-primary/10 border-primary'
                              : 'bg-background hover:bg-muted/50 border-border'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {filter.icon}
                            <div className="text-left">
                              <p className="font-medium text-sm">
                                {t(`bulkMessage.filters.${filter.value}.label`)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t(`bulkMessage.filters.${filter.value}.description`)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{filterCounts[filter.value]}</Badge>
                            {selectedFilter === filter.value && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Step 2: Recipient Selection */}
        {step === 'select' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={recipientType === 'students' ? t('search.students') : t('search.coaches')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selection controls */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedRecipients.size} / {filteredRecipients.length} {t('bulkMessage.selected')}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {t('bulkMessage.selectAll')}
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  {t('bulkMessage.clear')}
                </Button>
              </div>
            </div>

            {/* Recipients list */}
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredRecipients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {recipientType === 'students' ? t('empty.students') : t('empty.coaches')}
                  </p>
                ) : (
                  filteredRecipients.map((recipient) => (
                    <button
                      key={recipient.id}
                      onClick={() => toggleRecipient(recipient.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedRecipients.has(recipient.id)
                          ? 'bg-primary/10'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedRecipients.has(recipient.id)}
                        onCheckedChange={() => toggleRecipient(recipient.id)}
                      />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{recipient.name}</p>
                        {recipient.email && (
                          <p className="text-xs text-muted-foreground">{recipient.email}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Step 3: Compose Message */}
        {step === 'compose' && (
          <div className="space-y-4">
            {/* Recipients summary */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm">
                {t('bulkMessage.willSendTo', { count: selectedRecipients.size })}
              </p>
            </div>

            {/* Templates */}
            <div className="space-y-2">
              <Label>{t('bulkMessage.messageTemplate')}</Label>
              <div className="flex flex-wrap gap-2">
                {MESSAGE_TEMPLATES.map((templateId) => (
                  <Badge
                    key={templateId}
                    variant={selectedTemplate === templateId ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => applyTemplate(templateId)}
                  >
                    {t(`bulkMessage.templates.${templateId}.title`)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="bulk-subject">{t('dialogs.message.subject')} *</Label>
              <Input
                id="bulk-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('placeholders.subject')}
                disabled={loading}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="bulk-content">{t('dialogs.message.content')} *</Label>
              <Textarea
                id="bulk-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('placeholders.messageContent')}
                rows={6}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {t('bulkMessage.placeholderHint')}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === 'filter' && (
            <>
              <Button variant="outline" onClick={resetAndClose}>
                {t('actions.cancel')}
              </Button>
              <Button onClick={() => setStep('select')}>
                {t('bulkMessage.next')} ({filteredRecipients.length})
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === 'select' && (
            <>
              <Button variant="outline" onClick={() => setStep('filter')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('actions.back')}
              </Button>
              <Button
                onClick={() => setStep('compose')}
                disabled={selectedRecipients.size === 0}
              >
                {t('bulkMessage.next')} ({selectedRecipients.size})
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === 'compose' && (
            <>
              <Button variant="outline" onClick={() => setStep('select')} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('actions.back')}
              </Button>
              <Button
                onClick={handleSend}
                disabled={!subject.trim() || !content.trim() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('actions.sending')}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t('actions.send')}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
