'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOwner } from './owner'
import { format } from 'date-fns'

// ========================
// Export Reservations as CSV
// ========================

export async function exportReservations(fromDate: string, toDate: string) {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError || !restaurantId) return { data: null, error: authError || 'No restaurant found' }

    const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*, tables(table_number, zone_name)')
        .eq('restaurant_id', restaurantId)
        .gte('reservation_time', fromDate)
        .lte('reservation_time', toDate)
        .order('reservation_time', { ascending: true })

    if (error) return { data: null, error: error.message }

    const headers = [
        'Date', 'Time', 'Guest Name', 'Party Size', 'Table',
        'Zone', 'Status', 'Phone', 'Notes', 'Occasion',
        'Dietary Restrictions', 'Walk-In', 'No-Show'
    ]

    const rows = (reservations || []).map((r: any) => {
        const dt = new Date(r.reservation_time)
        const table = Array.isArray(r.tables) ? r.tables[0] : r.tables
        return [
            format(dt, 'yyyy-MM-dd'),
            format(dt, 'HH:mm'),
            r.guest_name || 'N/A',
            r.guest_count,
            table?.table_number || 'N/A',
            table?.zone_name || 'N/A',
            r.status,
            r.guest_phone || '',
            (r.guest_notes || '').replace(/,/g, ';'),
            r.occasion || '',
            r.dietary_restrictions || '',
            r.is_walk_in ? 'Yes' : 'No',
            r.attendance_status === 'no_show' ? 'Yes' : 'No',
        ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    return { data: csv, error: null }
}

// ========================
// Export Guest List as CSV
// ========================

export async function exportGuestList() {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError || !restaurantId) return { data: null, error: authError || 'No restaurant found' }

    // Get all unique guests who have booked at this restaurant
    const { data: reservations, error } = await supabase
        .from('reservations')
        .select('guest_name, guest_phone, guest_count, status, reservation_time, occasion, dietary_restrictions, is_walk_in, attendance_status')
        .eq('restaurant_id', restaurantId)
        .order('reservation_time', { ascending: false })

    if (error) return { data: null, error: error.message }

    // Group by guest name + phone
    const guestMap = new Map<string, any>()
    for (const r of (reservations || [])) {
        const key = `${r.guest_name || 'Unknown'}|${r.guest_phone || ''}`
        if (!guestMap.has(key)) {
            guestMap.set(key, {
                name: r.guest_name || 'Unknown',
                phone: r.guest_phone || '',
                visitCount: 0,
                totalGuests: 0,
                noShows: 0,
                lastVisit: r.reservation_time,
                occasions: new Set<string>(),
                dietary: new Set<string>(),
            })
        }
        const g = guestMap.get(key)!
        g.visitCount++
        g.totalGuests += r.guest_count
        if (r.attendance_status === 'no_show') g.noShows++
        if (r.occasion) g.occasions.add(r.occasion)
        if (r.dietary_restrictions) g.dietary.add(r.dietary_restrictions)
    }

    const headers = [
        'Guest Name', 'Phone', 'Total Visits', 'Total Guests Brought',
        'No-Shows', 'Last Visit', 'Occasions', 'Dietary'
    ]

    const rows = Array.from(guestMap.values()).map(g => [
        g.name,
        g.phone,
        g.visitCount,
        g.totalGuests,
        g.noShows,
        g.lastVisit ? format(new Date(g.lastVisit), 'yyyy-MM-dd') : '',
        Array.from(g.occasions).join('; '),
        Array.from(g.dietary).join('; '),
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    return { data: csv, error: null }
}

// ========================
// Daily Summary Stats
// ========================

export async function getDailySummary(date: string) {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError || !restaurantId) return { data: null, error: authError || 'No restaurant found' }

    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`

    const { data: reservations, error } = await supabase
        .from('reservations')
        .select('status, guest_count, attendance_status, is_walk_in')
        .eq('restaurant_id', restaurantId)
        .gte('reservation_time', startOfDay)
        .lte('reservation_time', endOfDay)

    if (error) return { data: null, error: error.message }

    const all: any[] = reservations || []
    const active = all.filter((r: any) => !['cancelled'].includes(r.status))

    return {
        data: {
            totalReservations: active.length,
            totalCovers: active.reduce((sum: number, r: any) => sum + r.guest_count, 0),
            completed: all.filter((r: any) => r.status === 'completed').length,
            seated: all.filter((r: any) => r.status === 'seated').length,
            noShows: all.filter((r: any) => r.attendance_status === 'no_show').length,
            cancelled: all.filter((r: any) => r.status === 'cancelled').length,
            walkIns: all.filter((r: any) => r.is_walk_in).length,
            confirmed: all.filter((r: any) => r.status === 'confirmed').length,
            pending: all.filter((r: any) => r.status === 'pending').length,
        },
        error: null
    }
}

// ========================
// Weekly Performance (last 7 days)
// ========================

export async function getWeeklyPerformance() {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError || !restaurantId) return { data: null, error: authError || 'No restaurant found' }

    const days: { date: string; reservations: number; covers: number }[] = []

    for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = format(d, 'yyyy-MM-dd')
        const startOfDay = `${dateStr}T00:00:00`
        const endOfDay = `${dateStr}T23:59:59`

        const { data, error } = await supabase
            .from('reservations')
            .select('guest_count, status')
            .eq('restaurant_id', restaurantId)
            .gte('reservation_time', startOfDay)
            .lte('reservation_time', endOfDay)
            .neq('status', 'cancelled')

        const active: any[] = data || []
        days.push({
            date: dateStr,
            reservations: active.length,
            covers: active.reduce((sum: number, r: any) => sum + r.guest_count, 0),
        })
    }

    return { data: days, error: null }
}
