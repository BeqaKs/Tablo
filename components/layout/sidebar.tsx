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
  Power,
  ShieldCheck,
  Utensils,
  PanelTop,
  BookOpen,
} from 'lucide-react';
import { signout } from '@/app/auth/actions';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: CalendarDays, label: 'Calendar', href: '/dashboard/calendar' },
  { icon: Armchair, label: 'Floor Plan', href: '/dashboard/floor-plan' },
  { icon: Users, label: 'Guests', href: '/dashboard/guests' },
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
  const [isOpen, setIsOpen] = useState(true); // Service status
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        setUserRole(profile?.role || null);
      }
    }
    getUser();
  }, [supabase]);

  if (!userRole) return null; // Or skeleton loader

  return (
    <aside
      className={cn(
        'hidden h-screen flex-col border-r border-border/80 bg-card md:flex fixed left-0 top-0 z-40 smooth-transition',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-xl">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <span className="tracking-tight">Tablo.</span>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-muted rounded-lg smooth-transition"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Service Status Toggle */}
      {userRole === 'restaurant_owner' && !isCollapsed && (
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Service Status</span>
            <div className="flex items-center gap-2">
              <Power className={cn('h-4 w-4', isOpen ? 'text-green-600' : 'text-gray-400')} />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full smooth-transition',
                  isOpen ? 'bg-green-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white smooth-transition',
                    isOpen ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {isOpen ? 'Currently accepting reservations' : 'Not accepting reservations'}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {userRole === 'restaurant_owner' && sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg smooth-transition',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon
                className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')}
              />
              {!isCollapsed && item.label}
            </Link>
          );
        })}

        {/* Admin Section */}
        {userRole === 'admin' && !isCollapsed && (
          <div className="pt-4 mt-4 border-t">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Admin</p>
          </div>
        )}
        {userRole === 'admin' && isCollapsed && <div className="pt-2 mt-2 border-t" />}
        {userRole === 'admin' && adminItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg smooth-transition',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon
                className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')}
              />
              {!isCollapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Sign Out */}
      <div className="border-t p-4">
        <form action={signout}>
          <button
            type="submit"
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive smooth-transition',
              isCollapsed && 'justify-center'
            )}
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