'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
import { Send, Loader2, User } from 'lucide-react';

interface MessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientId: string;
  onSuccess?: () => void;
}

export default function MessageDialog({
  open,
  onOpenChange,
  recipientName,
  recipientId,
  onSuccess,
}: MessageDialogProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();
  const { currentUser } = useAuthStore();

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error(t('messages.enterSubjectAndContent'));
      return;
    }

    if (!selectedClub || !recipientId) {
      toast.error(t('errors.noPermission'));
      return;
    }

    setLoading(true);
    try {
      // Save message to Firestore
      const messagesRef = collection(db, selectedClub.id, 'messages', 'messages');
      await addDoc(messagesRef, {
        recipientId,
        recipientName,
        subject: subject.trim(),
        content: content.trim(),
        sentBy: currentUser?.email || currentUser?.uid || 'Admin',
        sentAt: serverTimestamp(),
        read: false,
        type: 'individual',
      });

      toast.success(t('messages.messageSent'));
      setSubject('');
      setContent('');
      onSuccess?.();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('errors.messageSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSubject('');
      setContent('');
      onOpenChange(false);
    }
  };

  const isValid = subject.trim() && content.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t('dialogs.message.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dialogs.message.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('dialogs.message.recipient')}</p>
              <p className="font-medium">{recipientName}</p>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">{t('dialogs.message.subject')} *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('placeholders.subject')}
              disabled={loading}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">{t('dialogs.message.content')} *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('placeholders.messageContent')}
              rows={6}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSend} disabled={!isValid || loading}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
