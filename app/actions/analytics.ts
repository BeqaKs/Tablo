'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOwner } from './owner'
import { format, parseISO, startOfDay, endOfDay, differenceInDays, eachDayOfInterval, getDay, getHours } from 'date-fns'

export async function getAnalytics(fromDateStr: string, toDateStr: string) {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError || !restaurantId) return { data: null, error: authError || 'No restaurant found' }

    // Ensure we capture full days
    const fromDate = startOfDay(parseISO(fromDateStr))
    const toDate = endOfDay(parseISO(toDateStr))
    const daysDiff = differenceInDays(toDate, fromDate) + 1

    const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
            status,
            guest_count,
            reservation_time,
            attendance_status,
            is_walk_in
        `)
        .eq('restaurant_id', restaurantId)
        .gte('reservation_time', fromDate.toISOString())
        .lte('reservation_time', toDate.toISOString())

    if (error) return { data: null, error: error.message }

    const all = reservations || []
    
    // Core KPIs
    let totalBookings = 0
    let totalCovers = 0
    let walkIns = 0
    let cancelled = 0
    let noShows = 0

    // Data structures for charts
    const dailyMap = new Map<string, { bookings: number; covers: number }>()
    const hourlyDistributionMap = new Map<string, number>()
    const weekdayMap = new Map<number, { bookings: number; covers: number; count: number }>()

    // Initialize all days in interval to 0 so we don't have gaps
    const intervals = eachDayOfInterval({ start: fromDate, end: toDate })
    intervals.forEach(d => {
        dailyMap.set(format(d, 'yyyy-MM-dd'), { bookings: 0, covers: 0 })
        
        // Count how many of each weekday exist in this period for averages
        const dayIdx = getDay(d)
        if (!weekdayMap.has(dayIdx)) {
            weekdayMap.set(dayIdx, { bookings: 0, covers: 0, count: 0 })
        }
        const w = weekdayMap.get(dayIdx)!
        w.count++
    })

    // Process reservations
    all.forEach((r: any) => {
        if (r.status === 'cancelled') {
            cancelled++
            return // Don't count cancelled in revenue/covers trends
        }

        totalBookings++
        totalCovers += r.guest_count
        if (r.is_walk_in) walkIns++
        if (r.attendance_status === 'no_show') noShows++

        const resDate = new Date(r.reservation_time)
        const dateStr = format(resDate, 'yyyy-MM-dd')
        
        // Daily
        if (dailyMap.has(dateStr)) {
            const dStr = dailyMap.get(dateStr)!
            dStr.bookings++
            dStr.covers += r.guest_count
        }

        // Hourly
        const hour = format(resDate, 'HH:00')
        hourlyDistributionMap.set(hour, (hourlyDistributionMap.get(hour) || 0) + 1)

        // Weekday sum
        const dayIdx = getDay(resDate)
        const wStat = weekdayMap.get(dayIdx)!
        wStat.bookings++
        wStat.covers += r.guest_count
    })

    // Format output
    const dailyTrends = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        ...data
    }))

    const hourlyDistribution = Array.from(hourlyDistributionMap.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour))

    const weekdays = [0, 1, 2, 3, 4, 5, 6] // Sun - Sat
    const weekdayAverages = weekdays.map(dayIdx => {
        const d = weekdayMap.get(dayIdx)
        if (!d || d.count === 0) return { dayIndex: dayIdx, avgBookings: 0, avgCovers: 0 }
        return {
            dayIndex: dayIdx,
            avgBookings: Math.round((d.bookings / d.count) * 10) / 10,
            avgCovers: Math.round((d.covers / d.count) * 10) / 10
        }
    })

    return {
        data: {
            kpis: {
                totalBookings,
                totalCovers,
                walkIns,
                preBooked: totalBookings - walkIns,
                cancelled,
                noShows,
                avgPartySize: totalBookings > 0 ? (totalCovers / totalBookings).toFixed(1) : '0'
            },
            dailyTrends,
            hourlyDistribution,
            weekdayAverages
        },
        error: null
    }
}
