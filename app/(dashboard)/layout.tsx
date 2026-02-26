import { Sidebar } from '@/components/layout/sidebar';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/layout/dashboard-header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let restaurantName = 'Restaurant Panel';
  if (user) {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name')
      .eq('owner_id', user.id)
      .maybeSingle();
    if (restaurant?.name) restaurantName = restaurant.name;
  }

  return (
    <div className="dark min-h-screen" style={{ background: 'hsl(231 38% 6%)' }}>
      <Sidebar />
      <main className="pl-64 smooth-transition" style={{ minHeight: '100vh' }}>
        <DashboardHeader restaurantName={restaurantName} />
        <div className="mx-auto max-w-7xl p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}