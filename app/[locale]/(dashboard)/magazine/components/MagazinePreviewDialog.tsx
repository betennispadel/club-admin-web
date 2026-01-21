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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  List,
  FileText,
  File,
  Book,
  Calendar,
  X,
} from 'lucide-react';
import type { MagazineVersion, MagazinePage, MagazinePageType } from '@/lib/types/magazine';

interface MagazinePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: MagazineVersion;
}

const PAGE_TYPE_ICONS: Record<MagazinePageType, React.ElementType> = {
  cover: BookOpen,
  contents: List,
  article: FileText,
  content: File,
  back: Book,
};

export default function MagazinePreviewDialog({
  open,
  onOpenChange,
  version,
}: MagazinePreviewDialogProps) {
  const t = useTranslations('magazine.preview');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const pages = version.pages || [];
  const currentPage = pages[currentPageIndex];

  const goToPage = (index: number) => {
    if (index >= 0 && index < pages.length) {
      setCurrentPageIndex(index);
    }
  };

  const PageIcon = currentPage ? PAGE_TYPE_ICONS[currentPage.type] : FileText;

  const renderPageContent = (page: MagazinePage) => {
    switch (page.type) {
      case 'cover':
        return (
          <div className="text-center space-y-4">
            {page.imageUrl && (
              <img
                src={page.imageUrl}
                alt={page.title}
                className="w-full max-h-[300px] object-cover rounded-lg"
              />
            )}
            <h1 className="text-3xl font-bold">{page.title}</h1>
            {page.subtitle && (
              <p className="text-xl text-muted-foreground">{page.subtitle}</p>
            )}
            {page.content && (
              <p className="text-muted-foreground whitespace-pre-wrap">{page.content}</p>
            )}
          </div>
        );

      case 'contents':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">{page.title || t('tableOfContents')}</h2>
            {page.tableOfContents && page.tableOfContents.length > 0 ? (
              <div className="space-y-2">
                {page.tableOfContents.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-dashed cursor-pointer hover:bg-muted/50 px-2 rounded"
                    onClick={() => goToPage(item.page - 1)}
                  >
                    <span>{item.title}</span>
                    <span className="text-muted-foreground">{item.page}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">{t('noContents')}</p>
            )}
          </div>
        );

      case 'article':
        return (
          <div className="space-y-4">
            {page.imageUrl && (
              <img
                src={page.imageUrl}
                alt={page.title}
                className="w-full max-h-[200px] object-cover rounded-lg"
              />
            )}
            <h2 className="text-2xl font-bold">{page.title}</h2>
            {page.subtitle && (
              <p className="text-lg text-muted-foreground">{page.subtitle}</p>
            )}
            {page.content && (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{page.content}</p>
              </div>
            )}
          </div>
        );

      case 'content':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{page.title}</h2>
            {page.subtitle && (
              <p className="text-lg text-muted-foreground">{page.subtitle}</p>
            )}
            {page.content && (
              <p className="whitespace-pre-wrap">{page.content}</p>
            )}
            {page.contentImages && page.contentImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {page.contentImages.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Content ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'back':
        return (
          <div className="text-center space-y-4 flex flex-col items-center justify-center min-h-[300px]">
            {page.imageUrl && (
              <img
                src={page.imageUrl}
                alt={page.title}
                className="w-full max-h-[200px] object-cover rounded-lg"
              />
            )}
            <h2 className="text-2xl font-bold">{page.title}</h2>
            {page.content && (
              <p className="text-muted-foreground whitespace-pre-wrap">{page.content}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{page.title}</h2>
            {page.content && (
              <p className="whitespace-pre-wrap">{page.content}</p>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {version.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {version.versionName && <span>{version.versionName}</span>}
                {version.year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {version.year}
                  </span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Page Navigation */}
        <div className="px-6 py-3 border-b flex items-center justify-between bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPageIndex - 1)}
            disabled={currentPageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('previous')}
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <PageIcon className="h-3 w-3 mr-1" />
              {currentPage && t(`pageTypes.${currentPage.type}`)}
            </Badge>
            <span className="text-sm">
              {t('page')} {currentPageIndex + 1} / {pages.length}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPageIndex + 1)}
            disabled={currentPageIndex === pages.length - 1}
          >
            {t('next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Page Content */}
        <ScrollArea className="h-[500px] px-6 py-4">
          {currentPage ? (
            renderPageContent(currentPage)
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t('noPages')}
            </div>
          )}
        </ScrollArea>

        {/* Page Thumbnails */}
        <div className="px-6 py-3 border-t bg-muted/30">
          <ScrollArea className="w-full">
            <div className="flex gap-2">
              {pages.map((page, index) => {
                const Icon = PAGE_TYPE_ICONS[page.type];
                return (
                  <button
                    key={page.id}
                    onClick={() => goToPage(index)}
                    className={`flex-shrink-0 w-16 h-20 rounded border-2 flex flex-col items-center justify-center text-xs transition-colors ${
                      index === currentPageIndex
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span>{index + 1}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
