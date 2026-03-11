// components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

import {
  LayoutDashboard,
  CalendarDays,
  Armchair,
  Users,
  Settings,
  LogOut,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Utensils,
  PanelTop,
  BookOpen,
  Wifi,
  WifiOff,
  Printer,
  CalendarClock,
  ClipboardList,
  Megaphone,
  MessageSquare,
  Globe,
  X,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { signout } from '@/app/auth/actions';


export function Sidebar({
  dict,
  currentLocale,
  userRole,
  userName,
  onClose
}: {
  dict: any,
  currentLocale: 'en' | 'ka',
  userRole: string | null,
  userName: string,
  onClose?: () => void
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Create localized sidebar items
  const sidebarItems = [
    { icon: LayoutDashboard, label: dict.overview, href: '/dashboard' },
    { icon: CalendarDays, label: dict.calendar, href: '/dashboard/calendar' },
    { icon: Armchair, label: dict.floorPlan, href: '/dashboard/floor-plan' },
    { icon: Users, label: dict.guests, href: '/dashboard/guests' },
    { icon: MessageSquare, label: dict.inbox, href: '/dashboard/inbox' },
    { icon: ClipboardList, label: dict.menu, href: '/dashboard/menu' },
    { icon: CalendarClock, label: dict.schedule, href: '/dashboard/schedule' },
    { icon: Printer, label: dict.printManifest, href: '/dashboard/print' },
    { icon: Megaphone, label: dict.marketing, href: '/dashboard/marketing' },
    { icon: PieChart, label: dict.analytics || 'Analytics & Reports', href: '/dashboard/analytics' },
    { icon: ShieldCheck, label: dict.staff, href: '/dashboard/staff' },
    { icon: Settings, label: dict.settings, href: '/dashboard/settings' },
  ];

  const adminItems = [
    { icon: ShieldCheck, label: dict.adminOverview, href: '/dashboard/admin' },
    { icon: Utensils, label: dict.restaurants, href: '/dashboard/admin/restaurants' },
    { icon: Users, label: dict.users, href: '/dashboard/admin/users' },
    { icon: PanelTop, label: dict.tables, href: '/dashboard/admin/tables' },
    { icon: BookOpen, label: dict.bookings, href: '/dashboard/admin/bookings' },
  ];

  let navItems;
  if (userRole === 'admin') {
    navItems = adminItems;
  } else if (userRole === 'manager') {
    navItems = sidebarItems.filter(item => ![dict.settings, dict.staff].includes(item.label));
  } else if (userRole === 'host') {
    navItems = sidebarItems.filter(item => ![dict.settings, dict.staff, dict.marketing, dict.menu, dict.overview].includes(item.label));
  } else {
    navItems = sidebarItems;
  }

  return (
    <aside
      className={cn(
        'flex h-screen flex-col smooth-transition',
        'border-r',
        isCollapsed ? 'w-16' : 'w-64'
      )}
      style={{
        background: 'hsl(231 38% 5%)',
        borderColor: 'hsl(231 24% 13%)',
      }}
    >
      {/* Brand Header */}
      <div
        className="flex items-center justify-between px-4 py-5"
        style={{ borderBottom: '1px solid hsl(231 24% 13%)' }}
      >
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, hsl(347 78% 52%), hsl(318 70% 45%))' }}
            >
              <UtensilsCrossed className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-gray-900">Tablo</span>
              <span className="text-[10px] font-medium text-gray-500">
                {userRole === 'admin' ? dict.adminPanel : dict.restaurantPanel}
              </span>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg mx-auto"
            style={{ background: 'linear-gradient(135deg, hsl(347 78% 52%), hsl(318 70% 45%))' }}
          >
            <UtensilsCrossed className="h-4 w-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'hidden lg:flex h-7 w-7 items-center justify-center rounded-md smooth-transition bg-gray-100 hover:bg-gray-200 text-gray-500',
            isCollapsed && 'mx-auto'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          onClick={onClose}
          className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg smooth-transition bg-gray-100 text-gray-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Service Status (owner only) */}
      {userRole === 'restaurant_owner' && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              {dict.serviceStatus}
            </span>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold smooth-transition bg-gray-50 text-gray-600 hover:bg-gray-100"
            >
              <span
                className="h-1.5 w-1.5 rounded-full shadow-sm"
                style={{ background: isOpen ? '#10b981' : '#9ca3af' }}
              />
              {isOpen ? dict.open : dict.closed}
            </button>
          </div>
          {isOpen && (
            <p className="mt-1.5 text-[11px] text-gray-400">
              {dict.acceptingReservations}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-hide">
        {userRole === 'admin' && (
          <p
            className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400"
          >
            {dict.admin}
          </p>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg smooth-transition relative',
                isCollapsed && 'justify-center'
              )}
              style={
                isActive
                  ? {
                    background: 'hsl(347 78% 58% / 0.12)',
                    color: 'hsl(347 78% 70%)',
                    borderRight: '2px solid hsl(347 78% 58%)',
                  }
                  : {
                    color: 'hsl(220 15% 48%)',
                  }
              }
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'hsl(231 24% 13%)';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'hsl(220 20% 78%)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = '';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'hsl(220 15% 48%)';
                }
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Language Toggle & Footer */}
      <div className="p-3 space-y-1 border-t border-gray-100">
        <button
          onClick={() => {
            const newLocale = currentLocale === 'en' ? 'ka' : 'en';
            document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000;`;
            router.refresh();
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium smooth-transition hover:bg-gray-50 text-gray-500',
            isCollapsed && 'justify-center'
          )}
        >
          <Globe className="h-4 w-4" />
          {!isCollapsed && (currentLocale === 'en' ? 'ქართული' : 'English')}
        </button>

        {!isCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1 bg-gray-50"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md font-semibold text-white bg-primary text-xs"
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium truncate text-gray-900">{userName}</span>
              <span className="text-xs truncate text-gray-500 capitalize">{userRole?.replace('_', ' ')}</span>
            </div>
          </div>
        )}
        <form action={signout} className="w-full">
          <button
            type="submit"
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium smooth-transition hover:bg-gray-50 hover:text-red-500 text-gray-500',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? dict.signOut : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && dict.signOut}
          </button>
        </form>
      </div>
    </aside>
  );
}