'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClubStore } from '@/stores/clubStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  List,
  FileText,
  File,
  Book,
  Upload,
  X,
  Loader2,
  GripVertical,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  MagazineVersion,
  MagazinePage,
  MagazinePageType,
  TableOfContentItem,
} from '@/lib/types/magazine';
import {
  fetchMagazineVersions,
  createMagazineVersion,
  updateMagazineVersion,
  uploadMagazineImage,
  deleteMagazineImage,
  createNewPage,
  createTableOfContentItem,
} from '@/lib/firebase/magazine';
import MeryAIChat from './components/MeryAIChat';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

const PAGE_TYPE_OPTIONS: { value: MagazinePageType; icon: React.ElementType }[] = [
  { value: 'cover', icon: BookOpen },
  { value: 'contents', icon: List },
  { value: 'article', icon: FileText },
  { value: 'content', icon: File },
  { value: 'back', icon: Book },
];

export default function MagazineEditorPage() {
  const t = useTranslations('magazine.editor');
  const tCommon = useTranslations('magazine');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedClub } = useClubStore();

  const versionId = searchParams.get('id');
  const isEditMode = !!versionId;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [versionName, setVersionName] = useState('');
  const [versionNumber, setVersionNumber] = useState('1.0');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [pages, setPages] = useState<MagazinePage[]>([createNewPage(0, 'cover')]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // UI state
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [versionsCount, setVersionsCount] = useState(0);

  const currentPage = pages[currentPageIndex];

  // Load existing version if editing, or fetch versions count for new
  useEffect(() => {
    if (selectedClub?.id) {
      loadData();
    }
  }, [selectedClub?.id, versionId]);

  const loadData = async () => {
    if (!selectedClub?.id) return;
    setLoading(true);
    try {
      const versions = await fetchMagazineVersions(selectedClub.id);
      setVersionsCount(versions.length);

      if (isEditMode && versionId) {
        const version = versions.find(v => v.id === versionId);
        if (version) {
          setTitle(version.title);
          setDescription(version.description || '');
          setVersionName(version.versionName || '');
          setVersionNumber(version.versionNumber);
          setYear(version.year || new Date().getFullYear().toString());
          setPages(version.pages?.length ? version.pages : [createNewPage(0, 'cover')]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedClub?.id) return;
    if (!title.trim()) {
      toast.error(t('errors.titleRequired'));
      return;
    }

    setSaving(true);
    try {
      const versionData: Partial<MagazineVersion> = {
        title: title.trim(),
        description: description.trim(),
        versionName: versionName.trim(),
        versionNumber,
        year,
        pages,
      };

      if (isEditMode && versionId) {
        await updateMagazineVersion(selectedClub.id, versionId, versionData);
        toast.success(t('updateSuccess'));
      } else {
        await createMagazineVersion(selectedClub.id, versionData as Omit<MagazineVersion, 'id' | 'createdAt' | 'updatedAt' | 'versionNumber'>, versionsCount);
        toast.success(t('createSuccess'));
      }

      router.push('/magazine');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(t('errors.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const addPage = (type: MagazinePageType) => {
    const newPage = createNewPage(pages.length, type);
    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
    setActiveTab('page');
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      toast.error(t('errors.minOnePage'));
      return;
    }
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1);
    }
  };

  const updatePage = (updates: Partial<MagazinePage>) => {
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], ...updates };
    setPages(newPages);
  };

  const handleImageUpload = async (file: File, field: 'imageUrl' | 'contentImages') => {
    if (!selectedClub?.id) return;
    setUploadingImage(true);
    try {
      const imageType = field === 'imageUrl' ? 'cover' : 'content';
      const url = await uploadMagazineImage(selectedClub.id, file, imageType, currentPage.id);
      if (field === 'imageUrl') {
        updatePage({ imageUrl: url });
      } else {
        const currentImages = currentPage.contentImages || [];
        updatePage({ contentImages: [...currentImages, url] });
      }
      toast.success(t('imageUploaded'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('errors.imageUploadError'));
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async (url: string, field: 'imageUrl' | 'contentImages') => {
    try {
      await deleteMagazineImage(url);
      if (field === 'imageUrl') {
        updatePage({ imageUrl: undefined });
      } else {
        const currentImages = currentPage.contentImages || [];
        updatePage({ contentImages: currentImages.filter(img => img !== url) });
      }
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  // Table of contents management
  const addTocItem = () => {
    const newItem = createTableOfContentItem();
    newItem.page = pages.length + 1;
    const currentToc = currentPage.tableOfContents || [];
    updatePage({ tableOfContents: [...currentToc, newItem] });
  };

  const updateTocItem = (index: number, updates: Partial<TableOfContentItem>) => {
    const currentToc = currentPage.tableOfContents || [];
    const newToc = [...currentToc];
    newToc[index] = { ...newToc[index], ...updates };
    updatePage({ tableOfContents: newToc });
  };

  const removeTocItem = (index: number) => {
    const currentToc = currentPage.tableOfContents || [];
    updatePage({ tableOfContents: currentToc.filter((_, i) => i !== index) });
  };

  const handleAIContentInsert = (content: string) => {
    // Insert AI generated content into current page
    if (currentPage) {
      const currentContent = currentPage.content || '';
      updatePage({ content: currentContent + (currentContent ? '\n\n' : '') + content });
      toast.success(t('aiContentInserted'));
    }
  };

  const PageIcon = currentPage ? PAGE_TYPE_OPTIONS.find(p => p.value === currentPage.type)?.icon || FileText : FileText;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/magazine')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {isEditMode ? t('editTitle') : t('createTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {title || t('untitled')}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('save')}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Editor */}
        <div className="flex-1 flex flex-col overflow-hidden border-r">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b px-4 flex-shrink-0">
              <TabsList className="h-12">
                <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
                <TabsTrigger value="pages">{t('tabs.pages')}</TabsTrigger>
                <TabsTrigger value="page">{t('tabs.currentPage')}</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Details Tab */}
              <TabsContent value="details" className="p-6 space-y-6 m-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>{t('form.title')}</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('form.titlePlaceholder')}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>{t('form.description')}</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('form.descriptionPlaceholder')}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>{t('form.versionName')}</Label>
                    <Input
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                      placeholder={t('form.versionNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label>{t('form.versionNumber')}</Label>
                    <Input
                      value={versionNumber}
                      onChange={(e) => setVersionNumber(e.target.value)}
                      placeholder="1.0"
                    />
                  </div>
                  <div>
                    <Label>{t('form.year')}</Label>
                    <Input
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder={new Date().getFullYear().toString()}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Pages Tab */}
              <TabsContent value="pages" className="p-6 space-y-4 m-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t('pagesList')}</h3>
                  <div className="flex gap-2">
                    {PAGE_TYPE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <Button
                          key={option.value}
                          variant="outline"
                          size="sm"
                          onClick={() => addPage(option.value)}
                          title={t(`pageTypes.${option.value}`)}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          <Plus className="h-3 w-3" />
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  {pages.map((page, index) => {
                    const Icon = PAGE_TYPE_OPTIONS.find(p => p.value === page.type)?.icon || FileText;
                    return (
                      <div
                        key={page.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          index === currentPageIndex
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setCurrentPageIndex(index);
                          setActiveTab('page');
                        }}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2 flex-1">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{index + 1}.</span>
                          <span className="text-sm">{page.title || t(`pageTypes.${page.type}`)}</span>
                          <Badge variant="secondary" className="text-xs">
                            {t(`pageTypes.${page.type}`)}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(index);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Current Page Tab */}
              <TabsContent value="page" className="p-6 space-y-6 m-0">
                {currentPage && (
                  <>
                    {/* Page Navigation */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                        disabled={currentPageIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {t('previous')}
                      </Button>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <PageIcon className="h-3 w-3 mr-1" />
                          {t(`pageTypes.${currentPage.type}`)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {currentPageIndex + 1} / {pages.length}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                        disabled={currentPageIndex === pages.length - 1}
                      >
                        {t('next')}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    {/* Page Type Selector */}
                    <div>
                      <Label>{t('form.pageType')}</Label>
                      <Select
                        value={currentPage.type}
                        onValueChange={(value: MagazinePageType) => updatePage({ type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_TYPE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {t(`pageTypes.${option.value}`)}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Page Title */}
                    <div>
                      <Label>{t('form.pageTitle')}</Label>
                      <Input
                        value={currentPage.title}
                        onChange={(e) => updatePage({ title: e.target.value })}
                        placeholder={t('form.pageTitlePlaceholder')}
                      />
                    </div>

                    {/* Subtitle (for cover, article, content) */}
                    {['cover', 'article', 'content'].includes(currentPage.type) && (
                      <div>
                        <Label>{t('form.subtitle')}</Label>
                        <Input
                          value={currentPage.subtitle || ''}
                          onChange={(e) => updatePage({ subtitle: e.target.value })}
                          placeholder={t('form.subtitlePlaceholder')}
                        />
                      </div>
                    )}

                    {/* Main Image (for cover, article, back) */}
                    {['cover', 'article', 'back'].includes(currentPage.type) && (
                      <div>
                        <Label>{t('form.mainImage')}</Label>
                        {currentPage.imageUrl ? (
                          <div className="relative mt-2">
                            <img
                              src={currentPage.imageUrl}
                              alt="Page"
                              className="w-full max-h-48 object-cover rounded-lg"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8"
                              onClick={() => removeImage(currentPage.imageUrl!, 'imageUrl')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {uploadingImage ? (
                                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">{t('form.uploadImage')}</p>
                                  </>
                                )}
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file, 'imageUrl');
                                }}
                                disabled={uploadingImage}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content - Rich Text Editor */}
                    {['cover', 'article', 'content', 'back'].includes(currentPage.type) && (
                      <div>
                        <Label className="mb-2 block">{t('form.content')}</Label>
                        <RichTextEditor
                          content={currentPage.content || ''}
                          onChange={(content) => updatePage({ content })}
                          placeholder={t('form.contentPlaceholder')}
                          minHeight="350px"
                          onImageUpload={async (file) => {
                            if (!selectedClub?.id) throw new Error('No club selected');
                            const url = await uploadMagazineImage(
                              selectedClub.id,
                              file,
                              'inline',
                              currentPage.id
                            );
                            toast.success(t('imageUploaded'));
                            return url;
                          }}
                        />
                      </div>
                    )}

                    {/* Table of Contents (for contents page) */}
                    {currentPage.type === 'contents' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>{t('form.tableOfContents')}</Label>
                          <Button variant="outline" size="sm" onClick={addTocItem}>
                            <Plus className="h-4 w-4 mr-1" />
                            {t('form.addItem')}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(currentPage.tableOfContents || []).map((item, index) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <Input
                                value={item.title}
                                onChange={(e) => updateTocItem(index, { title: e.target.value })}
                                placeholder={t('form.tocTitlePlaceholder')}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                value={item.page}
                                onChange={(e) => updateTocItem(index, { page: parseInt(e.target.value) || 1 })}
                                className="w-20"
                                min={1}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTocItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content Images (for content page) */}
                    {currentPage.type === 'content' && (
                      <div>
                        <Label>{t('form.contentImages')}</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {(currentPage.contentImages || []).map((url, index) => (
                            <div key={index} className="relative">
                              <img
                                src={url}
                                alt={`Content ${index + 1}`}
                                className="w-full h-24 object-cover rounded"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => removeImage(url, 'contentImages')}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <label className="flex items-center justify-center h-24 border-2 border-dashed rounded cursor-pointer hover:bg-muted/50">
                            {uploadingImage ? (
                              <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'contentImages');
                              }}
                              disabled={uploadingImage}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Panel - Mery AI Chat */}
        <div className="w-[400px] min-h-0 flex flex-col bg-muted/30 overflow-hidden">
          <MeryAIChat onInsertContent={handleAIContentInsert} />
        </div>
      </div>
    </div>
  );
}
