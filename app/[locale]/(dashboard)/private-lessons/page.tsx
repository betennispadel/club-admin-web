'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Users, UserCog, Calendar, Mail, GraduationCap, DollarSign } from 'lucide-react';

// Import types
import type {
  Lesson,
  Coach,
  StudentOption,
  Request,
  TemplateRequest,
} from '@/lib/types/private-lessons';

// Import Firebase functions
import {
  subscribeToLessons,
  subscribeToStudents,
  subscribeToCoaches,
  subscribeToRequests,
  fetchTemplateRequests,
} from '@/lib/firebase/private-lessons';

// Import Tab Components
import LessonsTab from './components/LessonsTab';
import StudentsTab from './components/StudentsTab';
import CoachesTab from './components/CoachesTab';
import AttendanceTab from './components/AttendanceTab';
import RequestsTab from './components/RequestsTab';
import FinanceTab from './components/FinanceTab';

export default function PrivateLessonsPage() {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();
  const { hasPermission } = useAuthStore();

  // Data States
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [templateRequests, setTemplateRequests] = useState<TemplateRequest[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lessons');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingTemplatesCount, setPendingTemplatesCount] = useState(0);

  // Check permission
  const canManagePrivateLessons = hasPermission('privateLessonArea');

  // Refresh callback for child components
  const handleRefresh = useCallback(async () => {
    if (!selectedClub) return;
    // Subscriptions will automatically refresh data
    toast.success(t('messages.refreshed'));
  }, [selectedClub, t]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!selectedClub) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to lessons
    const unsubLessons = subscribeToLessons(selectedClub.id, (data) => {
      setLessons(data);
      setLoading(false);
    });
    unsubscribers.push(unsubLessons);

    // Subscribe to students
    const unsubStudents = subscribeToStudents(selectedClub.id, (data) => {
      setStudents(data);
    });
    unsubscribers.push(unsubStudents);

    // Subscribe to coaches
    const unsubCoaches = subscribeToCoaches(selectedClub.id, (data) => {
      setCoaches(data);
    });
    unsubscribers.push(unsubCoaches);

    // Subscribe to requests
    const unsubRequests = subscribeToRequests(selectedClub.id, (data, pendingCount) => {
      setRequests(data);
      setPendingRequestsCount(pendingCount);
    });
    unsubscribers.push(unsubRequests);

    // Fetch template requests (not real-time for now)
    const loadTemplateRequests = async () => {
      try {
        const { templateRequests: templates } = await fetchTemplateRequests(selectedClub.id);
        setTemplateRequests(templates);
        setPendingTemplatesCount(templates.filter(t => t.status === 'Onay Bekliyor').length);
      } catch (error) {
        console.error('Error fetching template requests:', error);
      }
    };
    loadTemplateRequests();

    // Cleanup subscriptions
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [selectedClub]);

  if (!canManagePrivateLessons) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">
            {t('errors.noPermission')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{lessons.length}</div>
            <div className="text-xs text-muted-foreground">{t('stats.lessons')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{students.length}</div>
            <div className="text-xs text-muted-foreground">{t('stats.students')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{coaches.length}</div>
            <div className="text-xs text-muted-foreground">{t('stats.coaches')}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="lessons" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.lessons')}</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.students')}</span>
          </TabsTrigger>
          <TabsTrigger value="coaches" className="gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.coaches')}</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.attendance')}</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.finance')}</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2 relative">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.requests')}</span>
            {pendingRequestsCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {pendingRequestsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="lessons" className="mt-6">
                <LessonsTab
                  lessons={lessons}
                  students={students}
                  coaches={coaches}
                  onRefresh={handleRefresh}
                />
              </TabsContent>

              <TabsContent value="students" className="mt-6">
                <StudentsTab
                  students={students}
                  lessons={lessons}
                  onRefresh={handleRefresh}
                />
              </TabsContent>

              <TabsContent value="coaches" className="mt-6">
                <CoachesTab
                  coaches={coaches}
                  lessons={lessons}
                  onRefresh={handleRefresh}
                />
              </TabsContent>

              <TabsContent value="attendance" className="mt-6">
                <AttendanceTab
                  lessons={lessons}
                  students={students}
                  onRefresh={handleRefresh}
                />
              </TabsContent>

              <TabsContent value="finance" className="mt-6">
                <FinanceTab
                  students={students}
                  lessons={lessons}
                  onRefresh={handleRefresh}
                />
              </TabsContent>

              <TabsContent value="requests" className="mt-6">
                <RequestsTab
                  requests={requests}
                  templateRequests={templateRequests}
                  students={students}
                  pendingCount={pendingRequestsCount}
                  pendingTemplatesCount={pendingTemplatesCount}
                  onRefresh={handleRefresh}
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        )}
      </Tabs>
    </div>
  );
}
