import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, TrendingUp, Clock, MapPin, Phone } from "lucide-react";
import { formatGEL } from "@/lib/utils/currency";

export default function DashboardPage() {
  // Mock data - will be replaced with real data from Supabase
  const metrics = {
    currentOccupancy: { seated: 42, total: 80 },
    todayCovers: 124,
    activeReservations: 18,
    estimatedRevenue: 4200,
    averageCheck: 85,
  };

  const upcomingBookings = [
    { id: 1, time: "18:30", guestName: "Giorgi Beridze", partySize: 4, table: "12", phone: "+995 555 123 456" },
    { id: 2, time: "19:00", guestName: "Ana Kvirikashvili", partySize: 2, table: "5", phone: "+995 555 789 012" },
    { id: 3, time: "19:30", guestName: "Luka Tsiklauri", partySize: 6, table: "8", phone: "+995 555 345 678" },
    { id: 4, time: "20:00", guestName: "Mariam Janelidze", partySize: 3, table: "15", phone: "+995 555 901 234" },
  ];

  const occupancyPercentage = Math.round((metrics.currentOccupancy.seated / metrics.currentOccupancy.total) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
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
            <div className="stat-value">{metrics.currentOccupancy.seated} / {metrics.currentOccupancy.total}</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-tablo-red-600 smooth-transition"
                  style={{ width: `${occupancyPercentage}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-primary">{occupancyPercentage}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.currentOccupancy.total - metrics.currentOccupancy.seated} tables available
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
            <div className="stat-value">{metrics.todayCovers}</div>
            <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12% from yesterday
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
            <div className="stat-value">{metrics.activeReservations}</div>
            <p className="text-xs text-amber-600 font-medium mt-1">
              3 require confirmation
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
            <div className="stat-value text-green-600">{formatGEL(metrics.estimatedRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg. check {formatGEL(metrics.averageCheck)}
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
              {upcomingBookings.map((booking) => (
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