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
              <span className="text-sm font-bold tracking-tight text-white">Tablo</span>
              <span className="text-[10px] font-medium" style={{ color: 'hsl(220 15% 45%)' }}>
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
            'hidden lg:flex h-7 w-7 items-center justify-center rounded-md smooth-transition',
            isCollapsed && 'mx-auto'
          )}
          style={{
            background: 'hsl(231 24% 13%)',
            color: 'hsl(220 15% 50%)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'hsl(220 20% 80%)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'hsl(220 15% 50%)';
          }}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          onClick={onClose}
          className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg smooth-transition"
          style={{
            background: 'hsl(231 24% 13%)',
            color: 'hsl(220 15% 50%)',
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Service Status (owner only) */}
      {userRole === 'restaurant_owner' && !isCollapsed && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid hsl(231 24% 13%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'hsl(220 15% 50%)' }}>
              {dict.serviceStatus}
            </span>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold smooth-transition"
              style={
                isOpen
                  ? { background: 'hsl(160 60% 45% / 0.15)', color: 'hsl(160 60% 60%)', border: '1px solid hsl(160 60% 45% / 0.25)' }
                  : { background: 'hsl(231 24% 16%)', color: 'hsl(220 15% 45%)', border: '1px solid hsl(231 24% 20%)' }
              }
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: isOpen ? 'hsl(160 60% 55%)' : 'hsl(220 15% 40%)' }}
              />
              {isOpen ? dict.open : dict.closed}
            </button>
          </div>
          {isOpen && (
            <p className="mt-1.5 text-[11px]" style={{ color: 'hsl(220 15% 38%)' }}>
              {dict.acceptingReservations}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-hide">
        {userRole === 'admin' && !isCollapsed && (
          <p
            className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'hsl(220 15% 35%)' }}
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
      <div style={{ borderTop: '1px solid hsl(231 24% 13%)' }} className="p-3 space-y-1">
        <button
          onClick={() => {
            const newLocale = currentLocale === 'en' ? 'ka' : 'en';
            document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000;`;
            router.refresh();
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium smooth-transition hover:bg-white/5',
            isCollapsed && 'justify-center'
          )}
          style={{ color: 'hsl(220 15% 65%)' }}
        >
          <Globe className="h-4 w-4" />
          {!isCollapsed && (currentLocale === 'en' ? 'ქართული' : 'English')}
        </button>

        {!isCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1"
            style={{ background: 'hsl(231 24% 11%)' }}
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(347 78% 50%), hsl(262 60% 50%))' }}
            >
              {userName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[10px] capitalize" style={{ color: 'hsl(220 15% 40%)' }}>
                {userRole?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
        <form action={signout}>
          <button
            type="submit"
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium smooth-transition',
              isCollapsed && 'justify-center'
            )}
            style={{ color: 'hsl(220 15% 42%)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'hsl(347 78% 58% / 0.08)';
              (e.currentTarget as HTMLButtonElement).style.color = 'hsl(347 78% 65%)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '';
              (e.currentTarget as HTMLButtonElement).style.color = 'hsl(220 15% 42%)';
            }}
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