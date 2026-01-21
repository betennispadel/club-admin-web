'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/stores/authStore';
import { useClubStore } from '@/stores/clubStore';
import {
  getClubCollection,
  query,
  where,
  getDocs,
} from '@/lib/firebase/firestore';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { saveSession, getStoredSession, setPermissionsLoading } = useAuthStore();
  const { selectedClub, addLoggedInClub, saveClubSession, getClubSession } = useClubStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load saved session on mount
  useEffect(() => {
    // First check club-specific session
    if (selectedClub) {
      const clubSession = getClubSession(selectedClub.id);
      if (clubSession) {
        setEmail(clubSession.email);
        setRememberMe(true);
        return;
      }
    }

    // Fallback to global session
    const storedSession = getStoredSession();
    if (storedSession) {
      setEmail(storedSession.email);
      setRememberMe(true);
    }
  }, [selectedClub, getClubSession, getStoredSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClub) {
      toast.error('Please select a club first');
      router.push('/select-club');
      return;
    }

    setLoading(true);
    setPermissionsLoading(true);

    try {
      // Set persistence based on "remember me" checkbox
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user exists in club's users collection
      const usersRef = getClubCollection(selectedClub.id, 'users');
      const usersQuery = query(usersRef, where('email', '==', email));
      const userSnapshot = await getDocs(usersQuery);

      if (userSnapshot.empty) {
        // User not found in this club
        toast.error(t('errors.invalidCredentials'));
        await auth.signOut();
        setLoading(false);
        setPermissionsLoading(false);
        return;
      }

      const userData = userSnapshot.docs[0].data();

      // Check for 2FA
      if (userData.twoFactorEnabled) {
        // TODO: Implement 2FA flow
        router.push('/two-factor');
        return;
      }

      // Add club to logged in clubs
      addLoggedInClub(selectedClub.id);

      // Save session data if "remember me" is checked
      if (rememberMe) {
        saveSession(email);
        saveClubSession(selectedClub.id, email);
      }

      toast.success(t('login'));
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setPermissionsLoading(false);

      let errorMessage = t('errors.loginFailed');
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = t('errors.invalidCredentials');
          break;
        case 'auth/too-many-requests':
          errorMessage = t('errors.tooManyAttempts');
          break;
        case 'auth/network-request-failed':
          errorMessage = t('errors.networkError');
          break;
        default:
          errorMessage = error.message || t('errors.unknownError');
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          {selectedClub?.logo ? (
            <img
              src={selectedClub.logo}
              alt={selectedClub.name}
              className="h-16 w-16 mx-auto mb-2 rounded-full object-cover"
            />
          ) : (
            <div
              className="h-16 w-16 mx-auto mb-2 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: selectedClub?.themeColor || '#007BFF' }}
            >
              {selectedClub?.name?.charAt(0) || 'T'}
            </div>
          )}
          <CardTitle className="text-2xl font-bold">{t('loginTitle')}</CardTitle>
          <CardDescription>
            {selectedClub?.name || t('loginSubtitle')}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('password')}</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={loading}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer"
              >
                {t('rememberMe')}
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                t('signIn')
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              <Link
                href="/select-club"
                className="text-primary hover:underline"
              >
                Change Club
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
