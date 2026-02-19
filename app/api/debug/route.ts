import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const results: Record<string, any> = {}

    try {
        const supabase = await createClient()

        // 1. Check auth status
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        results.auth = {
            loggedIn: !!user,
            userId: user?.id || null,
            email: user?.email || null,
            error: authError?.message || null
        }

        // 2. Check users table
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, role')
            .limit(5)
        results.users = {
            count: users?.length || 0,
            data: users,
            error: usersError?.message || null
        }

        // 3. Check restaurants table
        const { data: restaurants, error: restError } = await supabase
            .from('restaurants')
            .select('id, name, slug, is_open, owner_id')
            .limit(5)
        results.restaurants = {
            count: restaurants?.length || 0,
            data: restaurants,
            error: restError?.message || null
        }

        // 4. Check tables table
        const { data: tables, error: tablesError } = await supabase
            .from('tables')
            .select('id, restaurant_id, table_number, capacity')
            .limit(5)
        results.tables = {
            count: tables?.length || 0,
            data: tables,
            error: tablesError?.message || null
        }

        // 5. Check reservations table
        const { data: reservations, error: resError } = await supabase
            .from('reservations')
            .select('id, restaurant_id, status')
            .limit(5)
        results.reservations = {
            count: reservations?.length || 0,
            data: reservations,
            error: resError?.message || null
        }

        // 6. RLS status check - try to list all restaurants without filter
        const { data: allRests, error: allRestsError } = await supabase
            .from('restaurants')
            .select('id, name, is_open')
        results.allRestaurants = {
            count: allRests?.length || 0,
            data: allRests,
            error: allRestsError?.message || null
        }

    } catch (err: any) {
        results.fatalError = err.message
    }

    return NextResponse.json(results, { status: 200 })
}
