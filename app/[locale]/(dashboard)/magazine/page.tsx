'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useClubStore } from '@/stores/clubStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Newspaper,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Send,
  BookOpen,
  Calendar,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import type { MagazineVersion } from '@/lib/types/magazine';
import {
  fetchMagazineVersions,
  deleteMagazineVersion,
  publishMagazine,
  unpublishMagazine,
  sendMagazineNotification,
} from '@/lib/firebase/magazine';
import { useAuthStore } from '@/stores/authStore';
import MagazinePreviewDialog from './components/MagazinePreviewDialog';

export default function MagazinePage() {
  const t = useTranslations('magazine');
  const router = useRouter();
  const { selectedClub } = useClubStore();
  const { userProfile } = useAuthStore();

  const [versions, setVersions] = useState<MagazineVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<MagazineVersion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<MagazineVersion | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [versionToPublish, setVersionToPublish] = useState<MagazineVersion | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (selectedClub?.id) {
      loadVersions();
    }
  }, [selectedClub?.id]);

  const loadVersions = async () => {
    if (!selectedClub?.id) return;
    setLoading(true);
    try {
      const data = await fetchMagazineVersions(selectedClub.id);
      setVersions(data);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error(t('errors.loadError'), {
        description: t('errors.loadErrorDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/magazine/editor');
  };

  const handleEdit = (version: MagazineVersion) => {
    router.push(`/magazine/editor?id=${version.id}`);
  };

  const handlePreview = (version: MagazineVersion) => {
    setSelectedVersion(version);
    setPreviewOpen(true);
  };

  const handleDelete = (version: MagazineVersion) => {
    setVersionToDelete(version);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedClub?.id || !versionToDelete) return;
    setActionLoading(versionToDelete.id);
    try {
      await deleteMagazineVersion(selectedClub.id, versionToDelete.id);
      setVersions((prev) => prev.filter((v) => v.id !== versionToDelete.id));
      toast.success(t('deleteSuccess'), {
        description: t('deleteSuccessDesc'),
      });
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error(t('errors.deleteError'), {
        description: t('errors.deleteErrorDesc'),
      });
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setVersionToDelete(null);
    }
  };

  const handlePublish = (version: MagazineVersion) => {
    setVersionToPublish(version);
    setPublishDialogOpen(true);
  };

  const confirmPublish = async () => {
    if (!selectedClub?.id || !versionToPublish || !userProfile?.id) return;
    setActionLoading(versionToPublish.id);
    try {
      await publishMagazine(selectedClub.id, versionToPublish);

      // Send notifications
      try {
        const count = await sendMagazineNotification(
          selectedClub.id,
          selectedClub.name || 'Club',
          versionToPublish,
          userProfile.id
        );
        toast.success(t('publishSuccess'), {
          description: t('publishSuccessDesc', { count }),
        });
      } catch (notifError) {
        toast.success(t('publishSuccess'), {
          description: t('publishSuccessNoNotif'),
        });
      }

      loadVersions();
    } catch (error) {
      console.error('Error publishing version:', error);
      toast.error(t('errors.publishError'), {
        description: t('errors.publishErrorDesc'),
      });
    } finally {
      setActionLoading(null);
      setPublishDialogOpen(false);
      setVersionToPublish(null);
    }
  };

  const handleUnpublish = async (version: MagazineVersion) => {
    if (!selectedClub?.id) return;
    setActionLoading(version.id);
    try {
      await unpublishMagazine(selectedClub.id, version.id);
      setVersions((prev) =>
        prev.map((v) => (v.id === version.id ? { ...v, isPublished: false } : v))
      );
      toast.success(t('unpublishSuccess'), {
        description: t('unpublishSuccessDesc'),
      });
    } catch (error) {
      console.error('Error unpublishing version:', error);
      toast.error(t('errors.unpublishError'), {
        description: t('errors.unpublishErrorDesc'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredVersions = versions.filter(
    (version) =>
      version.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      version.versionName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      version.year?.includes(searchQuery)
  );

  const formatDate = (timestamp: { toDate: () => Date } | undefined) => {
    if (!timestamp?.toDate) return '-';
    return timestamp.toDate().toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          {t('createNew')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Versions Grid */}
      {filteredVersions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery ? t('noSearchResults') : t('noVersions')}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                {t('createFirst')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVersions.map((version) => (
            <Card key={version.id} className="relative overflow-hidden">
              {version.isPublished && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t('published')}
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-8">
                    <CardTitle className="text-lg line-clamp-1">{version.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {version.versionName && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {version.versionName}
                        </span>
                      )}
                      {version.year && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {version.year}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={actionLoading === version.id}
                      >
                        {actionLoading === version.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePreview(version)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('actions.preview')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(version)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {version.isPublished ? (
                        <DropdownMenuItem onClick={() => handleUnpublish(version)}>
                          <XCircle className="h-4 w-4 mr-2" />
                          {t('actions.unpublish')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handlePublish(version)}>
                          <Send className="h-4 w-4 mr-2" />
                          {t('actions.publish')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(version)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {version.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {version.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {version.pages?.length || 0} {t('pages')}
                  </span>
                  <span>{formatDate(version.createdAt)}</span>
                </div>
                <div className="mt-3">
                  <Badge variant="outline" className="text-xs">
                    {version.versionNumber}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      {selectedVersion && (
        <MagazinePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          version={selectedVersion}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription', { title: versionToDelete?.title || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('publishTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('publishDescription', { title: versionToPublish?.title || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish}>
              <Send className="h-4 w-4 mr-2" />
              {t('actions.publish')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
