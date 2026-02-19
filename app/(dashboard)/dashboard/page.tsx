import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, TrendingUp, Clock, MapPin, Phone } from "lucide-react";
import { formatGEL } from "@/lib/utils/currency";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in</div>;
  }

  // Get restaurant for this user
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('owner_id', user.id)
    .single();

  if (!restaurant) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border">
        <h2 className="text-2xl font-bold mb-2">Welcome to Tablo Dashboard!</h2>
        <p className="text-muted-foreground">You don't have a restaurant assigned to you yet.</p>
        <p className="text-muted-foreground mt-2">Please contact an administrator to assign your restaurant.</p>
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
    .select(`
      id,
      guest_name,
      guest_count,
      reservation_time,
      status,
      guest_phone,
      tables ( table_number )
    `)
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
    .slice(0, 5)
    .map(r => ({
      id: r.id,
      time: new Date(r.reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      guestName: r.guest_name || 'Guest',
      partySize: r.guest_count,
      table: (r.tables as any)?.table_number || 'TBD',
      phone: r.guest_phone || 'No phone'
    }));

  const occupancyPercentage = totalCapacity > 0 ? Math.round((seatedCovers / totalCapacity) * 100) : 0;

  // Revenue estimation
  const averageCheck = 85; // Using placeholder since prices aren't connected to payments
  const estimatedRevenue = todayCovers * averageCheck;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Overview - {restaurant.name}</h2>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Current Occupancy */}
        <Card className="premium-card border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="stat-label">Current Occupancy</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">{seatedCovers} / {totalCapacity}</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-tablo-red-600 smooth-transition"
                  style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-primary">{occupancyPercentage}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {tables?.length || 0} tables total
            </p>
          </CardContent>
        </Card>

        {/* Today's Covers */}
        <Card className="premium-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="stat-label">Total Covers (Today)</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">{todayCovers}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              Guests arriving today
            </p>
          </CardContent>
        </Card>

        {/* Active Reservations */}
        <Card className="premium-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="stat-label">Active Reservations</CardTitle>
            <CalendarCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">{activeReservations.length}</div>
            <p className="text-xs text-amber-600 font-medium mt-1">
              {upcomingBookings.length} upcoming soon
            </p>
          </CardContent>
        </Card>

        {/* Estimated Revenue */}
        <Card className="premium-card border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="stat-label">Est. Revenue (Today)</CardTitle>
            <span className="text-2xl">₾</span>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-green-600">{formatGEL(estimatedRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg. check {formatGEL(averageCheck)} (est)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings & Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Upcoming Bookings */}
        <Card className="col-span-4 premium-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Upcoming Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No upcoming reservations for the rest of the day.
                </div>
              ) : upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 smooth-transition cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-primary/10 text-primary">
                      <span className="text-xs font-medium">Table</span>
                      <span className="text-lg font-bold">{booking.table}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{booking.guestName}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {booking.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {booking.partySize} guests
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {booking.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-xs font-medium text-primary hover:bg-primary hover:text-white rounded-lg smooth-transition border border-primary">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Status */}
        <Card className="col-span-3 premium-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-tablo-red-600 smooth-transition shadow-sm">
              + New Reservation
            </button>
            <button className="w-full px-4 py-3 bg-white border border-gray-200 text-foreground rounded-lg font-medium hover:bg-gray-50 smooth-transition">
              View Floor Plan
            </button>
            <button className="w-full px-4 py-3 bg-white border border-gray-200 text-foreground rounded-lg font-medium hover:bg-gray-50 smooth-transition">
              Manage Tables
            </button>

            <div className="pt-4 mt-4 border-t">
              <h4 className="text-sm font-semibold text-foreground mb-3">Today's Peak Hours</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">18:00 - 20:00</span>
                  <span className="font-semibold text-primary">85% full</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">20:00 - 22:00</span>
                  <span className="font-semibold text-primary">92% full</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}