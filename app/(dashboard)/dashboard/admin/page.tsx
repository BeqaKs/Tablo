import { createClient } from '@/lib/supabase/server';
import {
    Users,
    Utensils,
    CalendarDays,
    TrendingUp,
    LayoutDashboard,
    Settings,
    ShieldCheck
} from 'lucide-react';

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Fetch summary stats
    const { count: restaurantCount } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true });

    const { count: reservationCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true });

    const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    const stats = [
        {
            title: 'Total Restaurants',
            value: restaurantCount || 0,
            icon: Utensils,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            title: 'Active Bookings',
            value: reservationCount || 0,
            icon: CalendarDays,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            title: 'Total Users',
            value: userCount || 0,
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
        {
            title: 'Platform Role',
            value: 'Super Admin',
            icon: ShieldCheck,
            color: 'text-red-600',
            bg: 'bg-red-50',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
                <p className="text-muted-foreground">
                    Platform-wide metrics and management.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.title} className="premium-card p-6 bg-white rounded-xl shadow-sm border">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Welcome Section */}
            <div className="grid gap-8 lg:grid-cols-2">
                <div className="premium-card p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl shadow-luxury">
                    <div className="flex items-center gap-3 mb-6">
                        <LayoutDashboard className="h-8 w-8 text-primary" />
                        <h2 className="text-2xl font-bold">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left smooth-transition">
                            <p className="font-semibold mb-1">Verify Restaurants</p>
                            <p className="text-xs text-white/60">Manage pending approvals</p>
                        </button>
                        <button className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left smooth-transition">
                            <p className="font-semibold mb-1">System Audit</p>
                            <p className="text-xs text-white/60">View global log history</p>
                        </button>
                        <button className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left smooth-transition">
                            <p className="font-semibold mb-1">User Management</p>
                            <p className="text-xs text-white/60">Update roles & permissions</p>
                        </button>
                        <button className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left smooth-transition">
                            <p className="font-semibold mb-1">Global Settings</p>
                            <p className="text-xs text-white/60">Configure platform rules</p>
                        </button>
                    </div>
                </div>

                <div className="premium-card p-8 bg-white rounded-2xl shadow-sm border">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        <h2 className="text-2xl font-bold">Platform Activity</h2>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold">
                                        R{i}
                                    </div>
                                    <div>
                                        <p className="font-medium">New Restaurant Joined</p>
                                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                                    </div>
                                </div>
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Auto-confirmed</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
