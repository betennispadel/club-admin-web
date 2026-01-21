'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Filter,
  CreditCard,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Calendar,
  Eye,
  FileText,
  MoreVertical,
  Snowflake,
  Play,
  Pause,
  RotateCcw,
  Receipt,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { StudentOption, Lesson, LessonType, PaymentStatus, Installment, LessonMembership } from '@/lib/types/private-lessons';
import AdvancedPaymentDialog from './dialogs/AdvancedPaymentDialog';
import PackageRenewalDialog from './dialogs/PackageRenewalDialog';
import StudentStatusDialog from './dialogs/StudentStatusDialog';
import PaymentHistoryDialog from './dialogs/PaymentHistoryDialog';

interface FinanceTabProps {
  students: StudentOption[];
  lessons: Lesson[];
  onRefresh: () => void;
}

export default function FinanceTab({
  students,
  lessons,
  onRefresh,
}: FinanceTabProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();

  // Local States
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [lessonTypeFilter, setLessonTypeFilter] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'overview'>('overview');

  // Dialog States
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    students.forEach((student) => {
      const price = student.price || 0;
      const paid = student.totalPaid || 0;
      const remaining = student.remainingAmount || 0;

      totalExpected += price;
      totalCollected += paid;

      // Check installments for overdue
      const hasOverdue = student.installments?.some((inst) => {
        if (inst.status === 'Gecikmiş') return true;
        if (inst.status === 'Beklemede' && inst.dueDate) {
          const dueDate = inst.dueDate && typeof (inst.dueDate as any).toDate === 'function' ? (inst.dueDate as any).toDate() : new Date(inst.dueDate as any);
          return dueDate < new Date();
        }
        return false;
      });

      if (student.paymentStatus === 'Ödendi') {
        paidCount++;
      } else if (hasOverdue) {
        totalOverdue += remaining;
        overdueCount++;
      } else {
        totalPending += remaining;
        pendingCount++;
      }
    });

    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    return {
      totalExpected,
      totalCollected,
      totalPending,
      totalOverdue,
      totalRemaining: totalPending + totalOverdue,
      collectionRate,
      paidCount,
      pendingCount,
      overdueCount,
      totalStudents: students.length,
    };
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Search filter
      const searchMatch =
        !search.trim() ||
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email?.toLowerCase().includes(search.toLowerCase()) ||
        student.phone?.includes(search);

      // Payment status filter
      const paymentMatch =
        paymentStatusFilter === 'all' || student.paymentStatus === paymentStatusFilter;

      // Lesson type filter
      const typeMatch =
        lessonTypeFilter === 'all' ||
        student.appliedLessonTypes?.includes(lessonTypeFilter as LessonType) ||
        student.lessonType === lessonTypeFilter;

      return searchMatch && paymentMatch && typeMatch;
    });
  }, [students, search, paymentStatusFilter, lessonTypeFilter]);

  // Handlers
  const handlePayment = (student: StudentOption) => {
    setSelectedStudent(student);
    setPaymentDialogOpen(true);
  };

  const handleRenewal = (student: StudentOption) => {
    setSelectedStudent(student);
    setRenewalDialogOpen(true);
  };

  const handleStatusChange = (student: StudentOption) => {
    setSelectedStudent(student);
    setStatusDialogOpen(true);
  };

  const handleViewHistory = (student: StudentOption) => {
    setSelectedStudent(student);
    setHistoryDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const getPaymentStatusBadge = (student: StudentOption) => {
    // Check for overdue installments
    const hasOverdue = student.installments?.some((inst) => {
      if (inst.status === 'Gecikmiş') return true;
      if (inst.status === 'Beklemede' && inst.dueDate) {
        const dueDate = inst.dueDate && typeof (inst.dueDate as any).toDate === 'function' ? (inst.dueDate as any).toDate() : new Date(inst.dueDate as any);
        return dueDate < new Date();
      }
      return false;
    });

    if (student.paymentStatus === 'Ödendi') {
      return (
        <Badge className="bg-green-500 gap-1">
          <CheckCircle className="h-3 w-3" />
          {t('paymentStatus.paid')}
        </Badge>
      );
    }
    if (hasOverdue) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          {t('paymentStatus.overdue')}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-600 gap-1">
        <Clock className="h-3 w-3" />
        {t('paymentStatus.pending')}
      </Badge>
    );
  };

  const getPlayerStatusBadge = (status?: string) => {
    switch (status) {
      case 'Aktif':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
            <Play className="h-3 w-3" />
            {t('playerStatus.active')}
          </Badge>
        );
      case 'Dondurulmuş':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600 gap-1">
            <Snowflake className="h-3 w-3" />
            {t('playerStatus.frozen')}
          </Badge>
        );
      case 'Geçici Dondurulmuş':
        return (
          <Badge variant="outline" className="text-cyan-600 border-cyan-600 gap-1">
            <Pause className="h-3 w-3" />
            {t('playerStatus.tempFrozen')}
          </Badge>
        );
      case 'Bıraktı':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600 gap-1">
            {t('playerStatus.quit')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
            <Play className="h-3 w-3" />
            {t('playerStatus.active')}
          </Badge>
        );
    }
  };

  const getNextPaymentInfo = (student: StudentOption) => {
    if (!student.installments || student.installments.length === 0) return null;

    const pendingInstallments = student.installments
      .filter((inst) => inst.status === 'Beklemede')
      .sort((a, b) => {
        const dateA = a.dueDate && typeof (a.dueDate as any).toDate === 'function' ? (a.dueDate as any).toDate() : new Date(a.dueDate as any);
        const dateB = b.dueDate && typeof (b.dueDate as any).toDate === 'function' ? (b.dueDate as any).toDate() : new Date(b.dueDate as any);
        return dateA.getTime() - dateB.getTime();
      });

    if (pendingInstallments.length === 0) return null;

    const nextInstallment = pendingInstallments[0];
    const dueDate = nextInstallment.dueDate && typeof (nextInstallment.dueDate as any).toDate === 'function'
      ? (nextInstallment.dueDate as any).toDate()
      : new Date(nextInstallment.dueDate as any);
    const isOverdue = dueDate < new Date();

    return {
      amount: nextInstallment.amount,
      dueDate,
      isOverdue,
      installmentNumber: nextInstallment.installmentNumber,
    };
  };

  // Get active memberships for a student
  const getActiveMemberships = (student: StudentOption) => {
    const memberships = student.lessonMemberships || [];
    return memberships.filter((m: LessonMembership) => m.status === 'Active');
  };

  // Calculate total remaining from active memberships
  const getTotalRemainingFromMemberships = (student: StudentOption) => {
    const activeMemberships = getActiveMemberships(student);
    return activeMemberships.reduce((sum, m: LessonMembership) => sum + (m.remainingAmount || 0), 0);
  };

  // Get membership status badge color
  const getMembershipStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Expired':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Renewed':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finance.totalExpected')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExpected)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalStudents} {t('finance.students')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finance.totalCollected')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCollected)}</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={stats.collectionRate} className="h-2 flex-1" />
              <span className="text-xs font-medium">{stats.collectionRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finance.totalPending')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingCount} {t('finance.studentsWaiting')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finance.totalOverdue')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOverdue)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueCount} {t('finance.studentsOverdue')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">{t('finance.fullyPaid')}</p>
                <p className="text-3xl font-bold text-green-700">{stats.paidCount}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">{t('finance.pendingPayments')}</p>
                <p className="text-3xl font-bold text-yellow-700">{stats.pendingCount}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">{t('finance.overduePayments')}</p>
                <p className="text-3xl font-bold text-red-700">{stats.overdueCount}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Finance List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>{t('finance.studentFinances')}</CardTitle>
              <CardDescription>{t('finance.studentFinancesDesc')}</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search.students')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-[180px]">
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
            <Select value={lessonTypeFilter} onValueChange={setLessonTypeFilter}>
              <SelectTrigger className="w-[180px]">
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
          </div>

          {/* Students Table */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('empty.students')}</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('labels.student')}</TableHead>
                    <TableHead>{t('labels.lessonType')}</TableHead>
                    <TableHead className="text-right">{t('labels.totalPrice')}</TableHead>
                    <TableHead className="text-right">{t('labels.paid')}</TableHead>
                    <TableHead className="text-right">{t('labels.remaining')}</TableHead>
                    <TableHead>{t('labels.nextPayment')}</TableHead>
                    <TableHead>{t('labels.status')}</TableHead>
                    <TableHead>{t('labels.playerStatus')}</TableHead>
                    <TableHead className="text-right">{t('labels.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => {
                    const nextPayment = getNextPaymentInfo(student);
                    const progress = student.price
                      ? ((student.totalPaid || 0) / student.price) * 100
                      : 0;

                    return (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="group"
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{student.name}</span>
                            {student.email && (
                              <span className="text-xs text-muted-foreground">{student.email}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {/* Show active memberships with status */}
                            {getActiveMemberships(student).length > 0 ? (
                              getActiveMemberships(student).map((membership: LessonMembership) => (
                                <Badge
                                  key={membership.id}
                                  variant="outline"
                                  className={`text-xs ${getMembershipStatusColor(membership.status)}`}
                                >
                                  {membership.lessonType}
                                  {membership.paymentStatus === 'Gecikmiş' && (
                                    <AlertCircle className="h-3 w-3 ml-1 text-red-500" />
                                  )}
                                </Badge>
                              ))
                            ) : student.appliedLessonTypes?.length ? (
                              student.appliedLessonTypes.map((type) => (
                                <Badge key={type} variant="outline" className="text-xs">
                                  {type}
                                </Badge>
                              ))
                            ) : student.lessonType ? (
                              <Badge variant="outline" className="text-xs">
                                {student.lessonType}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(student.price || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-green-600">
                              {formatCurrency(student.totalPaid || 0)}
                            </span>
                            <Progress value={progress} className="h-1 w-16 mt-1" />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={student.remainingAmount && student.remainingAmount > 0 ? 'font-medium text-red-600' : 'text-muted-foreground'}>
                            {formatCurrency(student.remainingAmount || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {nextPayment ? (
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${nextPayment.isOverdue ? 'text-red-600' : ''}`}>
                                {formatCurrency(nextPayment.amount)}
                              </span>
                              <span className={`text-xs ${nextPayment.isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {format(nextPayment.dueDate, 'dd/MM/yyyy')}
                                {nextPayment.isOverdue && ` (${t('finance.overdue')})`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getPaymentStatusBadge(student)}</TableCell>
                        <TableCell>{getPlayerStatusBadge(student.playerStatus)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePayment(student)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                {t('actions.processPayment')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewHistory(student)}>
                                <Receipt className="mr-2 h-4 w-4" />
                                {t('actions.viewHistory')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleRenewal(student)}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                {t('actions.renewPackage')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(student)}>
                                <Snowflake className="mr-2 h-4 w-4" />
                                {t('actions.changeStatus')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AdvancedPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        student={selectedStudent}
        onSuccess={() => {
          setPaymentDialogOpen(false);
          setSelectedStudent(null);
          toast.success(t('messages.paymentProcessed'));
        }}
      />

      <PackageRenewalDialog
        open={renewalDialogOpen}
        onOpenChange={setRenewalDialogOpen}
        student={selectedStudent}
        lessons={lessons}
        onSuccess={() => {
          setRenewalDialogOpen(false);
          setSelectedStudent(null);
          toast.success(t('messages.packageRenewed'));
        }}
      />

      <StudentStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        student={selectedStudent}
        onSuccess={() => {
          setStatusDialogOpen(false);
          setSelectedStudent(null);
          toast.success(t('messages.statusUpdated'));
        }}
      />

      <PaymentHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        student={selectedStudent}
      />
    </div>
  );
}
