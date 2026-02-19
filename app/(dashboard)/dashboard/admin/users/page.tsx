'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAdminUsers, updateUserRole, getAdminRestaurants, updateAdminRestaurant } from '@/app/actions/admin';
import { toast } from 'sonner';
import { Users, Shield, ShieldCheck, User, Loader2, ChevronDown, Store } from 'lucide-react';

const roleBadge: Record<string, { bg: string; text: string }> = {
    admin: { bg: 'bg-red-100', text: 'text-red-700' },
    restaurant_owner: { bg: 'bg-blue-100', text: 'text-blue-700' },
    customer: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [changingRole, setChangingRole] = useState<string | null>(null);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const [usersResult, restResult] = await Promise.all([
            getAdminUsers(),
            getAdminRestaurants()
        ]);
        if (usersResult.error) toast.error(usersResult.error);
        else if (usersResult.data) setUsers(usersResult.data);

        if (restResult.data) setRestaurants(restResult.data);
        setLoading(false);
    }

    async function handleRoleChange(userId: string, newRole: string) {
        setChangingRole(userId);
        const { error } = await updateUserRole(userId, newRole);
        if (error) {
            toast.error(error);
        } else {
            toast.success('Role updated');
            loadData();
        }
        setChangingRole(null);
    }

    async function handleAssignRestaurant(userId: string, restaurantId: string) {
        if (!restaurantId) return;
        const { error } = await updateAdminRestaurant(restaurantId, { owner_id: userId });
        if (error) {
            toast.error('Failed to assign restaurant: ' + error);
        } else {
            toast.success('Restaurant assigned to user');
            loadData();
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">{users.length} total users</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {['admin', 'restaurant_owner', 'customer'].map(role => {
                    const count = users.filter(u => u.role === role).length;
                    const Icon = role === 'admin' ? ShieldCheck : role === 'restaurant_owner' ? Shield : User;
                    return (
                        <Card key={role} className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${roleBadge[role].bg}`}>
                                <Icon className={`h-5 w-5 ${roleBadge[role].text}`} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground capitalize">{role.replace('_', ' ')}s</p>
                                <p className="text-2xl font-bold">{count}</p>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Users Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50/50">
                                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">User</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Email</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Role</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Joined</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Actions & Settings</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => {
                                const badge = roleBadge[user.role] || roleBadge.customer;
                                const userRestaurant = restaurants.find(r => r.owner_id === user.id);
                                return (
                                    <tr key={user.id} className="border-b hover:bg-gray-50/50 smooth-transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary">
                                                    {(user.full_name || user.email || '?')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.full_name || 'No name'}</p>
                                                    <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="relative w-48">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                        disabled={changingRole === user.id}
                                                        className="w-full text-sm border rounded-lg px-3 py-1.5 bg-white appearance-none pr-8 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <option value="customer">Customer</option>
                                                        <option value="restaurant_owner">Restaurant Owner</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                </div>

                                                {user.role === 'restaurant_owner' && (
                                                    <div className="relative w-48">
                                                        <select
                                                            value={userRestaurant?.id || ''}
                                                            onChange={(e) => handleAssignRestaurant(user.id, e.target.value)}
                                                            className="w-full text-xs border rounded-lg px-2 py-1.5 bg-gray-50 appearance-none pr-8 cursor-pointer text-muted-foreground"
                                                        >
                                                            <option value="">{userRestaurant ? 'Change Restaurant...' : 'Assign Restaurant...'}</option>
                                                            {restaurants.map(r => (
                                                                <option key={r.id} value={r.id}>
                                                                    {r.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <Store className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
