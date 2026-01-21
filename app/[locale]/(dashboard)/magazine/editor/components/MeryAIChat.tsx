'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Sparkles,
  Copy,
  Check,
  Plus,
  Loader2,
  Bot,
  User,
  Wand2,
  FileText,
  Lightbulb,
  PenTool,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { callGeminiAPI, MAGAZINE_SYSTEM_PROMPT } from '@/lib/services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MeryAIChatProps {
  onInsertContent: (content: string) => void;
}

const QUICK_PROMPTS = [
  { icon: FileText, key: 'articleIntro' },
  { icon: Lightbulb, key: 'contentIdeas' },
  { icon: PenTool, key: 'improveText' },
  { icon: Wand2, key: 'creative' },
];

export default function MeryAIChat({ onInsertContent }: MeryAIChatProps) {
  const t = useTranslations('magazine.ai');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: t('welcomeMessage'),
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history for API
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Call Gemini API
      const response = await callGeminiAPI(
        MAGAZINE_SYSTEM_PROMPT,
        currentInput,
        history
      );

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response.success ? response.content : generateFallbackResponse(currentInput),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (!response.success) {
        console.log('Gemini API failed, using fallback:', response.error);
      }
    } catch (error) {
      console.error('AI Error:', error);
      // Fallback response
      const fallbackMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: generateFallbackResponse(currentInput),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const generateFallbackResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('makale') || input.includes('article') || input.includes('yazı')) {
      return `İşte derginiz için bir makale taslağı:

**Başlık: Tenis Tutkunlarının Buluşma Noktası**

Kulübümüz, tenis severlere sadece kort sağlamakla kalmıyor, aynı zamanda bir aile ortamı sunuyor. Bu sezon gerçekleştirdiğimiz etkinlikler ve turnuvalar, üyelerimiz arasındaki bağı güçlendirdi.

Kortlarımızdaki yenilikler, antrenman programlarımız ve sosyal etkinliklerimiz hakkında detaylı bilgileri bu sayımızda bulabilirsiniz.

*Not: AI API bağlantısı kurulamadı. API Keys sayfasından Google Gemini API anahtarınızı kontrol edin.*`;
    }

    if (input.includes('giriş') || input.includes('intro') || input.includes('introduction')) {
      return `İşte etkileyici bir giriş paragrafı:

**Değerli üyelerimiz,**

Bu sayımızda sizlerle paylaşmaktan mutluluk duyduğumuz birçok heyecan verici gelişme var. Kulübümüzün büyüyen ailesi, başarılı turnuvalarımız ve gelecek planlarımız hakkında sizleri bilgilendirmek istiyoruz.

*Not: AI API bağlantısı kurulamadı. API Keys sayfasından Google Gemini API anahtarınızı kontrol edin.*`;
    }

    if (input.includes('fikir') || input.includes('idea') || input.includes('öneri')) {
      return `İşte derginiz için bazı içerik fikirleri:

1. **Üye Röportajları** - Her sayıda bir üyemizi tanıtın
2. **Turnuva Özetleri** - Son turnuvaların sonuçları ve fotoğrafları
3. **Teknik Köşe** - Tenis teknikleri ve ipuçları
4. **Sağlık & Fitness** - Tenisçiler için beslenme ve egzersiz önerileri
5. **Sosyal Etkinlikler** - Kulüp etkinliklerinden kareler
6. **Yeni Üyeler** - Kulübe katılan yeni üyelerin tanıtımı

*Not: AI API bağlantısı kurulamadı. API Keys sayfasından Google Gemini API anahtarınızı kontrol edin.*`;
    }

    return `Size yardımcı olmak isterim! Dergi içeriğiniz için metin oluşturabilirim.

Şunları deneyebilirsiniz:
- "Bir makale girişi yaz"
- "İçerik fikirleri ver"
- "Bu metni geliştir: [metin]"

**Not:** AI API bağlantısı kurulamadı. Lütfen **API Keys** sayfasından Google Gemini API anahtarınızı ekleyin veya kontrol edin.`;
  };

  const handleQuickPrompt = (key: string) => {
    const prompts: Record<string, string> = {
      articleIntro: t('quickPrompts.articleIntro'),
      contentIdeas: t('quickPrompts.contentIdeas'),
      improveText: t('quickPrompts.improveText'),
      creative: t('quickPrompts.creative'),
    };
    setInput(prompts[key] || '');
    textareaRef.current?.focus();
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success(t('copied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (content: string) => {
    onInsertContent(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: t('welcomeMessage'),
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 bg-gradient-to-br from-violet-500 to-purple-600">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                Mery AI
                <Badge variant="secondary" className="text-xs">
                  Gemini
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearChat}
            title="Sohbeti Temizle"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Prompts - Fixed */}
      <div className="flex-shrink-0 px-4 py-2 border-b bg-muted/50">
        <p className="text-xs text-muted-foreground mb-2">{t('quickActions')}</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt) => {
            const Icon = prompt.icon;
            return (
              <Button
                key={prompt.key}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleQuickPrompt(prompt.key)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {t(`quickButtons.${prompt.key}`)}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-2',
                message.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              <Avatar className={cn(
                'h-7 w-7 flex-shrink-0',
                message.role === 'assistant'
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                  : 'bg-primary'
              )}>
                <AvatarFallback className={cn(
                  'text-xs',
                  message.role === 'assistant'
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                    : 'bg-primary text-primary-foreground'
                )}>
                  {message.role === 'assistant' ? (
                    <Bot className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  'flex flex-col max-w-[85%]',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div
                    className="whitespace-pre-wrap break-words prose prose-sm max-w-none prose-p:m-0 prose-headings:m-0"
                    dangerouslySetInnerHTML={{
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
                {message.role === 'assistant' && message.id !== 'welcome' && (
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => handleCopy(message.content, message.id)}
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {t('copy')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => handleInsert(message.content)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t('insert')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <Avatar className="h-7 w-7 flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-600">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                  <Bot className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Düşünüyor...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - Fixed at bottom */}
      <div className="flex-shrink-0 p-3 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('inputPlaceholder')}
            disabled={isLoading}
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-10 w-10 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          {t('disclaimer')}
        </p>
      </div>
    </div>
  );
}
