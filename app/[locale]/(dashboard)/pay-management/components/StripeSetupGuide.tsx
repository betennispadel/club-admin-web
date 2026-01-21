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
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Globe,
} from 'lucide-react';

interface StripeSetupGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StripeSetupGuide({ open, onOpenChange }: StripeSetupGuideProps) {
  const t = useTranslations('payManagement.guides.stripe');
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
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#635BFF] flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
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
              <Globe className="h-8 w-8 mx-auto text-[#635BFF] mb-3" />
              <h3 className="font-semibold text-lg">{t('introTitle')}</h3>
              <p className="text-sm text-muted-foreground mt-2">{t('introText')}</p>
              <div className="flex justify-center gap-8 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#635BFF]">135+</p>
                  <p className="text-xs text-muted-foreground">{tCommon('countries')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#635BFF]">2.9%</p>
                  <p className="text-xs text-muted-foreground">+ $0.30</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#635BFF]">24/7</p>
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
                          ? 'bg-[#635BFF] text-white'
                          : 'bg-[#635BFF]/10 text-[#635BFF]'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#635BFF] font-medium">{tCommon('step')} {step.id}</p>
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
                  onClick={() => window.open('https://stripe.com/docs', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {tCommon('documentation')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://support.stripe.com', '_blank')}
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
            className="text-[#635BFF] border-[#635BFF]"
            onClick={() => window.open('https://dashboard.stripe.com/register', '_blank')}
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
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-4 rounded-lg border">
              <h5 className="font-semibold">{t('step3.expressTitle')}</h5>
              <p className="text-xs text-muted-foreground mt-1">{t('step3.expressDesc')}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <h5 className="font-semibold">{t('step3.standardTitle')}</h5>
              <p className="text-xs text-muted-foreground mt-1">{t('step3.standardDesc')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-[#635BFF] border-[#635BFF]"
            onClick={() => window.open('https://stripe.com/connect', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('step3.linkTitle')}
          </Button>
        </div>
      );
    case 4:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('step4.text')}</p>
          <div className="p-3 rounded-lg bg-slate-900 dark:bg-slate-950">
            <code className="text-sm text-slate-200">
              pk_test_... (Publishable Key)
              <br />
              sk_test_... (Secret Key)
            </code>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400">{t('step4.warning')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-[#635BFF] border-[#635BFF]"
            onClick={() => window.open('https://dashboard.stripe.com/apikeys', '_blank')}
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
          <div className="p-3 rounded-lg bg-[#635BFF]/10 border border-[#635BFF]/20">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-[#635BFF] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#635BFF]">{t('step5.info')}</p>
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
            className="text-[#635BFF] border-[#635BFF]"
            onClick={() => window.open('https://stripe.com/docs/testing', '_blank')}
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
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400">{t('step7.warning')}</p>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}
