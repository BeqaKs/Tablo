'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { signout } from '@/app/auth/actions';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: CalendarDays, label: 'Calendar', href: '/dashboard/calendar' },
  { icon: Armchair, label: 'Floor Plan', href: '/dashboard/floor-plan' },
  { icon: Users, label: 'Guests', href: '/dashboard/guests' },
  { icon: MessageSquare, label: 'Inbox', href: '/dashboard/inbox' },
  { icon: ClipboardList, label: 'Menu', href: '/dashboard/menu' },
  { icon: CalendarClock, label: 'Schedule', href: '/dashboard/schedule' },
  { icon: Printer, label: 'Print Manifest', href: '/dashboard/print' },
  { icon: Megaphone, label: 'Marketing', href: '/dashboard/marketing' },
  { icon: ShieldCheck, label: 'Staff', href: '/dashboard/staff' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const adminItems = [
  { icon: ShieldCheck, label: 'Admin Overview', href: '/dashboard/admin' },
  { icon: Utensils, label: 'Restaurants', href: '/dashboard/admin/restaurants' },
  { icon: Users, label: 'Users', href: '/dashboard/admin/users' },
  { icon: PanelTop, label: 'Tables', href: '/dashboard/admin/tables' },
  { icon: BookOpen, label: 'Bookings', href: '/dashboard/admin/bookings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role, full_name')
          .eq('id', user.id)
          .maybeSingle();

        let role = profile?.role || null;
        if (role !== 'restaurant_owner' && role !== 'admin') {
          const { data: staff } = await supabase
            .from('staff_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();
          if (staff) role = staff.role;
        }

        setUserRole(role);
        setUserName(profile?.full_name || user.email?.split('@')[0] || 'Owner');
      }
    }
    getUser();
  }, [supabase]);

  if (!userRole) return null;

  let navItems;
  if (userRole === 'admin') {
    navItems = adminItems;
  } else if (userRole === 'manager') {
    navItems = sidebarItems.filter(item => !['Settings', 'Staff'].includes(item.label));
  } else if (userRole === 'host') {
    navItems = sidebarItems.filter(item => !['Settings', 'Staff', 'Marketing', 'Menu', 'Overview'].includes(item.label));
  } else {
    navItems = sidebarItems;
  }

  return (
    <aside
      className={cn(
        'hidden h-screen flex-col md:flex fixed left-0 top-0 z-40 smooth-transition',
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
                {userRole === 'admin' ? 'Admin Panel' : 'Restaurant Panel'}
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
            'flex h-7 w-7 items-center justify-center rounded-md smooth-transition',
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
      </div>

      {/* Service Status (owner only) */}
      {userRole === 'restaurant_owner' && !isCollapsed && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid hsl(231 24% 13%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'hsl(220 15% 50%)' }}>
              Service Status
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
              {isOpen ? 'Open' : 'Closed'}
            </button>
          </div>
          {isOpen && (
            <p className="mt-1.5 text-[11px]" style={{ color: 'hsl(220 15% 38%)' }}>
              Accepting reservations
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
            Admin
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

      {/* Footer — User + Sign Out */}
      <div style={{ borderTop: '1px solid hsl(231 24% 13%)' }} className="p-3 space-y-1">
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
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && 'Sign Out'}
          </button>
        </form>
      </div>
    </aside>
  );
}