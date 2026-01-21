'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Calendar as CalendarIcon,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Briefcase,
  FileText,
  PieChart,
  Loader2,
  RefreshCw,
  CreditCard,
  CircleDollarSign,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
import type {
  FinancialSummary,
  DateFilterType,
  DateRange,
  Employee,
} from '@/lib/types/finance';
import {
  MANUAL_INCOME_CATEGORIES,
  MANUAL_EXPENSE_CATEGORIES,
  DEPARTMENTS,
  PAYMENT_METHODS,
} from '@/lib/types/finance';

// Firebase
import {
  subscribeToFinanceData,
  calculateFinancialSummary,
  getDateRange,
  createManualIncome,
  createManualExpense,
  deleteManualIncome,
  deleteManualExpense,
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  createSalaryPayment,
  parseDate,
  FinanceDataState,
} from '@/lib/firebase/finance';

// Charts
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function FinancePage() {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const { selectedClub } = useClubStore();
  const { currentUser } = useAuthStore();

  // Data states
  const [loading, setLoading] = useState(true);
  const [financeData, setFinanceData] = useState<FinanceDataState | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filter states
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Dialog states
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);

  // Form states
  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date(),
  });
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date(),
  });
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    department: '',
    position: '',
    salary: '',
    sgkNumber: '',
    sgkRate: '34.5',
    bankAccount: '',
    phone: '',
    email: '',
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [salaryForm, setSalaryForm] = useState({
    employeeId: '',
    periodStart: new Date(),
    periodEnd: new Date(),
    deductions: '0',
    paymentMethod: 'Banka Transferi',
    notes: '',
  });

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  }, []);

  // Subscribe to finance data
  useEffect(() => {
    if (!selectedClub) return;

    setLoading(true);

    // Fetch employees
    fetchEmployees(selectedClub.id).then(setEmployees);

    // Subscribe to finance data
    console.log('Subscribing to finance data for club:', selectedClub.id);
    const unsubscribe = subscribeToFinanceData(
      selectedClub.id,
      (data) => {
        console.log('Finance data received:', {
          users: data.users.length,
          reservations: data.reservations.length,
          privateLessons: data.privateLessons.length,
          storeOrders: data.storeOrders.length,
          restaurantOrders: data.restaurantOrders.length,
          manualIncomes: data.manualIncomes.length,
          coachPayments: data.coachPayments.length,
          manualExpenses: data.manualExpenses.length,
          salaryPayments: data.salaryPayments.length,
          mealCardPayments: data.mealCardPayments.length,
          teamExpenses: data.teamExpenses.length,
          tournamentIncomes: data.tournamentIncomes.length,
          tournamentExpenses: data.tournamentExpenses.length,
          tournamentParticipantPayments: data.tournamentParticipantPayments.length,
          wallets: data.wallets.length,
        });
        setFinanceData(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error subscribing to finance data:', error);
        toast.error(t('errors.fetchFailed'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedClub, t]);

  // Calculate summary when data or filter changes
  const summary = useMemo<FinancialSummary | null>(() => {
    if (!financeData) return null;
    const dateRange = getDateRange(dateFilter, customDateRange?.start, customDateRange?.end);
    console.log('Calculating summary with dateRange:', dateRange, 'filter:', dateFilter);
    const result = calculateFinancialSummary(financeData, dateRange);
    console.log('Summary result:', {
      totalIncome: result.totalIncome,
      totalExpense: result.totalExpense,
      netProfit: result.netProfit,
      incomeBreakdownCount: result.incomeBreakdown.length,
      expenseBreakdownCount: result.expenseBreakdown.length,
    });
    return result;
  }, [financeData, dateFilter, customDateRange]);

  // Handle manual income submission
  const handleIncomeSubmit = async () => {
    if (!selectedClub || !incomeForm.amount || !incomeForm.category) {
      toast.error(t('errors.fillRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await createManualIncome(selectedClub.id, {
        amount: parseFloat(incomeForm.amount),
        category: incomeForm.category,
        description: incomeForm.description,
        date: Timestamp.fromDate(incomeForm.date),
        createdBy: currentUser?.email || 'Admin',
      });

      toast.success(t('messages.incomeAdded'));
      setIncomeDialogOpen(false);
      setIncomeForm({ amount: '', category: '', description: '', date: new Date() });
    } catch (error) {
      console.error('Error adding income:', error);
      toast.error(t('errors.addFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle manual expense submission
  const handleExpenseSubmit = async () => {
    if (!selectedClub || !expenseForm.amount || !expenseForm.category) {
      toast.error(t('errors.fillRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await createManualExpense(selectedClub.id, {
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.description,
        date: Timestamp.fromDate(expenseForm.date),
        createdBy: currentUser?.email || 'Admin',
      });

      toast.success(t('messages.expenseAdded'));
      setExpenseDialogOpen(false);
      setExpenseForm({ amount: '', category: '', description: '', date: new Date() });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error(t('errors.addFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle employee submission
  const handleEmployeeSubmit = async () => {
    if (!selectedClub || !employeeForm.name || !employeeForm.department || !employeeForm.salary) {
      toast.error(t('errors.fillRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedEmployee) {
        await updateEmployee(selectedClub.id, selectedEmployee.id, {
          name: employeeForm.name,
          department: employeeForm.department,
          position: employeeForm.position,
          salary: parseFloat(employeeForm.salary),
          sgkNumber: employeeForm.sgkNumber,
          sgkRate: parseFloat(employeeForm.sgkRate),
          bankAccount: employeeForm.bankAccount,
          phone: employeeForm.phone,
          email: employeeForm.email,
        });
        toast.success(t('messages.employeeUpdated'));
      } else {
        await createEmployee(selectedClub.id, {
          name: employeeForm.name,
          department: employeeForm.department,
          position: employeeForm.position,
          salary: parseFloat(employeeForm.salary),
          sgkNumber: employeeForm.sgkNumber,
          sgkRate: parseFloat(employeeForm.sgkRate),
          startDate: Timestamp.now(),
          bankAccount: employeeForm.bankAccount,
          phone: employeeForm.phone,
          email: employeeForm.email,
          status: 'active',
        });
        toast.success(t('messages.employeeAdded'));
      }

      // Refresh employees
      const updatedEmployees = await fetchEmployees(selectedClub.id);
      setEmployees(updatedEmployees);

      setEmployeeDialogOpen(false);
      setSelectedEmployee(null);
      setEmployeeForm({
        name: '',
        department: '',
        position: '',
        salary: '',
        sgkNumber: '',
        sgkRate: '34.5',
        bankAccount: '',
        phone: '',
        email: '',
      });
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error(t('errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle salary payment submission
  const handleSalarySubmit = async () => {
    if (!selectedClub || !salaryForm.employeeId) {
      toast.error(t('errors.fillRequired'));
      return;
    }

    const employee = employees.find((e) => e.id === salaryForm.employeeId);
    if (!employee) return;

    setIsSubmitting(true);
    try {
      const deductions = parseFloat(salaryForm.deductions) || 0;
      const sgkPremium = employee.salary * (employee.sgkRate / 100);
      const netSalary = employee.salary - deductions - sgkPremium;

      await createSalaryPayment(selectedClub.id, {
        employeeId: employee.id,
        employeeName: employee.name,
        grossSalary: employee.salary,
        netSalary,
        deductions,
        sgkPremium,
        paymentDate: Timestamp.now(),
        periodStart: Timestamp.fromDate(salaryForm.periodStart),
        periodEnd: Timestamp.fromDate(salaryForm.periodEnd),
        paymentStatus: 'Ödendi',
        paymentMethod: salaryForm.paymentMethod,
        notes: salaryForm.notes,
      });

      toast.success(t('messages.salaryPaid'));
      setSalaryDialogOpen(false);
      setSalaryForm({
        employeeId: '',
        periodStart: new Date(),
        periodEnd: new Date(),
        deductions: '0',
        paymentMethod: 'Banka Transferi',
        notes: '',
      });
    } catch (error) {
      console.error('Error processing salary:', error);
      toast.error(t('errors.salaryFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedClub || !itemToDelete) return;

    setIsDeleting(true);
    try {
      switch (itemToDelete.type) {
        case 'income':
          await deleteManualIncome(selectedClub.id, itemToDelete.id);
          toast.success(t('messages.incomeDeleted'));
          break;
        case 'expense':
          await deleteManualExpense(selectedClub.id, itemToDelete.id);
          toast.success(t('messages.expenseDeleted'));
          break;
        case 'employee':
          await deleteEmployee(selectedClub.id, itemToDelete.id);
          toast.success(t('messages.employeeDeleted'));
          const updatedEmployees = await fetchEmployees(selectedClub.id);
          setEmployees(updatedEmployees);
          break;
      }

      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(t('errors.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Edit employee
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      department: employee.department,
      position: employee.position,
      salary: employee.salary.toString(),
      sgkNumber: employee.sgkNumber,
      sgkRate: employee.sgkRate.toString(),
      bankAccount: employee.bankAccount || '',
      phone: employee.phone || '',
      email: employee.email || '',
    });
    setEmployeeDialogOpen(true);
  };

  // Filter incomes/expenses
  const filteredIncomes = useMemo(() => {
    if (!financeData) return [];
    const dateRange = getDateRange(dateFilter, customDateRange?.start, customDateRange?.end);
    return financeData.manualIncomes.filter((i) => {
      const date = parseDate(i.date);
      if (!date || date < dateRange.start || date > dateRange.end) return false;
      if (searchQuery) {
        return i.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.category?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [financeData, dateFilter, customDateRange, searchQuery]);

  const filteredExpenses = useMemo(() => {
    if (!financeData) return [];
    const dateRange = getDateRange(dateFilter, customDateRange?.start, customDateRange?.end);
    return financeData.manualExpenses.filter((e) => {
      const date = parseDate(e.date);
      if (!date || date < dateRange.start || date > dateRange.end) return false;
      if (searchQuery) {
        return e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.category?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [financeData, dateFilter, customDateRange, searchQuery]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    return employees.filter((e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilterType)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="today">{t('filters.today')}</SelectItem>
              <SelectItem value="week">{t('filters.week')}</SelectItem>
              <SelectItem value="month">{t('filters.month')}</SelectItem>
              <SelectItem value="year">{t('filters.year')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">{t('stats.totalIncome')}</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalIncome || 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">{t('stats.totalExpense')}</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalExpense || 0)}</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-2",
          (summary?.netProfit || 0) >= 0
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300"
            : "bg-orange-50 dark:bg-orange-950/20 border-orange-300"
        )}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={cn("h-4 w-4", (summary?.netProfit || 0) >= 0 ? "text-emerald-600" : "text-orange-600")} />
              <span className="text-sm text-muted-foreground">{t('stats.netProfit')}</span>
            </div>
            <p className={cn("text-2xl font-bold", (summary?.netProfit || 0) >= 0 ? "text-emerald-600" : "text-orange-600")}>
              {formatCurrency(summary?.netProfit || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">{t('stats.walletPool')}</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary?.walletPoolTotal || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">{t('stats.negativeBalance')}</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary?.negativeBalanceTotal || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">{t('stats.discountApplied')}</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary?.discountApplied || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.income')}</span>
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.expense')}</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.employees')}</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.reports')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Income Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownLeft className="h-5 w-5 text-green-600" />
                  {t('overview.incomeBreakdown')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.incomeBreakdown && summary.incomeBreakdown.length > 0 ? (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-48 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={summary.incomeBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            dataKey="value"
                          >
                            {summary.incomeBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(typeof value === 'number' ? value : 0)} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {summary.incomeBreakdown
                        .sort((a, b) => b.value - a.value)
                        .map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-sm">{item.label}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(item.value)}</p>
                              <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">{t('overview.noData')}</p>
                )}
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-red-600" />
                  {t('overview.expenseBreakdown')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.expenseBreakdown && summary.expenseBreakdown.length > 0 ? (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-48 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={summary.expenseBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            dataKey="value"
                          >
                            {summary.expenseBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(typeof value === 'number' ? value : 0)} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {summary.expenseBreakdown
                        .sort((a, b) => b.value - a.value)
                        .map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-sm">{item.label}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(item.value)}</p>
                              <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">{t('overview.noData')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.quickStats')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>{t('reports.totalEmployees')}</span>
                </div>
                <span className="text-xl font-bold">{employees.length}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <span>{t('reports.totalWallets')}</span>
                </div>
                <span className="text-xl font-bold">{financeData?.wallets.length || 0}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>Aktif Üyeler</span>
                </div>
                <span className="text-xl font-bold">
                  {financeData?.users.filter((u) => u.status === 'active').length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <span>Rezervasyonlar</span>
                </div>
                <span className="text-xl font-bold">
                  {financeData?.reservations.filter((r) => r.status === 'active' || r.status === 'completed').length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Tab */}
        <TabsContent value="income" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={() => setIncomeDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('actions.addIncome')}
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.date')}</TableHead>
                    <TableHead>{t('table.category')}</TableHead>
                    <TableHead>{t('table.description')}</TableHead>
                    <TableHead className="text-right">{t('table.amount')}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncomes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t('table.noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIncomes.map((income) => {
                      const date = parseDate(income.date);
                      return (
                        <TableRow key={income.id}>
                          <TableCell>{date ? format(date, 'dd.MM.yyyy', { locale: tr }) : '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50">
                              {income.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{income.description || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            +{formatCurrency(income.amount)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setItemToDelete({ type: 'income', id: income.id, name: income.description || income.category });
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {tCommon('delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expense Tab */}
        <TabsContent value="expense" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={() => setExpenseDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('actions.addExpense')}
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.date')}</TableHead>
                    <TableHead>{t('table.category')}</TableHead>
                    <TableHead>{t('table.description')}</TableHead>
                    <TableHead className="text-right">{t('table.amount')}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t('table.noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => {
                      const date = parseDate(expense.date);
                      return (
                        <TableRow key={expense.id}>
                          <TableCell>{date ? format(date, 'dd.MM.yyyy', { locale: tr }) : '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-50">
                              {expense.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{expense.description || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            -{formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setItemToDelete({ type: 'expense', id: expense.id, name: expense.description || expense.category });
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {tCommon('delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search.employeePlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setSalaryDialogOpen(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                {t('actions.paySalary')}
              </Button>
              <Button onClick={() => {
                setSelectedEmployee(null);
                setEmployeeForm({
                  name: '',
                  department: '',
                  position: '',
                  salary: '',
                  sgkNumber: '',
                  sgkRate: '34.5',
                  bankAccount: '',
                  phone: '',
                  email: '',
                });
                setEmployeeDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('actions.addEmployee')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t('employees.empty')}</h3>
                <p className="text-muted-foreground">{t('employees.emptyDesc')}</p>
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <Card key={employee.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{employee.name}</h3>
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {tCommon('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setItemToDelete({ type: 'employee', id: employee.id, name: employee.name });
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {tCommon('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t('employees.department')}</p>
                        <p className="font-medium">{employee.department}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('employees.salary')}</p>
                        <p className="font-medium">{formatCurrency(employee.salary)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('employees.sgkRate')}</p>
                        <p className="font-medium">%{employee.sgkRate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('employees.status')}</p>
                        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                          {employee.status === 'active' ? t('employees.active') : t('employees.inactive')}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Income vs Expense Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.comparison')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: t('stats.totalIncome'), value: summary?.totalIncome || 0, fill: '#22C55E' },
                        { name: t('stats.totalExpense'), value: summary?.totalExpense || 0, fill: '#EF4444' },
                        { name: t('stats.netProfit'), value: summary?.netProfit || 0, fill: (summary?.netProfit || 0) >= 0 ? '#10B981' : '#F97316' },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value) => formatCurrency(typeof value === 'number' ? value : 0)} />
                      <Bar dataKey="value">
                        {[
                          { fill: '#22C55E' },
                          { fill: '#EF4444' },
                          { fill: (summary?.netProfit || 0) >= 0 ? '#10B981' : '#F97316' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.quickStats')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span>{t('reports.totalEmployees')}</span>
                  </div>
                  <span className="text-xl font-bold">{employees.length}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                    <span>{t('reports.totalWallets')}</span>
                  </div>
                  <span className="text-xl font-bold">{financeData?.wallets.length || 0}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
                    <span>{t('reports.avgIncome')}</span>
                  </div>
                  <span className="text-xl font-bold">
                    {formatCurrency((summary?.totalIncome || 0) / (summary?.incomeBreakdown?.length || 1))}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <span>{t('reports.monthlySalary')}</span>
                  </div>
                  <span className="text-xl font-bold">
                    {formatCurrency(employees.reduce((sum, e) => sum + e.salary, 0))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Income Dialog */}
      <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialogs.addIncome.title')}</DialogTitle>
            <DialogDescription>{t('dialogs.addIncome.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('form.amount')}</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('form.category')}</Label>
              <Select
                value={incomeForm.category}
                onValueChange={(v) => setIncomeForm((prev) => ({ ...prev, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_INCOME_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t('form.description')}</Label>
              <Textarea
                placeholder={t('form.descriptionPlaceholder')}
                value={incomeForm.description}
                onChange={(e) => setIncomeForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('form.date')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(incomeForm.date, 'dd.MM.yyyy', { locale: tr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={incomeForm.date}
                    onSelect={(date) => date && setIncomeForm((prev) => ({ ...prev, date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIncomeDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleIncomeSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialogs.addExpense.title')}</DialogTitle>
            <DialogDescription>{t('dialogs.addExpense.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('form.amount')}</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('form.category')}</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(v) => setExpenseForm((prev) => ({ ...prev, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t('form.description')}</Label>
              <Textarea
                placeholder={t('form.descriptionPlaceholder')}
                value={expenseForm.description}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('form.date')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(expenseForm.date, 'dd.MM.yyyy', { locale: tr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expenseForm.date}
                    onSelect={(date) => date && setExpenseForm((prev) => ({ ...prev, date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleExpenseSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? t('dialogs.editEmployee.title') : t('dialogs.addEmployee.title')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-1.5">
              <Label>{t('form.name')}</Label>
              <Input
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('form.department')}</Label>
                <Select
                  value={employeeForm.department}
                  onValueChange={(v) => setEmployeeForm((prev) => ({ ...prev, department: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.selectDepartment')} />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t('form.position')}</Label>
                <Input
                  value={employeeForm.position}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, position: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('form.salary')}</Label>
                <Input
                  type="number"
                  value={employeeForm.salary}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, salary: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('form.sgkRate')}</Label>
                <Input
                  type="number"
                  value={employeeForm.sgkRate}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, sgkRate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t('form.sgkNumber')}</Label>
              <Input
                value={employeeForm.sgkNumber}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, sgkNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('form.bankAccount')}</Label>
              <Input
                value={employeeForm.bankAccount}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, bankAccount: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('form.phone')}</Label>
                <Input
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('form.email')}</Label>
                <Input
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmployeeDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleEmployeeSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Payment Dialog */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialogs.paySalary.title')}</DialogTitle>
            <DialogDescription>{t('dialogs.paySalary.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('form.selectEmployee')}</Label>
              <Select
                value={salaryForm.employeeId}
                onValueChange={(v) => setSalaryForm((prev) => ({ ...prev, employeeId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.selectEmployeePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter((e) => e.status === 'active').map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} - {formatCurrency(emp.salary)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('form.periodStart')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(salaryForm.periodStart, 'dd.MM.yyyy', { locale: tr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={salaryForm.periodStart}
                      onSelect={(date) => date && setSalaryForm((prev) => ({ ...prev, periodStart: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label>{t('form.periodEnd')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(salaryForm.periodEnd, 'dd.MM.yyyy', { locale: tr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={salaryForm.periodEnd}
                      onSelect={(date) => date && setSalaryForm((prev) => ({ ...prev, periodEnd: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('form.deductions')}</Label>
                <Input
                  type="number"
                  value={salaryForm.deductions}
                  onChange={(e) => setSalaryForm((prev) => ({ ...prev, deductions: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('form.paymentMethod')}</Label>
                <Select
                  value={salaryForm.paymentMethod}
                  onValueChange={(v) => setSalaryForm((prev) => ({ ...prev, paymentMethod: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t('form.notes')}</Label>
              <Textarea
                value={salaryForm.notes}
                onChange={(e) => setSalaryForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {salaryForm.employeeId && (
              <Card className="bg-muted">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {(() => {
                      const emp = employees.find((e) => e.id === salaryForm.employeeId);
                      if (!emp) return null;
                      const deductions = parseFloat(salaryForm.deductions) || 0;
                      const sgkPremium = emp.salary * (emp.sgkRate / 100);
                      const netSalary = emp.salary - deductions - sgkPremium;
                      return (
                        <>
                          <div>{t('form.grossSalary')}:</div>
                          <div className="font-medium">{formatCurrency(emp.salary)}</div>
                          <div>{t('form.sgkPremium')}:</div>
                          <div className="font-medium text-red-600">-{formatCurrency(sgkPremium)}</div>
                          <div>{t('form.deductions')}:</div>
                          <div className="font-medium text-red-600">-{formatCurrency(deductions)}</div>
                          <Separator className="col-span-2 my-2" />
                          <div>{t('form.netSalary')}:</div>
                          <div className="font-bold text-green-600">{formatCurrency(netSalary)}</div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSalaryDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSalarySubmit} disabled={isSubmitting || !salaryForm.employeeId}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('actions.paySalary')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.delete.description', { name: itemToDelete?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
