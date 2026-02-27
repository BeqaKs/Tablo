'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Printer, Calendar, Users, Clock, StickyNote, TableProperties } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PrintReservation {
    id: string
    guest_name: string | null
    guest_count: number
    reservation_time: string
    end_time: string
    status: string
    guest_notes: string | null
    is_walk_in: boolean
    tables: { table_number: string; zone_name: string } | null
}

export default function PrintManifestPage() {
    const [reservations, setReservations] = useState<PrintReservation[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])

    useEffect(() => {
        loadReservations()
    }, [date])

    async function loadReservations() {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('id, name')
            .eq('owner_id', user.id)
            .single()

        if (!restaurant) return

        const start = `${date}T00:00:00.000Z`
        const end = `${date}T23:59:59.999Z`

        const { data } = await supabase
            .from('reservations')
            .select('id, guest_name, guest_count, reservation_time, end_time, status, guest_notes, is_walk_in, tables:table_id(table_number, zone_name)')
            .eq('restaurant_id', restaurant.id)
            .gte('reservation_time', start)
            .lte('reservation_time', end)
            .not('status', 'in', '("cancelled","no_show")')
            .order('reservation_time', { ascending: true })

        setReservations((data as any) || [])
        setLoading(false)
    }

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    const formatDateLong = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            confirmed: 'text-green-700',
            pending: 'text-yellow-700',
            seated: 'text-blue-700',
            completed: 'text-gray-500',
        }
        return colors[status] ?? 'text-gray-600'
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Toolbar - hidden in print */}
            <div className="print:hidden flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Printer className="h-6 w-6 text-primary" />
                        Daily Booking Manifest
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Print or export today's reservations</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button onClick={() => window.print()} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print Manifest
                    </Button>
                </div>
            </div>

            {/* Print header - only visible when printing */}
            <div className="hidden print:block mb-8">
                <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">TABLO — Daily Manifest</h1>
                        <p className="text-lg mt-1">{formatDateLong(date)}</p>
                    </div>
                    <div className="text-right text-sm">
                        <p>Printed: {new Date().toLocaleTimeString()}</p>
                        <p>{reservations.length} reservation{reservations.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            {/* Stats bar */}
            <div className="print:hidden grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Reservations', value: reservations.length, icon: Calendar },
                    { label: 'Total Covers', value: reservations.reduce((s, r) => s + r.guest_count, 0), icon: Users },
                    { label: 'Walk-Ins', value: reservations.filter(r => r.is_walk_in).length, icon: Clock },
                ].map(({ label, value, icon: Icon }) => (
                    <Card key={label} className="p-4 flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-2xl font-bold">{value}</p>
                            <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Manifest table */}
            {loading ? (
                <div className="text-center py-16 text-muted-foreground print:hidden">Loading...</div>
            ) : reservations.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground print:hidden">
                    No reservations for {formatDateLong(date)}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border print:border-none">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 print:bg-transparent">
                            <tr className="text-left print:border-b-2 print:border-black">
                                <th className="px-4 py-3 font-semibold print:px-2 print:py-2">Time</th>
                                <th className="px-4 py-3 font-semibold print:px-2 print:py-2">Guest</th>
                                <th className="px-4 py-3 font-semibold print:px-2 print:py-2">Party</th>
                                <th className="px-4 py-3 font-semibold print:px-2 print:py-2">Table</th>
                                <th className="px-4 py-3 font-semibold print:px-2 print:py-2 print:hidden">Status</th>
                                <th className="px-4 py-3 font-semibold print:px-2 print:py-2">Notes</th>
                                <th className="px-4 py-3 font-semibold print:px-2 print:py-2">Arrived ✓</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map((r, idx) => (
                                <tr
                                    key={r.id}
                                    className={`border-t print:border-gray-300 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50 print:bg-transparent'}`}
                                >
                                    <td className="px-4 py-3 print:px-2 font-mono font-semibold whitespace-nowrap">
                                        {formatTime(r.reservation_time)}
                                        <span className="text-muted-foreground font-normal print:hidden"> – {formatTime(r.end_time)}</span>
                                    </td>
                                    <td className="px-4 py-3 print:px-2 font-medium">
                                        {r.guest_name || 'Guest'}
                                        {r.is_walk_in && (
                                            <span className="ml-2 text-xs font-normal text-blue-600 print:text-black print:font-bold">[Walk-In]</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 print:px-2 text-center font-bold text-lg">
                                        {r.guest_count}
                                    </td>
                                    <td className="px-4 py-3 print:px-2">
                                        {r.tables ? (
                                            <span>{r.tables.table_number} <span className="text-muted-foreground print:hidden">({r.tables.zone_name})</span></span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className={`px-4 py-3 print:hidden capitalize font-medium ${statusBadge(r.status)}`}>
                                        {r.status}
                                    </td>
                                    <td className="px-4 py-3 print:px-2 text-muted-foreground italic max-w-[200px] truncate print:max-w-none print:whitespace-normal">
                                        {r.guest_notes || '—'}
                                    </td>
                                    {/* Arrival checkbox for print */}
                                    <td className="px-4 py-3 print:px-2 text-center">
                                        <div className="w-5 h-5 border-2 border-gray-400 rounded print:border-black mx-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-gray-200 print:border-black">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 print:px-2 font-bold">
                                    Total: {reservations.length} reservations · {reservations.reduce((s, r) => s + r.guest_count, 0)} covers
                                </td>
                                <td colSpan={4} />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    )
}
