import { Sidebar } from '@/components/layout/sidebar';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { HostNotifier } from '@/components/dashboard/host-notifier';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let restaurantName = 'Restaurant Panel';
  let restaurantId = null;

  if (user) {
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

  return (
    <div className="dark min-h-screen" style={{ background: 'hsl(231 38% 6%)' }}>
      <Sidebar />
      {restaurantId && <HostNotifier restaurantId={restaurantId} />}
      <main className="pl-64 smooth-transition" style={{ minHeight: '100vh' }}>
        <DashboardHeader restaurantName={restaurantName} restaurantId={restaurantId || undefined} />
        <div className="mx-auto max-w-7xl p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}