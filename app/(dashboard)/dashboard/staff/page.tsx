'use client';

import { useState, useEffect } from 'react';
import { UsersRound, Trash2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getStaff, addStaff, removeStaff } from '@/app/actions/staff';
import { useTranslations } from '@/components/translations-provider';

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
    return (
        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-white/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 shadow-inner">
                <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            </div>
        </div>
    );
}

export default function StaffPage() {
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'manager' | 'host'>('host');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { t } = useTranslations();
    const st = t.staff || {};

    useEffect(() => {
        loadStaff();
    }, []);

    async function loadStaff() {
        setLoading(true);
        const { data, error } = await getStaff();
        if (data) setStaffList(data);
        if (error) console.error(error);
        setLoading(false);
    }

    async function handleAddStaff(e: React.FormEvent) {
        e.preventDefault();
        setFormLoading(true);
        setError('');
        setSuccess('');

        const res = await addStaff(email, role);
        if (res.error) {
            setError(res.error);
        } else {
            setSuccess(st.successAdd || 'Staff member added successfully!');
            setEmail('');
            loadStaff();
        }
        setFormLoading(false);
    }

    async function handleRemove(id: string) {
        if (!confirm(st.removeConfirm || 'Are you sure you want to remove this staff member?')) return;
        setFormLoading(true);
        const res = await removeStaff(id);
        if (res.error) {
            alert(res.error);
        } else {
            loadStaff();
        }
        setFormLoading(false);
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <SectionHeader
                icon={UsersRound}
                title={st.title || "Staff Roles"}
                subtitle={st.subtitle || "Manage your restaurant employees and their access levels"}
            />

            {/* Add Staff Form */}
            <div className="dash-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{st.inviteTitle || "Invite Staff Member"}</h3>
                <form onSubmit={handleAddStaff} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-1.5 w-full">
                            <label className="text-sm font-medium text-white">{st.emailLabel || "Email Address"}</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="dash-input w-full"
                                placeholder="employee@example.com"
                            />
                        </div>
                        <div className="w-full sm:w-48 space-y-1.5">
                            <label className="text-sm font-medium text-white">{st.roleLabel || "Role"}</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value as any)}
                                className="dash-input w-full"
                            >
                                <option value="manager">{st.roles?.manager || "Manager"}</option>
                                <option value="host">{st.roles?.host || "Host"}</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="dash-button-primary w-full sm:w-auto flex items-center justify-center gap-2 h-[42px] px-6"
                        >
                            <Plus className="h-4 w-4" />
                            {formLoading ? (st.adding || 'Adding...') : (st.addStaff || 'Add Staff')}
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm border border-red-500/20">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm border border-emerald-500/20">
                            <CheckCircle2 className="h-4 w-4" />
                            {success}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                        {st.note || "Note: The staff member must already have created a Tablo account with this email address before you can assign them a role. Managers have full access except for billing/ownership settings. Hosts only have access to Floor Plan, Guests, Calendar, and Menu."}
                    </p>
                </form>
            </div>

            {/* Staff List */}
            <div className="dash-card">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h3 className="font-semibold text-white">{st.currentStaff || "Current Staff"}</h3>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-muted-foreground">
                        {(st.membersCount || "{count} members").replace('{count}', staffList.length.toString())}
                    </span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-muted-foreground animate-pulse">{st.loading || "Loading staff..."}</div>
                ) : staffList.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-sm border-t border-white/5">
                        {st.noMembers || "No staff members assigned yet. Add one above."}
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {staffList.map((member) => (
                            <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                                <div>
                                    <p className="font-medium text-white flex items-center gap-2">
                                        {member.users?.full_name || 'Unknown User'}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${member.role === 'manager'
                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            }`}>
                                            {member.role}
                                        </span>
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {member.users?.email}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleRemove(member.id)}
                                    disabled={formLoading}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/20"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {st.removeAccess || "Remove Access"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
