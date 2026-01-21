'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  Image as ImageIcon,
  Upload,
  BookOpen,
  List,
  FileText,
  File,
  Book,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { MagazineVersion, MagazinePage, MagazinePageType, TableOfContentItem } from '@/lib/types/magazine';
import {
  createMagazineVersion,
  updateMagazineVersion,
  uploadMagazineImage,
  createNewPage,
  createTableOfContentItem,
} from '@/lib/firebase/magazine';

interface MagazineEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: MagazineVersion | null;
  onSuccess: () => void;
}

const PAGE_TYPE_ICONS: Record<MagazinePageType, React.ElementType> = {
  cover: BookOpen,
  contents: List,
  article: FileText,
  content: File,
  back: Book,
};

export default function MagazineEditorDialog({
  open,
  onOpenChange,
  version,
  onSuccess,
}: MagazineEditorDialogProps) {
  const t = useTranslations('magazine.editor');
  const tCommon = useTranslations('magazine');
  const { selectedClub } = useClubStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [versionName, setVersionName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [pages, setPages] = useState<MagazinePage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!version;

  useEffect(() => {
    if (open) {
      if (version) {
        setTitle(version.title);
        setDescription(version.description);
        setVersionName(version.versionName);
        setYear(version.year);
        setPages(version.pages || [createNewPage(1, 'cover')]);
      } else {
        setTitle('');
        setDescription('');
        setVersionName('');
        setYear(new Date().getFullYear().toString());
        setPages([createNewPage(1, 'cover')]);
      }
      setCurrentPageIndex(0);
    }
  }, [open, version]);

  const currentPage = pages[currentPageIndex];

  const updatePage = (field: keyof MagazinePage, value: any) => {
    setPages((prev) =>
      prev.map((p, i) => (i === currentPageIndex ? { ...p, [field]: value } : p))
    );
  };

  const addPage = () => {
    const newPage = createNewPage(pages.length + 1, 'article');
    setPages((prev) => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
  };

  const deletePage = () => {
    if (pages.length === 1) {
      toast.error(t('errors.atLeastOnePage'));
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== currentPageIndex));
    if (currentPageIndex >= pages.length - 1) {
      setCurrentPageIndex(Math.max(0, pages.length - 2));
    }
  };

  const goToPage = (index: number) => {
    if (index >= 0 && index < pages.length) {
      setCurrentPageIndex(index);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'content') => {
    const file = e.target.files?.[0];
    if (!file || !selectedClub?.id) return;

    setUploading(true);
    try {
      const url = await uploadMagazineImage(selectedClub.id, file, type, currentPage.id);
      if (type === 'cover') {
        updatePage('imageUrl', url);
      } else {
        updatePage('contentImages', [...(currentPage.contentImages || []), url]);
      }
      toast.success(t('imageUploaded'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('errors.imageUploadError'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (contentFileInputRef.current) contentFileInputRef.current.value = '';
    }
  };

  const removeContentImage = (index: number) => {
    updatePage(
      'contentImages',
      (currentPage.contentImages || []).filter((_, i) => i !== index)
    );
  };

  const addTableOfContentItem = () => {
    const newItem = createTableOfContentItem();
    updatePage('tableOfContents', [...(currentPage.tableOfContents || []), newItem]);
  };

  const updateTableOfContentItem = (itemId: string, field: keyof TableOfContentItem, value: any) => {
    updatePage(
      'tableOfContents',
      (currentPage.tableOfContents || []).map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const removeTableOfContentItem = (itemId: string) => {
    updatePage(
      'tableOfContents',
      (currentPage.tableOfContents || []).filter((item) => item.id !== itemId)
    );
  };

  const handleSave = async () => {
    if (!selectedClub?.id) return;

    if (!title.trim()) {
      toast.error(t('errors.titleRequired'));
      return;
    }
    if (!versionName.trim()) {
      toast.error(t('errors.versionNameRequired'));
      return;
    }
    if (!year.trim()) {
      toast.error(t('errors.yearRequired'));
      return;
    }

    setSaving(true);
    try {
      const versionData = {
        title: title.trim(),
        description: description.trim(),
        versionName: versionName.trim(),
        year: year.trim(),
        pages: pages.map((page, index) => ({
          ...page,
          order: index + 1,
        })),
        isPublished: version?.isPublished || false,
      };

      if (isEditing && version) {
        await updateMagazineVersion(selectedClub.id, version.id, versionData);
        toast.success(t('updateSuccess'));
      } else {
        await createMagazineVersion(
          selectedClub.id,
          versionData as any,
          0 // Will be fetched from existing versions count
        );
        toast.success(t('createSuccess'));
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving magazine:', error);
      toast.error(t('errors.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const PageIcon = currentPage ? PAGE_TYPE_ICONS[currentPage.type] : FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{isEditing ? t('editTitle') : t('createTitle')}</DialogTitle>
          <DialogDescription>{isEditing ? t('editDescription') : t('createDescription')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* Magazine Info */}
          <div className="px-6 pb-4 space-y-4 border-b">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('magazineTitle')}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('magazineTitlePlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="versionName">{t('versionName')}</Label>
                  <Input
                    id="versionName"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    placeholder={t('versionNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">{t('year')}</Label>
                  <Input
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={2}
              />
            </div>
          </div>

          {/* Page Navigation */}
          <div className="px-6 py-3 border-b flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPageIndex - 1)}
                disabled={currentPageIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {t('page')} {currentPageIndex + 1} / {pages.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPageIndex + 1)}
                disabled={currentPageIndex === pages.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={addPage}>
                <Plus className="h-4 w-4 mr-1" />
                {t('addPage')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deletePage}
                disabled={pages.length === 1}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('deletePage')}
              </Button>
            </div>
          </div>

          {/* Page Editor */}
          {currentPage && (
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                {/* Page Type */}
                <div className="flex items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <Label>{t('pageType')}</Label>
                    <Select
                      value={currentPage.type}
                      onValueChange={(value) => updatePage('type', value as MagazinePageType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            {t('pageTypes.cover')}
                          </div>
                        </SelectItem>
                        <SelectItem value="contents">
                          <div className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            {t('pageTypes.contents')}
                          </div>
                        </SelectItem>
                        <SelectItem value="article">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('pageTypes.article')}
                          </div>
                        </SelectItem>
                        <SelectItem value="content">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4" />
                            {t('pageTypes.content')}
                          </div>
                        </SelectItem>
                        <SelectItem value="back">
                          <div className="flex items-center gap-2">
                            <Book className="h-4 w-4" />
                            {t('pageTypes.back')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="secondary" className="mt-6">
                    <PageIcon className="h-3 w-3 mr-1" />
                    {t(`pageTypes.${currentPage.type}`)}
                  </Badge>
                </div>

                {/* Title & Subtitle */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pageTitle">{t('pageTitle')}</Label>
                    <Input
                      id="pageTitle"
                      value={currentPage.title}
                      onChange={(e) => updatePage('title', e.target.value)}
                      placeholder={t('pageTitlePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pageSubtitle">{t('pageSubtitle')}</Label>
                    <Input
                      id="pageSubtitle"
                      value={currentPage.subtitle || ''}
                      onChange={(e) => updatePage('subtitle', e.target.value)}
                      placeholder={t('pageSubtitlePlaceholder')}
                    />
                  </div>
                </div>

                {/* Cover Image */}
                <div className="space-y-2">
                  <Label>{t('coverImage')}</Label>
                  <div className="border rounded-lg p-4">
                    {currentPage.imageUrl ? (
                      <div className="relative">
                        <img
                          src={currentPage.imageUrl}
                          alt="Cover"
                          className="w-full h-48 object-cover rounded"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => updatePage('imageUrl', '')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="h-48 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">{t('uploadImage')}</p>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'cover')}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">{t('content')}</Label>
                  <Textarea
                    id="content"
                    value={currentPage.content}
                    onChange={(e) => updatePage('content', e.target.value)}
                    placeholder={t('contentPlaceholder')}
                    rows={6}
                  />
                </div>

                {/* Table of Contents (for contents page type) */}
                {currentPage.type === 'contents' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>{t('tableOfContents')}</Label>
                      <Button variant="outline" size="sm" onClick={addTableOfContentItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        {t('addItem')}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(currentPage.tableOfContents || []).map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <Input
                            value={item.title}
                            onChange={(e) =>
                              updateTableOfContentItem(item.id, 'title', e.target.value)
                            }
                            placeholder={t('itemTitle')}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={item.page}
                            onChange={(e) =>
                              updateTableOfContentItem(item.id, 'page', parseInt(e.target.value) || 1)
                            }
                            placeholder={t('pageNumber')}
                            className="w-20"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTableOfContentItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {(currentPage.tableOfContents || []).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t('noTableOfContents')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Content Images (for content page type) */}
                {currentPage.type === 'content' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>{t('contentImages')}</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => contentFileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-1" />
                        )}
                        {t('addImage')}
                      </Button>
                      <input
                        ref={contentFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'content')}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(currentPage.contentImages || []).map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Content ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeContentImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {(currentPage.contentImages || []).length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-3 text-center py-4">
                          {t('noContentImages')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('actions.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? tCommon('actions.save') : tCommon('actions.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
