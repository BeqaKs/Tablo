import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
    Users,
    Utensils,
    CalendarDays,
    TrendingUp,
    ShieldCheck,
    PanelTop,
    BookOpen,
    ArrowRight,
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

    const { count: tableCount } = await supabase
        .from('tables')
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
            title: 'Total Bookings',
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
            title: 'Total Tables',
            value: tableCount || 0,
            icon: PanelTop,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
        },
    ];

    const quickActions = [
        {
            title: 'Restaurant Management',
            description: 'Add, edit, and manage all restaurants',
            icon: Utensils,
            href: '/dashboard/admin/restaurants',
            color: 'from-blue-500 to-blue-600',
        },
        {
            title: 'User Management',
            description: 'Manage user roles and permissions',
            icon: Users,
            href: '/dashboard/admin/users',
            color: 'from-purple-500 to-purple-600',
        },
        {
            title: 'Table Management',
            description: 'Manage tables and floor plans',
            icon: PanelTop,
            href: '/dashboard/admin/tables',
            color: 'from-orange-500 to-orange-600',
        },
        {
            title: 'Booking Management',
            description: 'View and manage all bookings',
            icon: BookOpen,
            href: '/dashboard/admin/bookings',
            color: 'from-green-500 to-green-600',
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                    <ShieldCheck className="h-7 w-7 text-red-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
                    <p className="text-muted-foreground">
                        Platform-wide metrics and management
                    </p>
                </div>
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

            {/* Quick Action Cards */}
            <div>
                <h2 className="text-xl font-bold mb-4">Management Areas</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br text-white p-6 hover:shadow-luxury-lg smooth-transition"
                            style={{
                                background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                            }}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-100`} />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <action.icon className="h-8 w-8 text-white/90" />
                                    <ArrowRight className="h-5 w-5 text-white/60 group-hover:translate-x-1 smooth-transition" />
                                </div>
                                <h3 className="text-lg font-bold mb-1">{action.title}</h3>
                                <p className="text-sm text-white/80">{action.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Platform Activity */}
            <div className="premium-card p-8 bg-white rounded-2xl shadow-sm border">
                <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold">Platform Summary</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-3xl font-bold text-primary">{restaurantCount || 0}</p>
                        <p className="text-sm text-muted-foreground mt-1">Restaurants</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-3xl font-bold text-green-600">{reservationCount || 0}</p>
                        <p className="text-sm text-muted-foreground mt-1">All-time Bookings</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-3xl font-bold text-purple-600">{userCount || 0}</p>
                        <p className="text-sm text-muted-foreground mt-1">Registered Users</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
