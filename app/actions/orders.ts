'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CartItem = {
    menu_item_id: string
    name: string
    price: number
    quantity: number
}

/** Create an order (with items) tied to a reservation */
export async function createOrder(data: {
    reservation_id?: string
    restaurant_id: string
    items: CartItem[]
    special_instructions?: string
}) {
    const supabase = await createClient()

    if (!data.items.length) return { data: null, error: 'Cart is empty' }

    const total_amount = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

    // 1. Insert order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            reservation_id: data.reservation_id ?? null,
            restaurant_id: data.restaurant_id,
            special_instructions: data.special_instructions ?? null,
            total_amount,
            status: 'submitted',
        })
        .select()
        .single()

    if (orderError || !order) return { data: null, error: orderError?.message ?? 'Failed to create order' }

    // 2. Insert order items
    const orderItems = data.items.map(i => ({
        order_id: order.id,
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        unit_price: i.price,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) return { data: null, error: itemsError.message }

    // 3. If we have a reservation_id, link the order back to the reservation
    if (data.reservation_id) {
        await supabase
            .from('reservations')
            .update({ order_id: order.id })
            .eq('id', data.reservation_id)
    }

    revalidatePath('/my-bookings')
    return { data: order, error: null }
}

/** Fetch order (with items + menu details) for a reservation */
export async function getOrderByReservation(reservationId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                *,
                menu_items (*)
            )
        `)
        .eq('reservation_id', reservationId)
        .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

/** Owner: list all orders for their restaurant */
export async function getOwnerOrders() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: 'Not authenticated' }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) return { data: [], error: 'No restaurant found' }

    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(*))')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
}

/** Owner: update order status */
export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/guests')
    return { success: true }
}
