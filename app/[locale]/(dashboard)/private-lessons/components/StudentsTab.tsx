'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  Mail,
  Phone,
  Filter,
  RefreshCw,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  UserCircle,
  Dumbbell,
  RefreshCcw,
  CreditCard,
  BarChart3,
  MessageSquare,
  Snowflake,
  PlayCircle,
  Info,
} from 'lucide-react';

import type { StudentOption, Lesson, LessonType, Request, LessonStudent } from '@/lib/types/private-lessons';
import { deleteStudent } from '@/lib/firebase/private-lessons';
import AddEditStudentDialog from './dialogs/AddEditStudentDialog';
import StudentDetailsDialog from './dialogs/StudentDetailsDialog';
import MessageDialog from './dialogs/MessageDialog';

interface StudentsTabProps {
  students: StudentOption[];
  lessons: Lesson[];
  requests?: Request[];
  onRefresh: () => void;
  onOpenPayment?: (student: StudentOption) => void;
  onOpenRenewal?: (student: StudentOption) => void;
  onChangeStatus?: (student: StudentOption) => void;
  onResetApplications?: (studentId: string, studentName: string, lessonType?: LessonType) => void;
}

// Lesson type status calculation
interface LessonTypeStatusResult {
  statusType: 'no_request' | 'can_apply' | 'pending' | 'approved_waiting_assignment' | 'assigned_to_lesson' | 'needs_renewal';
  statusMessage: string;
  statusColor: string;
  canGrantReapply: boolean;
  totalRequests: number;
}

export default function StudentsTab({
  students,
  lessons,
  requests = [],
  onRefresh,
  onOpenPayment,
  onOpenRenewal,
  onChangeStatus,
  onResetApplications,
}: StudentsTabProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();

  // Local States
  const [search, setSearch] = useState('');
  const [lessonTypeFilter, setLessonTypeFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog States
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentOption | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Get lesson type status for a student
  const getLessonTypeStatus = (student: StudentOption, lessonType: LessonType): LessonTypeStatusResult => {
    const typeRequests = requests.filter(r => {
      const matchesId = r.studentId === student.id;
      const matchesName = student.type === 'manual' && r.studentName === student.name;
      return (matchesId || matchesName) && r.requestedLessonType === lessonType;
    }).sort((a, b) => {
      const dateA = a.requestDate && typeof (a.requestDate as any).toMillis === 'function'
        ? (a.requestDate as any).toMillis() : 0;
      const dateB = b.requestDate && typeof (b.requestDate as any).toMillis === 'function'
        ? (b.requestDate as any).toMillis() : 0;
      return dateB - dateA;
    });

    const latestRequest = typeRequests[0];
    const isAssignedToLesson = lessons.some((lesson: Lesson) =>
      lesson.students.some((lessonStudent: LessonStudent) =>
        lessonStudent.studentId === student.id &&
        lesson.lessonType === lessonType
      )
    );

    let statusType: LessonTypeStatusResult['statusType'] = 'no_request';
    let canGrantReapply = false;
    let statusMessage = '';
    let statusColor = 'text-muted-foreground';

    if (!latestRequest) {
      statusType = 'can_apply';
      statusMessage = t('studentCard.canApply');
      statusColor = 'text-primary';
    } else {
      switch (latestRequest.status) {
        case 'Onay Bekliyor':
          statusType = 'pending';
          statusMessage = t('studentCard.pendingApproval');
          statusColor = 'text-yellow-600';
          break;

        case 'Onaylandı':
          if (latestRequest.canReapply) {
            statusType = 'can_apply';
            statusMessage = t('studentCard.canReapply');
            statusColor = 'text-primary';
          } else if (isAssignedToLesson) {
            statusType = 'assigned_to_lesson';
            statusMessage = t('studentCard.assignedToLesson');
            statusColor = 'text-green-600';
            canGrantReapply = true;
          } else {
            statusType = 'approved_waiting_assignment';
            statusMessage = t('studentCard.approvedWaitingAssignment');
            statusColor = 'text-primary';
            canGrantReapply = true;
          }
          break;

        case 'Reddedildi':
        case 'İptal Edildi':
          statusType = 'needs_renewal';
          statusMessage = latestRequest.status === 'Reddedildi'
            ? t('studentCard.rejected')
            : t('studentCard.cancelled');
          statusColor = 'text-destructive';
          canGrantReapply = true;
          break;
      }
    }

    return {
      statusType,
      statusMessage,
      statusColor,
      canGrantReapply,
      totalRequests: typeRequests.length
    };
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Search filter
      const searchMatch =
        !search.trim() ||
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email?.toLowerCase().includes(search.toLowerCase()) ||
        student.phone?.includes(search);

      // Lesson type filter
      const typeMatch =
        lessonTypeFilter === 'all' ||
        student.appliedLessonTypes?.includes(lessonTypeFilter as LessonType) ||
        student.lessonType === lessonTypeFilter;

      // Payment status filter
      const paymentMatch =
        paymentStatusFilter === 'all' || student.paymentStatus === paymentStatusFilter;

      // Player status filter
      const playerStatusMatch =
        statusFilter === 'all' || student.playerStatus === statusFilter;

      return searchMatch && typeMatch && paymentMatch && playerStatusMatch;
    });
  }, [students, search, lessonTypeFilter, paymentStatusFilter, statusFilter]);

  // Handlers
  const handleAddStudent = () => {
    setSelectedStudent(null);
    setAddEditDialogOpen(true);
  };

  const handleEditStudent = (student: StudentOption) => {
    setSelectedStudent(student);
    setAddEditDialogOpen(true);
  };

  const handleViewDetails = (student: StudentOption) => {
    setSelectedStudent(student);
    setDetailsDialogOpen(true);
  };

  const handleSendMessage = (student: StudentOption) => {
    setSelectedStudent(student);
    setMessageDialogOpen(true);
  };

  const handleDeleteClick = (student: StudentOption) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete || !selectedClub) return;

    setDeleting(true);
    try {
      await deleteStudent(selectedClub.id, studentToDelete.id);
      toast.success(t('messages.studentDeleted'));
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(t('errors.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const getPlayerStatusBadge = (status?: string) => {
    switch (status) {
      case 'Aktif':
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            {t('playerStatus.active')}
          </Badge>
        );
      case 'Dondurulmuş':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500 gap-1">
            <Snowflake className="h-3 w-3" />
            {t('playerStatus.frozen')}
          </Badge>
        );
      case 'Geçici Dondurulmuş':
        return (
          <Badge className="bg-orange-500/20 text-orange-600 border-orange-500 gap-1">
            <Clock className="h-3 w-3" />
            {t('playerStatus.tempFrozen')}
          </Badge>
        );
      case 'Bıraktı':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {t('playerStatus.quit')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case 'Ödendi':
        return (
          <Badge className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            {t('paymentStatus.paid')}
          </Badge>
        );
      case 'Beklemede':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600 gap-1">
            <Clock className="h-3 w-3" />
            {t('paymentStatus.pending')}
          </Badge>
        );
      case 'Gecikmiş':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {t('paymentStatus.overdue')}
          </Badge>
        );
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const getLessonTypeIcon = (type: LessonType) => {
    switch (type) {
      case 'Bireysel':
        return <User className="h-3.5 w-3.5" />;
      case 'Grup':
        return <Users className="h-3.5 w-3.5" />;
      case 'Kondisyon':
        return <Dumbbell className="h-3.5 w-3.5" />;
      default:
        return <User className="h-3.5 w-3.5" />;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const isFrozen = (student: StudentOption) =>
    student.playerStatus === 'Dondurulmuş' || student.playerStatus === 'Geçici Dondurulmuş';

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 flex-wrap">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search.students')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <Select value={lessonTypeFilter} onValueChange={setLessonTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('filters.lessonType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="Bireysel">{t('lessonTypes.individual')}</SelectItem>
              <SelectItem value="Grup">{t('lessonTypes.group')}</SelectItem>
              <SelectItem value="Kondisyon">{t('lessonTypes.conditioning')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="Aktif">{t('playerStatus.active')}</SelectItem>
              <SelectItem value="Dondurulmuş">{t('playerStatus.frozen')}</SelectItem>
              <SelectItem value="Geçici Dondurulmuş">{t('playerStatus.tempFrozen')}</SelectItem>
              <SelectItem value="Bıraktı">{t('playerStatus.quit')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <DollarSign className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('filters.paymentStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="Ödendi">{t('paymentStatus.paid')}</SelectItem>
              <SelectItem value="Beklemede">{t('paymentStatus.pending')}</SelectItem>
              <SelectItem value="Gecikmiş">{t('paymentStatus.overdue')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleAddStudent}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.addStudent')}
          </Button>
        </div>
      </div>

      {/* Students */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('empty.students')}</p>
            <Button variant="outline" className="mt-4" onClick={handleAddStudent}>
              <Plus className="mr-2 h-4 w-4" />
              {t('actions.addFirstStudent')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student, index) => {
            const bireyselStatus = getLessonTypeStatus(student, 'Bireysel');
            const grupStatus = getLessonTypeStatus(student, 'Grup');
            const kondisyonStatus = getLessonTypeStatus(student, 'Kondisyon');
            const studentIsFrozen = isFrozen(student);

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                    studentIsFrozen ? 'border-2 border-destructive' : ''
                  }`}
                  onClick={() => handleViewDetails(student)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {student.type === 'manual' ? (
                            <User className="h-5 w-5 text-primary" />
                          ) : (
                            <UserCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base line-clamp-1">
                            {student.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {student.playerStatus && student.playerStatus !== 'Aktif' &&
                              getPlayerStatusBadge(student.playerStatus)
                            }
                            {student.level && !student.playerStatus && (
                              <span className="text-xs text-muted-foreground">
                                {student.level}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleEditStudent(student);
                          }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('actions.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleSendMessage(student);
                          }}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            {t('actions.sendMessage')}
                          </DropdownMenuItem>
                          {onChangeStatus && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onChangeStatus(student);
                            }}>
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              {t('actions.changeStatus')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(student);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Freeze Info */}
                    {studentIsFrozen && student.freezeReason && (
                      <div className={`p-2 rounded-md border ${
                        student.playerStatus === 'Dondurulmuş'
                          ? 'bg-yellow-500/10 border-yellow-500'
                          : 'bg-orange-500/10 border-orange-500'
                      }`}>
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 mt-0.5 text-yellow-600" />
                          <div className="flex-1 text-xs">
                            <p className="font-medium text-yellow-600">
                              {t('studentCard.freezeReason')}: {student.freezeReason}
                            </p>
                            {student.playerStatus === 'Geçici Dondurulmuş' && student.freezeEndDate && (
                              <p className="text-muted-foreground mt-1">
                                {t('studentCard.freezeEndDate')}: {
                                  student.freezeEndDate && typeof (student.freezeEndDate as any).toDate === 'function'
                                    ? format((student.freezeEndDate as any).toDate(), 'dd.MM.yyyy')
                                    : '-'
                                }
                              </p>
                            )}
                            {onChangeStatus && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-7 text-xs border-green-500 text-green-600 hover:bg-green-500/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onChangeStatus(student);
                                }}
                              >
                                <PlayCircle className="h-3 w-3 mr-1" />
                                {t('studentCard.removeFreeze')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    {student.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{student.phone}</span>
                      </div>
                    )}
                    {student.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">
                          {student.email}
                        </span>
                      </div>
                    )}

                    {/* Level & Gender */}
                    {student.level && (
                      <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('labels.level')}: {student.level}</span>
                      </div>
                    )}

                    {/* Applied Lesson Types (for manual students) */}
                    {student.type === 'manual' && student.appliedLessonTypes && student.appliedLessonTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {student.appliedLessonTypes.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs gap-1">
                            {getLessonTypeIcon(type)}
                            {type}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Financial Info */}
                    {typeof student.price === 'number' && (
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-green-600" />
                        <span>
                          <span className="font-medium">{t('studentCard.price')}: </span>
                          <span className="text-green-600">{formatCurrency(student.price)}</span>
                          {typeof student.totalPaid === 'number' && (
                            <span className="text-muted-foreground">
                              {' '}({t('studentCard.paid')}: {formatCurrency(student.totalPaid)})
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {typeof student.remainingAmount === 'number' && student.remainingAmount > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-destructive font-medium">
                          {t('studentCard.remainingDebt')}: {formatCurrency(student.remainingAmount)}
                        </span>
                      </div>
                    )}

                    {/* Application Status Section */}
                    <div className="pt-3 mt-3 border-t space-y-2">
                      <p className="text-sm font-semibold">{t('studentCard.applicationStatus')}</p>

                      {/* Bireysel Status */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium">{t('lessonTypes.individual')}:</span>
                          <span className={bireyselStatus.statusColor}>
                            {bireyselStatus.statusMessage}
                          </span>
                          {bireyselStatus.statusType === 'assigned_to_lesson' && (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          )}
                        </div>
                        {bireyselStatus.canGrantReapply && onResetApplications && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onResetApplications(student.id, student.name, 'Bireysel');
                                  }}
                                >
                                  <RefreshCcw className="h-3 w-3 text-yellow-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('studentCard.grantReapply')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      {/* Grup Status */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium">{t('lessonTypes.group')}:</span>
                          <span className={grupStatus.statusColor}>
                            {grupStatus.statusMessage}
                          </span>
                          {grupStatus.statusType === 'assigned_to_lesson' && (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          )}
                        </div>
                        {grupStatus.canGrantReapply && onResetApplications && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onResetApplications(student.id, student.name, 'Grup');
                                  }}
                                >
                                  <RefreshCcw className="h-3 w-3 text-yellow-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('studentCard.grantReapply')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      {/* Kondisyon Status */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium">{t('lessonTypes.conditioning')}:</span>
                          <span className={kondisyonStatus.statusColor}>
                            {kondisyonStatus.statusMessage}
                          </span>
                          {kondisyonStatus.statusType === 'assigned_to_lesson' && (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          )}
                        </div>
                        {kondisyonStatus.canGrantReapply && onResetApplications && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onResetApplications(student.id, student.name, 'Kondisyon');
                                  }}
                                >
                                  <RefreshCcw className="h-3 w-3 text-yellow-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('studentCard.grantReapply')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {studentIsFrozen && typeof student.price === 'number' && (
                      <div className="p-2 rounded-md bg-yellow-500/10 border border-yellow-500 text-center">
                        <p className="text-xs text-yellow-600 font-medium">
                          {t('studentCard.studentFrozenWarning')}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      {typeof student.price === 'number' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`flex-1 text-xs ${studentIsFrozen ? 'opacity-50' : 'border-green-500 text-green-600 hover:bg-green-500/10'}`}
                            disabled={studentIsFrozen}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (studentIsFrozen) {
                                toast.error(t('studentCard.studentFrozenAlert'));
                                return;
                              }
                              onOpenPayment?.(student);
                            }}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            {t('studentCard.takePayment')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`flex-1 text-xs ${studentIsFrozen ? 'opacity-50' : 'border-primary text-primary hover:bg-primary/10'}`}
                            disabled={studentIsFrozen}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (studentIsFrozen) {
                                toast.error(t('studentCard.studentFrozenAlert'));
                                return;
                              }
                              onOpenRenewal?.(student);
                            }}
                          >
                            <RefreshCcw className="h-3 w-3 mr-1" />
                            {t('studentCard.renewLesson')}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AddEditStudentDialog
        open={addEditDialogOpen}
        onOpenChange={setAddEditDialogOpen}
        student={selectedStudent}
        onSuccess={() => {
          setAddEditDialogOpen(false);
          setSelectedStudent(null);
          onRefresh();
        }}
      />

      {/* Details Dialog */}
      <StudentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        student={selectedStudent}
        lessons={lessons}
      />

      {/* Message Dialog */}
      <MessageDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        recipientName={selectedStudent?.name || ''}
        recipientId={selectedStudent?.id || ''}
        onSuccess={() => {
          setMessageDialogOpen(false);
          setSelectedStudent(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deleteStudent.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.deleteStudent.description', { name: studentToDelete?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t('actions.deleting') : t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
