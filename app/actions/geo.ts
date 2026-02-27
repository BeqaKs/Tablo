'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Fetch restaurants sorted by proximity to the user's location.
 * Uses the Postgres `earthdistance` extension (cube + earthdistance).
 * Returns distance in miles alongside each restaurant.
 */
export async function getRestaurantsNearby(
    lat: number,
    lng: number,
    radiusMiles: number = 50
) {
    const supabase = await createClient()

    // earthdistance returns meters, 1 mile = 1609.344 meters
    const radiusMeters = radiusMiles * 1609.344

    const { data, error } = await supabase.rpc('get_restaurants_nearby', {
        user_lat: lat,
        user_lng: lng,
        radius_meters: radiusMeters,
    })

    if (error) {
        console.error('Error fetching nearby restaurants:', error)
        return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
}
