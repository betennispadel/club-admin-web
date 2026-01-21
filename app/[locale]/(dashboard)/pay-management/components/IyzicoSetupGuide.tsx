'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Wallet,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface IyzicoSetupGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IyzicoSetupGuide({ open, onOpenChange }: IyzicoSetupGuideProps) {
  const t = useTranslations('payManagement.guides.iyzico');
  const tCommon = useTranslations('payManagement.guides');
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  const steps = [
    { id: 1, title: t('step1.title'), icon: '1' },
    { id: 2, title: t('step2.title'), icon: '2' },
    { id: 3, title: t('step3.title'), icon: '3' },
    { id: 4, title: t('step4.title'), icon: '4' },
    { id: 5, title: t('step5.title'), icon: '5' },
    { id: 6, title: t('step6.title'), icon: '6' },
    { id: 7, title: t('step7.title'), icon: '7' },
    { id: 8, title: t('step8.title'), icon: '8' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1D64C7] flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>{t('title')}</DialogTitle>
              <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Introduction */}
            <div className="p-6 rounded-lg border bg-card text-center">
              <span className="text-4xl">🇹🇷</span>
              <h3 className="font-semibold text-lg mt-3">{t('introTitle')}</h3>
              <p className="text-sm text-muted-foreground mt-2">{t('introText')}</p>
              <div className="flex justify-center gap-8 mt-4">
                <div className="text-center">
                  <p className="text-sm font-bold text-[#1D64C7]">{t('turkeyOnly')}</p>
                  <p className="text-lg">🇹🇷</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[#1D64C7]">{t('allCards')}</p>
                  <p className="text-lg">💳</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[#1D64C7]">24/7</p>
                  <p className="text-xs text-muted-foreground">{tCommon('support')}</p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h4 className="font-semibold">{tCommon('setupSteps')}</h4>
              {steps.map((step) => (
                <div key={step.id} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        expandedStep === step.id
                          ? 'bg-[#1D64C7] text-white'
                          : 'bg-[#1D64C7]/10 text-[#1D64C7]'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#1D64C7] font-medium">{tCommon('step')} {step.id}</p>
                      <p className="font-medium">{step.title}</p>
                    </div>
                    {expandedStep === step.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  {expandedStep === step.id && (
                    <div className="p-4 pt-0 border-t">
                      <StepContent stepId={step.id} t={t} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Support Links */}
            <div className="p-6 rounded-lg border bg-card text-center">
              <h4 className="font-semibold">{tCommon('needHelp')}</h4>
              <p className="text-sm text-muted-foreground mt-2">{t('supportText')}</p>
              <div className="flex justify-center gap-3 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://dev.iyzipay.com', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {tCommon('documentation')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://www.iyzico.com/destek', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {tCommon('support')}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function StepContent({ stepId, t }: { stepId: number; t: (key: string) => string }) {
  switch (stepId) {
    case 1:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('step1.text')}</p>
          <Button
            variant="outline"
            size="sm"
            className="text-[#1D64C7] border-[#1D64C7]"
            onClick={() => window.open('https://www.iyzico.com/uye-isyeri-basvurusu', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('step1.linkTitle')}
          </Button>
        </div>
      );
    case 2:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('step2.text')}</p>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400">{t('step2.warning')}</p>
            </div>
          </div>
        </div>
      );
    case 3:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('step3.text')}</p>
          <div className="p-3 rounded-lg bg-[#1D64C7]/10 border border-[#1D64C7]/20">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-[#1D64C7] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#1D64C7]">{t('step3.info')}</p>
            </div>
          </div>
        </div>
      );
    case 4:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('step4.text')}</p>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400">{t('step4.warning')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-[#1D64C7] border-[#1D64C7]"
            onClick={() => window.open('https://merchant.iyzipay.com', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('step4.linkTitle')}
          </Button>
        </div>
      );
    case 5:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('step5.text')}</p>
          <div className="grid gap-3">
            <div className="p-3 rounded-lg border">
              <h5 className="font-semibold text-sm">{t('step5.personalTitle')}</h5>
              <p className="text-xs text-muted-foreground mt-1">{t('step5.personalDesc')}</p>
            </div>
            <div className="p-3 rounded-lg border">
              <h5 className="font-semibold text-sm">{t('step5.privateTitle')}</h5>
              <p className="text-xs text-muted-foreground mt-1">{t('step5.privateDesc')}</p>
            </div>
            <div className="p-3 rounded-lg border">
              <h5 className="font-semibold text-sm">{t('step5.limitedTitle')}</h5>
              <p className="text-xs text-muted-foreground mt-1">{t('step5.limitedDesc')}</p>
            </div>
          </div>
        </div>
      );
    case 6:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('step6.text')}</p>
          <div className="p-3 rounded-lg bg-slate-900 dark:bg-slate-950">
            <code className="text-sm text-slate-200">{t('step6.testCards')}</code>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-[#1D64C7] border-[#1D64C7]"
            onClick={() => window.open('https://dev.iyzipay.com/tr/test-kartlari', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('step6.linkTitle')}
          </Button>
        </div>
      );
    case 7:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('step7.text')}</p>
          <div className="p-3 rounded-lg bg-[#1D64C7]/10 border border-[#1D64C7]/20">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-[#1D64C7] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#1D64C7]">{t('step7.info')}</p>
            </div>
          </div>
        </div>
      );
    case 8:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('step8.text')}</p>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400">{t('step8.warning')}</p>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}
