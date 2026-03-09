// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/sidebar';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { HostNotifier } from '@/components/dashboard/host-notifier';
import { getDictionary } from '@/lib/get-dictionary';
import { TranslationsProvider } from '@/components/translations-provider';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { t, dict: rawDict, locale } = await getDictionary();
  let restaurantName = t('dashboard.sidebar.restaurantPanel') || 'Restaurant Panel';
  let restaurantId = null;
  let userRole = null;
  let userName = '';

  if (user) {
    // Fetch profile
    const { data: profile } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    userRole = profile?.role || null;
    userName = profile?.full_name || user.email?.split('@')[0] || 'User';

    // Check staff roles if needed
    if (userRole !== 'restaurant_owner' && userRole !== 'admin') {
      const { data: staff } = await supabase
        .from('staff_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (staff) userRole = staff.role;
    }

    // Fetch restaurant
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (restaurant) {
      restaurantName = restaurant.name;
      restaurantId = restaurant.id;
    }
  }

  const uiDict = {
    sidebar: {
      overview: t('dashboard.sidebar.overview'),
      calendar: t('dashboard.sidebar.calendar'),
      floorPlan: t('dashboard.sidebar.floorPlan'),
      guests: t('dashboard.sidebar.guests'),
      inbox: t('dashboard.sidebar.inbox'),
      menu: t('dashboard.sidebar.menu'),
      schedule: t('dashboard.sidebar.schedule'),
      printManifest: t('dashboard.sidebar.printManifest'),
      marketing: t('dashboard.sidebar.marketing'),
      staff: t('dashboard.sidebar.staff'),
      settings: t('dashboard.sidebar.settings'),
      adminOverview: t('dashboard.sidebar.adminOverview'),
      restaurants: t('dashboard.sidebar.restaurants'),
      users: t('dashboard.sidebar.users'),
      tables: t('dashboard.sidebar.tables'),
      bookings: t('dashboard.sidebar.bookings'),
      admin: t('dashboard.sidebar.admin'),
      serviceStatus: t('dashboard.sidebar.serviceStatus'),
      open: t('dashboard.sidebar.open'),
      closed: t('dashboard.sidebar.closed'),
      acceptingReservations: t('dashboard.sidebar.acceptingReservations'),
      adminPanel: t('dashboard.sidebar.adminPanel'),
      restaurantPanel: t('dashboard.sidebar.restaurantPanel'),
      signOut: t('dashboard.sidebar.signOut')
    },
    dashboard: {
      live: t('dashboard_web.live')
    },
    locale: t('dashboard.locale')
  };

  return (
    <div className="dark min-h-screen" style={{ background: 'hsl(231 38% 6%)' }}>
      {restaurantId && <HostNotifier restaurantId={restaurantId} />}
      <DashboardShell
        sidebar={
          <Sidebar
            dict={uiDict.sidebar}
            currentLocale={locale as any}
            userRole={userRole}
            userName={userName}
          />
        }
        header={
          <DashboardHeader
            restaurantName={restaurantName}
            restaurantId={restaurantId || undefined}
            dict={uiDict}
          />
        }
        restaurantId={restaurantId}
      >
        <TranslationsProvider dictionary={rawDict}>
          {children}
        </TranslationsProvider>
      </DashboardShell>
    </div>
  );
}