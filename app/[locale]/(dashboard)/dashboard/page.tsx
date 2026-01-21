'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuthStore } from '@/stores/authStore';
import { useClubStore } from '@/stores/clubStore';
import {
  getClubCollection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  Trophy,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Clock,
  MapPin,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

function StatCard({ title, value, description, icon: Icon, trend, color = 'primary' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="text-2xl font-bold mt-1">{value}</h3>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
              {trend && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{trend.value}%</span>
                </div>
              )}
            </div>
            <div className={`h-12 w-12 rounded-full bg-${color}/10 flex items-center justify-center`}>
              <Icon className={`h-6 w-6 text-${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Demo data for charts
const revenueData = [
  { name: 'Mon', value: 2400 },
  { name: 'Tue', value: 1398 },
  { name: 'Wed', value: 9800 },
  { name: 'Thu', value: 3908 },
  { name: 'Fri', value: 4800 },
  { name: 'Sat', value: 8800 },
  { name: 'Sun', value: 4300 },
];

const reservationData = [
  { name: '08:00', reservations: 4 },
  { name: '10:00', reservations: 8 },
  { name: '12:00', reservations: 5 },
  { name: '14:00', reservations: 10 },
  { name: '16:00', reservations: 12 },
  { name: '18:00', reservations: 15 },
  { name: '20:00', reservations: 8 },
];

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { userProfile } = useAuthStore();
  const { selectedClub } = useClubStore();

  const [stats, setStats] = useState({
    totalUsers: 0,
    todayReservations: 0,
    activeReservations: 0,
    monthlyRevenue: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!selectedClub) return;

      try {
        // Fetch users count
        const usersRef = getClubCollection(selectedClub.id, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const totalUsers = usersSnapshot.size;

        // Fetch today's reservations
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reservationsRef = getClubCollection(selectedClub.id, 'reservations');

        // For demo, use mock data
        setStats({
          totalUsers: totalUsers || 128,
          todayReservations: 24,
          activeReservations: 8,
          monthlyRevenue: 45680,
        });

        // Mock recent activity
        setRecentActivity([
          {
            id: 1,
            type: 'reservation',
            user: 'John Doe',
            action: 'made a reservation',
            time: '5 minutes ago',
          },
          {
            id: 2,
            type: 'payment',
            user: 'Jane Smith',
            action: 'added balance',
            amount: 500,
            time: '15 minutes ago',
          },
          {
            id: 3,
            type: 'tournament',
            user: 'Admin',
            action: 'created new tournament',
            time: '1 hour ago',
          },
          {
            id: 4,
            type: 'user',
            user: 'Mike Johnson',
            action: 'registered',
            time: '2 hours ago',
          },
        ]);

        // Mock upcoming tournaments
        setUpcomingTournaments([
          {
            id: 1,
            name: 'Summer Championship',
            date: '2024-02-15',
            participants: 32,
            maxParticipants: 64,
          },
          {
            id: 2,
            name: 'Weekend Open',
            date: '2024-02-10',
            participants: 16,
            maxParticipants: 16,
          },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedClub]);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t('welcome')}, {userProfile?.name || 'Admin'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening at {selectedClub?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/reservations/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Reservation
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('totalUsers')}
          value={stats.totalUsers}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title={t('todayReservations')}
          value={stats.todayReservations}
          icon={Calendar}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title={t('activeReservations')}
          value={stats.activeReservations}
          icon={Clock}
        />
        <StatCard
          title={t('monthlyRevenue')}
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Weekly Revenue</CardTitle>
              <CardDescription>Revenue overview for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Court Occupancy Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('courtOccupancy')}</CardTitle>
              <CardDescription>Reservations by time slot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reservationData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar
                      dataKey="reservations"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('recentActivity')}</CardTitle>
                <CardDescription>Latest actions in your club</CardDescription>
              </div>
              <Link href="/activity">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {activity.type === 'reservation' && <Calendar className="h-4 w-4 text-primary" />}
                        {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-green-600" />}
                        {activity.type === 'tournament' && <Trophy className="h-4 w-4 text-yellow-600" />}
                        {activity.type === 'user' && <Users className="h-4 w-4 text-blue-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {activity.user} {activity.action}
                          {activity.amount && ` ($${activity.amount})`}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Tournaments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('upcomingTournaments')}</CardTitle>
                <CardDescription>Scheduled tournaments</CardDescription>
              </div>
              <Link href="/tournaments">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">{tournament.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tournament.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={tournament.participants >= tournament.maxParticipants ? 'destructive' : 'secondary'}>
                      {tournament.participants}/{tournament.maxParticipants}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('quickActions')}</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Link href="/users/new">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>Add Member</span>
                </Button>
              </Link>
              <Link href="/reservations/new">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <Calendar className="h-6 w-6" />
                  <span>New Reservation</span>
                </Button>
              </Link>
              <Link href="/tournaments/new">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <Trophy className="h-6 w-6" />
                  <span>Create Tournament</span>
                </Button>
              </Link>
              <Link href="/notifications/send">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <MapPin className="h-6 w-6" />
                  <span>Send Notification</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
