import { Users, CalendarCheck, TrendingUp, Clock, Phone, ChevronRight, Flame } from "lucide-react";
import { formatGEL } from "@/lib/utils/currency";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

// Dark metric card
function MetricCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
  children,
}: {
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  accent: string;
  icon: React.ElementType;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="dash-card p-5 flex flex-col gap-4"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between">
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'hsl(220 15% 45%)' }}
        >
          {label}
        </span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${accent}22` }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        {sub && <div className="mt-1 text-xs" style={{ color: 'hsl(220 15% 45%)' }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="text-white p-8">Please log in</div>;
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('owner_id', user.id)
    .single();

  if (!restaurant) {
    return (
      <div className="dash-card p-10 text-center">
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'hsl(347 78% 58% / 0.12)' }}
        >
          <Flame className="h-8 w-8" style={{ color: 'hsl(347 78% 65%)' }} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Welcome to Tablo!</h2>
        <p style={{ color: 'hsl(220 15% 50%)' }}>No restaurant assigned yet. Contact an admin.</p>
      </div>
    );
  }

  // Fetch Tables
  const { data: tables } = await supabase
    .from('tables')
    .select('id, capacity, table_number')
    .eq('restaurant_id', restaurant.id);

  const totalCapacity = (tables || []).reduce((sum, t) => sum + t.capacity, 0);

  // Fetch Reservations for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: reservations } = await supabase
    .from('reservations')
    .select(`id, guest_name, guest_count, reservation_time, status, guest_phone, tables ( table_number )`)
    .eq('restaurant_id', restaurant.id)
    .gte('reservation_time', today.toISOString())
    .lt('reservation_time', tomorrow.toISOString())
    .order('reservation_time', { ascending: true });

  const activeReservations = (reservations || []).filter(r => ['pending', 'confirmed'].includes(r.status));
  const seatedReservations = (reservations || []).filter(r => r.status === 'seated');
  const todayCovers = (reservations || []).filter(r => r.status !== 'cancelled' && r.status !== 'no_show').reduce((sum, r) => sum + r.guest_count, 0);
  const seatedCovers = seatedReservations.reduce((sum, r) => sum + r.guest_count, 0);

  const upcomingBookings = (reservations || [])
    .filter(r => new Date(r.reservation_time) > new Date() && ['pending', 'confirmed'].includes(r.status))
    .slice(0, 6)
    .map(r => ({
      id: r.id,
      time: new Date(r.reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      guestName: r.guest_name || 'Guest',
      partySize: r.guest_count,
      table: (r.tables as any)?.table_number || 'TBD',
      phone: r.guest_phone || '—',
      status: r.status,
    }));

  const occupancyPercentage = totalCapacity > 0 ? Math.round((seatedCovers / totalCapacity) * 100) : 0;
  const averageCheck = 85;
  const estimatedRevenue = todayCovers * averageCheck;

  const statusStyle = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: 'hsl(38 80% 55% / 0.12)', color: 'hsl(38 80% 65%)', label: 'Pending' },
      confirmed: { bg: 'hsl(200 70% 50% / 0.12)', color: 'hsl(200 70% 65%)', label: 'Confirmed' },
    };
    return map[status] || map.pending;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{restaurant.name}</h2>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(220 15% 45%)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/dashboard/calendar"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold smooth-transition btn-dash-primary"
        >
          + New Reservation
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Current Occupancy"
          value={`${seatedCovers} / ${totalCapacity}`}
          sub={`${tables?.length || 0} tables total`}
          accent="hsl(347 78% 58%)"
          icon={Users}
        >
          <div>
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ background: 'hsl(231 24% 16%)' }}
            >
              <div
                className="h-full rounded-full smooth-transition"
                style={{
                  width: `${Math.min(occupancyPercentage, 100)}%`,
                  background: 'linear-gradient(90deg, hsl(347 78% 52%), hsl(318 70% 45%))',
                }}
              />
            </div>
            <div className="mt-1.5 text-right text-xs font-bold" style={{ color: 'hsl(347 78% 65%)' }}>
              {occupancyPercentage}%
            </div>
          </div>
        </MetricCard>

        <MetricCard
          label="Total Covers Today"
          value={todayCovers}
          sub="Guests arriving today"
          accent="hsl(262 60% 56%)"
          icon={Users}
        />

        <MetricCard
          label="Active Reservations"
          value={activeReservations.length}
          sub={<span style={{ color: 'hsl(38 80% 60%)' }}>{upcomingBookings.length} upcoming soon</span>}
          accent="hsl(38 80% 55%)"
          icon={CalendarCheck}
        />

        <MetricCard
          label="Est. Revenue Today"
          value={formatGEL(estimatedRevenue)}
          sub={`Avg. check ${formatGEL(averageCheck)} (est.)`}
          accent="hsl(160 60% 45%)"
          icon={TrendingUp}
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Upcoming Reservations */}
        <div className="dash-card col-span-4 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: 'hsl(347 78% 58% / 0.12)' }}
              >
                <Clock className="h-3.5 w-3.5" style={{ color: 'hsl(347 78% 65%)' }} />
              </div>
              <span className="text-sm font-semibold text-white">Upcoming Reservations</span>
            </div>
            <Link
              href="/dashboard/calendar"
              className="flex items-center gap-1 text-xs smooth-transition"
              style={{ color: 'hsl(220 15% 45%)' }}
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {upcomingBookings.length === 0 ? (
              <div
                className="py-10 text-center text-sm rounded-lg"
                style={{ background: 'hsl(231 24% 11%)', color: 'hsl(220 15% 40%)' }}
              >
                No upcoming reservations for today.
              </div>
            ) : upcomingBookings.map((booking) => {
              const ss = statusStyle(booking.status);
              return (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 rounded-lg px-4 py-3 smooth-transition"
                  style={{ background: 'hsl(231 24% 11%)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'hsl(231 24% 13%)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'hsl(231 24% 11%)'}
                >
                  {/* Table chip */}
                  <div
                    className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-lg text-center"
                    style={{ background: 'hsl(347 78% 58% / 0.10)' }}
                  >
                    <span className="text-[9px] font-medium" style={{ color: 'hsl(347 78% 60%)' }}>TBL</span>
                    <span className="text-sm font-bold" style={{ color: 'hsl(347 78% 70%)' }}>{booking.table}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{booking.guestName}</p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: ss.bg, color: ss.color }}
                      >
                        {ss.label}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3 mt-0.5 text-xs"
                      style={{ color: 'hsl(220 15% 45%)' }}
                    >
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{booking.time}
                      </span>
                      <span>{booking.partySize} guests</span>
                      {booking.phone !== '—' && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />{booking.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions + Peak Hours */}
        <div className="dash-card col-span-3 p-5 flex flex-col gap-5">
          <span className="text-sm font-semibold text-white">Quick Actions</span>

          <div className="space-y-2">
            <Link
              href="/dashboard/calendar"
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold smooth-transition btn-dash-primary"
            >
              + New Reservation
            </Link>
            <Link
              href="/dashboard/floor-plan"
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium smooth-transition btn-dash-ghost"
            >
              View Floor Plan
            </Link>
            <Link
              href="/dashboard/guests"
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium smooth-transition btn-dash-ghost"
            >
              Guest Directory
            </Link>
          </div>

          <div style={{ borderTop: '1px solid hsl(231 24% 16%)' }} className="pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'hsl(220 15% 40%)' }}>
              Today's Peak Hours
            </h4>
            <div className="space-y-3">
              {[
                { time: '18:00–19:00', pct: 62 },
                { time: '19:00–20:00', pct: 85 },
                { time: '20:00–21:00', pct: 94 },
                { time: '21:00–22:00', pct: 71 },
              ].map(({ time, pct }) => (
                <div key={time}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'hsl(220 15% 50%)' }}>{time}</span>
                    <span className="font-semibold" style={{ color: pct >= 80 ? 'hsl(347 78% 65%)' : 'hsl(220 20% 70%)' }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full" style={{ background: 'hsl(231 24% 16%)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 80
                          ? 'linear-gradient(90deg, hsl(347 78% 52%), hsl(318 70% 45%))'
                          : 'hsl(262 60% 50%)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}