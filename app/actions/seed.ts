'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function seedDemoData() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'You must be logged in to seed data.' }
    }

    // 1. Check if restaurant already exists for this user (to avoid duplicates)
    const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', 'shavi-lomi')
        .maybeSingle()

    let restaurantId;

    if (!existingRestaurant) {
        // Create Shavi Lomi
        const { data: newRestaurant, error: restError } = await supabase
            .from('restaurants')
            .insert({
                owner_id: user.id,
                name: 'Shavi Lomi',
                slug: 'shavi-lomi',
                description: 'Modern Georgian cuisine in an intimate setting.',
                address: '123 Rustaveli Avenue, Tbilisi',
                city: 'Tbilisi',
                cuisine_type: 'Georgian Fine Dining',
                price_range: '$$$',
                is_open: true,
                images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800']
            })
            .select()
            .single()

        if (restError) return { error: `Restaurant error: ${restError.message}` }
        restaurantId = newRestaurant.id
    } else {
        restaurantId = existingRestaurant.id
    }

    // 2. Create tables if they don't exist
    const { data: existingTables } = await supabase
        .from('tables')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .limit(1)

    if (!existingTables || existingTables.length === 0) {
        const { error: tablesError } = await supabase
            .from('tables')
            .insert([
                { restaurant_id: restaurantId, table_number: '1', capacity: 2, shape: 'square', x_coord: 100, y_coord: 100 },
                { restaurant_id: restaurantId, table_number: '2', capacity: 2, shape: 'square', x_coord: 200, y_coord: 100 },
                { restaurant_id: restaurantId, table_number: '3', capacity: 4, shape: 'rectangle', x_coord: 350, y_coord: 100, width: 120, height: 60 },
                { restaurant_id: restaurantId, table_number: '4', capacity: 4, shape: 'rectangle', x_coord: 100, y_coord: 250, width: 120, height: 60 },
                { restaurant_id: restaurantId, table_number: '5', capacity: 6, shape: 'round', x_coord: 300, y_coord: 250 }
            ])

        if (tablesError) return { error: `Tables error: ${tablesError.message}` }
    }

    revalidatePath('/restaurants')
    revalidatePath(`/restaurants/shavi-lomi`)

    return { success: true, message: 'Sample restaurant and tables seeded successfuly!' }
}
