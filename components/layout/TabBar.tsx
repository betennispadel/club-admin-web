'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import {
  LayoutDashboard,
  Users,
  Calendar,
  MapPin,
  Trophy,
  Medal,
  GraduationCap,
  Users2,
  DollarSign,
  Wallet,
  UserCog,
  CreditCard,
  Shield,
  UtensilsCrossed,
  ShoppingBag,
  Newspaper,
  Image,
  Percent,
  Bell,
  AlertCircle,
  Gamepad2,
  Dumbbell,
  BarChart3,
  Building2,
  Globe,
  CreditCard as PayIcon,
  Key,
  Megaphone,
  CalendarDays,
  Store,
  ChevronDown,
  Menu,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Permissions } from '@/lib/types';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: keyof Permissions;
};

type NavGroup = {
  name: string;
  key: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    name: 'management',
    key: 'management',
    items: [
      { name: 'dashboard', href: '/', icon: LayoutDashboard },
      { name: 'users', href: '/users', icon: Users, permission: 'usersManagement' },
      { name: 'reservations', href: '/reservations', icon: Calendar, permission: 'reservationsManagement' },
      { name: 'courts', href: '/courts', icon: MapPin, permission: 'courtManagements' },
    ],
  },
  {
    name: 'sports',
    key: 'sports',
    items: [
      { name: 'tournaments', href: '/tournaments', icon: Trophy, permission: 'tournamentsManagement' },
      { name: 'leagues', href: '/leagues', icon: Medal, permission: 'tournamentsManagement' },
      { name: 'privateLessons', href: '/private-lessons', icon: GraduationCap, permission: 'privateLessonArea' },
      { name: 'teams', href: '/teams', icon: Users2, permission: 'teamManagement' },
      { name: 'trainingPool', href: '/training-pool', icon: Dumbbell, permission: 'trainingPool' },
      { name: 'gameCenter', href: '/game-center', icon: Gamepad2, permission: 'gameCenter' },
    ],
  },
  {
    name: 'finance',
    key: 'finance',
    items: [
      { name: 'finance', href: '/finance', icon: DollarSign, permission: 'financialManagements' },
      { name: 'wallets', href: '/wallets', icon: Wallet, permission: 'walletManagements' },
      { name: 'employees', href: '/employees', icon: UserCog, permission: 'employeeSalaryManagement' },
      { name: 'mealCards', href: '/meal-cards', icon: CreditCard, permission: 'mealCardManagement' },
      { name: 'discounts', href: '/discounts', icon: Percent, permission: 'discountManagement' },
      { name: 'payManagement', href: '/pay-management', icon: PayIcon, permission: 'payManagement' },
    ],
  },
  {
    name: 'content',
    key: 'content',
    items: [
      { name: 'restaurant', href: '/restaurant', icon: UtensilsCrossed, permission: 'restaurantManagement' },
      { name: 'store', href: '/store', icon: ShoppingBag, permission: 'storeManagement' },
      { name: 'magazine', href: '/magazine', icon: Newspaper, permission: 'magazineManagement' },
      { name: 'sliders', href: '/sliders', icon: Image, permission: 'sliderManagement' },
      { name: 'notifications', href: '/notifications', icon: Bell, permission: 'notificationsManagement' },
      { name: 'problems', href: '/problems', icon: AlertCircle, permission: 'problemManagement' },
      { name: 'ads', href: '/ads', icon: Megaphone, permission: 'adsManagement' },
      { name: 'events', href: '/events', icon: CalendarDays },
    ],
  },
  {
    name: 'settings',
    key: 'settings',
    items: [
      { name: 'roles', href: '/roles', icon: Shield, permission: 'roles' },
      { name: 'myClub', href: '/my-club', icon: Building2, permission: 'myClubManager' },
      { name: 'localeSettings', href: '/locale-settings', icon: Globe, permission: 'localeSettings' },
      { name: 'apiKeys', href: '/api-keys', icon: Key, permission: 'apiManagement' },
      { name: 'occupancy', href: '/occupancy', icon: BarChart3, permission: 'occupancyManagement' },
      { name: 'appStore', href: '/app-store', icon: Store },
    ],
  },
];

export function TabBar() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const { hasPermission } = useAuthStore();
  const { activeTabGroup, setActiveTabGroup, sidebarOpen, setSidebarOpen } = useUIStore();
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Filter items based on permissions
  const getFilteredItems = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
  };

  // Check if current path is in a group
  const isGroupActive = (group: NavGroup) => {
    return group.items.some((item) => {
      const itemPath = item.href === '/' ? '/' : item.href;
      return pathname === itemPath || pathname.startsWith(itemPath + '/');
    });
  };

  // Get active item in current group
  const getActiveItem = () => {
    for (const group of navGroups) {
      for (const item of group.items) {
        const itemPath = item.href === '/' ? '/' : item.href;
        if (pathname === itemPath || pathname.startsWith(itemPath + '/')) {
          return item;
        }
      }
    }
    return null;
  };

  const activeItem = getActiveItem();

  // Desktop Tab Bar
  const DesktopTabBar = () => (
    <div className="hidden md:flex items-center gap-1 bg-background/80 backdrop-blur-md border-b px-4 h-14">
      {navGroups.map((group) => {
        const filteredItems = getFilteredItems(group.items);
        if (filteredItems.length === 0) return null;

        const isActive = isGroupActive(group);
        const isOpen = openDropdown === group.key;

        return (
          <DropdownMenu
            key={group.key}
            open={isOpen}
            onOpenChange={(open) => setOpenDropdown(open ? group.key : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onMouseEnter={() => setHoveredGroup(group.key)}
                onMouseLeave={() => setHoveredGroup(null)}
              >
                {t(`groups.${group.name}`)}
                <ChevronDown className={cn(
                  "ml-1 h-4 w-4 transition-transform",
                  isOpen && "rotate-180"
                )} />
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{t(`groups.${group.name}`)}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isItemActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href + '/'));

                return (
                  <DropdownMenuItem
                    key={item.href}
                    asChild
                    onSelect={() => setOpenDropdown(null)}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer',
                        isItemActive && 'bg-primary/10 text-primary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t(item.name)}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );

  // Mobile Navigation
  const MobileNav = () => (
    <div className="md:hidden flex items-center justify-between bg-background/80 backdrop-blur-md border-b px-4 h-14">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <ScrollArea className="h-full py-6">
            <div className="px-4 space-y-6">
              {navGroups.map((group) => {
                const filteredItems = getFilteredItems(group.items);
                if (filteredItems.length === 0) return null;

                return (
                  <div key={group.key}>
                    <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t(`groups.${group.name}`)}
                    </h3>
                    <div className="space-y-1">
                      {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isItemActive =
                          pathname === item.href ||
                          (item.href !== '/' && pathname.startsWith(item.href + '/'));

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                              isItemActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {t(item.name)}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Current page indicator */}
      {activeItem && (
        <div className="flex items-center gap-2">
          <activeItem.icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{t(activeItem.name)}</span>
        </div>
      )}

      <div className="w-10" /> {/* Spacer for centering */}
    </div>
  );

  return (
    <>
      <DesktopTabBar />
      <MobileNav />
    </>
  );
}
