'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Search,
  Filter,
  RefreshCw,
  Mail,
  MailCheck,
  MailX,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Calendar,
  FileText,
} from 'lucide-react';

import type { Request, TemplateRequest, StudentOption, RequestStatus } from '@/lib/types/private-lessons';
import { approveRequest, rejectRequest } from '@/lib/firebase/private-lessons';
import RequestApprovalDialog from './dialogs/RequestApprovalDialog';

interface RequestsTabProps {
  requests: Request[];
  templateRequests: TemplateRequest[];
  students: StudentOption[];
  pendingCount: number;
  pendingTemplatesCount: number;
  onRefresh: () => void;
}

export default function RequestsTab({
  requests,
  templateRequests,
  students,
  pendingCount,
  pendingTemplatesCount,
  onRefresh,
}: RequestsTabProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();

  // Local States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState('student');

  // Dialog States
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState<Request | null>(null);
  const [processing, setProcessing] = useState(false);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const searchMatch =
        !search.trim() ||
        request.studentName.toLowerCase().includes(search.toLowerCase()) ||
        request.studentEmail?.toLowerCase().includes(search.toLowerCase());

      const statusMatch =
        statusFilter === 'all' || request.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [requests, search, statusFilter]);

  // Filtered Template Requests
  const filteredTemplateRequests = useMemo(() => {
    return templateRequests.filter((template) => {
      const searchMatch =
        !search.trim() ||
        template.studentName.toLowerCase().includes(search.toLowerCase()) ||
        template.templateName.toLowerCase().includes(search.toLowerCase());

      const statusMatch =
        statusFilter === 'all' || template.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [templateRequests, search, statusFilter]);

  // Handlers
  const handleApproveClick = (request: Request) => {
    setSelectedRequest(request);
    setApprovalDialogOpen(true);
  };

  const handleRejectClick = (request: Request) => {
    setRequestToReject(request);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!requestToReject || !selectedClub) return;

    setProcessing(true);
    try {
      await rejectRequest(selectedClub.id, requestToReject.id);
      toast.success(t('messages.requestRejected'));
      setRejectDialogOpen(false);
      setRequestToReject(null);
      onRefresh();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(t('errors.rejectFailed'));
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'Onay Bekliyor':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600 gap-1">
            <Clock className="h-3 w-3" />
            {t('requestStatus.pending')}
          </Badge>
        );
      case 'Onaylandı':
        return (
          <Badge className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            {t('requestStatus.approved')}
          </Badge>
        );
      case 'Reddedildi':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {t('requestStatus.rejected')}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMM yyyy, HH:mm', { locale: tr });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 flex-wrap">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search.requests')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="Onay Bekliyor">{t('requestStatus.pending')}</SelectItem>
              <SelectItem value="Onaylandı">{t('requestStatus.approved')}</SelectItem>
              <SelectItem value="Reddedildi">{t('requestStatus.rejected')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Sub-tabs for request types */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="student" className="gap-2">
            <Mail className="h-4 w-4" />
            {t('requests.studentRequests')}
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="template" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('requests.templateRequests')}
            {pendingTemplatesCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingTemplatesCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Student Requests */}
        <TabsContent value="student" className="mt-6">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <MailCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('empty.requests')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {request.studentName}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(request.requestDate)}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Contact Info */}
                      {request.studentEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">
                            {request.studentEmail}
                          </span>
                        </div>
                      )}
                      {request.studentPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {request.studentPhone}
                          </span>
                        </div>
                      )}

                      {/* Lesson Type */}
                      {(request.requestedLessonType || request.lessonType) && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {request.requestedLessonType || request.lessonType}
                          </Badge>
                        </div>
                      )}

                      {/* Notes */}
                      {request.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {request.notes}
                        </p>
                      )}

                      {/* Actions */}
                      {request.status === 'Onay Bekliyor' && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleApproveClick(request)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t('actions.approve')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-destructive hover:text-destructive"
                            onClick={() => handleRejectClick(request)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            {t('actions.reject')}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Template Requests */}
        <TabsContent value="template" className="mt-6">
          {filteredTemplateRequests.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('empty.templateRequests')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTemplateRequests.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {template.templateName || template.studentName}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(template.requestDate)}
                          </div>
                        </div>
                        {getStatusBadge(template.status)}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Coach */}
                      {template.coachName && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{t('labels.coach')}: {template.coachName}</span>
                        </div>
                      )}

                      {/* Lesson Type & Level */}
                      <div className="flex gap-2">
                        <Badge variant="outline">{template.lessonType}</Badge>
                        {template.level && template.level !== 'Belirtilmedi' && (
                          <Badge variant="secondary">{template.level}</Badge>
                        )}
                      </div>

                      {/* Group Users Count */}
                      {template.groupUsers && template.groupUsers.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {t('labels.groupMembers')}: {template.groupUsers.length}
                        </div>
                      )}

                      {/* Notes */}
                      {template.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <RequestApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        request={selectedRequest}
        students={students}
        onSuccess={() => {
          setApprovalDialogOpen(false);
          setSelectedRequest(null);
          onRefresh();
        }}
      />

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.rejectRequest.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.rejectRequest.description', { name: requestToReject?.studentName || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={processing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processing ? t('actions.rejecting') : t('actions.reject')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
