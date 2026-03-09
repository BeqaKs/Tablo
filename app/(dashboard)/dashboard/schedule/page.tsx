'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Plus, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import {
    createScheduleOverride,
    deleteScheduleOverride,
    getScheduleOverrides,
} from '@/app/actions/schedule'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ScheduleOverride } from '@/types/database'

export default function SchedulePage() {
    const [restaurantId, setRestaurantId] = useState<string | null>(null)
    const [overrides, setOverrides] = useState<ScheduleOverride[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)

    // Form state
    const [form, setForm] = useState({
        override_date: new Date().toISOString().split('T')[0],
        start_time: '12:00',
        end_time: '23:00',
        status: 'blocked' as 'blocked' | 'available',
        reason: '',
        table_id: '',
    })

    const [tables, setTables] = useState<any[]>([])

    // Get the current date for the 30-day range
    const today = new Date().toISOString().split('T')[0]
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    useEffect(() => {
        async function init() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: restaurant } = await supabase
                .from('restaurants')
                .select('id')
                .eq('owner_id', user.id)
                .single()

            if (!restaurant) return
            setRestaurantId(restaurant.id)

            const { data: tableData } = await supabase
                .from('tables')
                .select('id, table_number, zone_name')
                .eq('restaurant_id', restaurant.id)

            setTables(tableData || [])

            const { data } = await getScheduleOverrides(restaurant.id, today, future)
            setOverrides((data as ScheduleOverride[]) || [])
            setLoading(false)
        }
        init()
    }, [])

    async function handleAdd() {
        if (!restaurantId) return
        const result = await createScheduleOverride({
            restaurant_id: restaurantId,
            table_id: form.table_id || undefined,
            override_date: form.override_date,
            start_time: form.start_time,
            end_time: form.end_time,
            status: form.status,
            reason: form.reason || undefined,
        })

        if (result.error) {
            toast.error(result.error)
            return
        }
        toast.success('Override created')
        setOverrides(prev => [...prev, result.data as ScheduleOverride])
        setShowForm(false)
    }

    async function handleDelete(id: string) {
        const result = await deleteScheduleOverride(id)
        if (result.error) { toast.error(result.error); return }
        setOverrides(prev => prev.filter(o => o.id !== id))
        toast.success('Override removed')
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarDays className="h-6 w-6 text-primary" />
                        Schedule Overrides
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Block tables for private events or release them on special days</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Override
                </Button>
            </div>

            {/* Add Override Form */}
            {showForm && (
                <Card className="p-6 border-primary/30 bg-primary/5 space-y-4">
                    <h3 className="font-semibold text-sm">New Schedule Override</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium block mb-1">Date</label>
                            <input type="date" value={form.override_date} min={today}
                                onChange={e => setForm({ ...form, override_date: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Table (leave blank = all tables)</label>
                            <select value={form.table_id} onChange={e => setForm({ ...form, table_id: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                <option value="">— All Tables —</option>
                                {tables.map(tbl => <option key={tbl.id} value={tbl.id}>Table {tbl.table_number} ({tbl.zone_name})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Start Time</label>
                            <input type="time" value={form.start_time}
                                onChange={e => setForm({ ...form, start_time: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">End Time</label>
                            <input type="time" value={form.end_time}
                                onChange={e => setForm({ ...form, end_time: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Type</label>
                            <div className="flex gap-2">
                                {(['blocked', 'available'] as const).map(s => (
                                    <button key={s} onClick={() => setForm({ ...form, status: s })}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium smooth-transition ${form.status === s
                                            ? s === 'blocked' ? 'bg-red-500 text-white border-red-500' : 'bg-green-500 text-white border-green-500'
                                            : 'border-gray-200 hover:border-gray-300'}`}>
                                        {s === 'blocked' ? '🚫 Blocked' : '✅ Available'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Reason (optional)</label>
                            <input type="text" value={form.reason} placeholder="e.g. Private event"
                                onChange={e => setForm({ ...form, reason: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button onClick={handleAdd}>Save Override</Button>
                    </div>
                </Card>
            )}

            {/* Overrides List */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : overrides.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground">
                    <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No schedule overrides for the next 30 days.</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {overrides.map(o => (
                        <Card key={o.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-10 rounded-full ${o.status === 'blocked' ? 'bg-red-400' : 'bg-green-400'}`} />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">
                                            {new Date(o.override_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                        {o.start_time && o.end_time && (
                                            <span className="text-xs text-muted-foreground">{o.start_time} – {o.end_time}</span>
                                        )}
                                        <Badge variant={o.status === 'blocked' ? 'destructive' : 'secondary'} className="text-xs">
                                            {o.status === 'blocked' ? '🚫 Blocked' : '✅ Extra Availability'}
                                        </Badge>
                                    </div>
                                    {o.reason && <p className="text-xs text-muted-foreground mt-0.5">{o.reason}</p>}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(o.id)}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg smooth-transition"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
