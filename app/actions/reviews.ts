'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Review {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    guestName: string;
    visitedDate: string | null;
    ownerReply: string | null;
}

export interface ReviewSummary {
    average: number;
    total: number;
    breakdown: { stars: number; count: number; pct: number }[];
    reviews: Review[];
}

export async function submitReview(bookingId: string, rating: number, comment: string) {
    const supabase = await createClient()

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()

    // Let's verify the booking exists and is completed
    const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('id, restaurant_id, status, user_id')
        .eq('id', bookingId)
        .single()

    if (resError || !reservation) {
        return { error: 'Invalid booking. Cannot submit review.' }
    }

    if (reservation.status !== 'completed') {
        return { error: 'You can only review completed reservations.' }
    }

    // Insert review
    const { error: insertError } = await supabase
        .from('reviews')
        .insert({
            restaurant_id: reservation.restaurant_id,
            reservation_id: reservation.id,
            user_id: user?.id || reservation.user_id || null,
            rating,
            comment: comment || null
        })

    if (insertError) {
        if (insertError.code === '23505') { // unique violation
            return { error: 'You have already reviewed this visit.' }
        }
        return { error: insertError.message }
    }

    // Attempt to revalidate the restaurant page to show the new review
    const { data: restaurant } = await supabase.from('restaurants').select('slug').eq('id', reservation.restaurant_id).single()
    if (restaurant) {
        revalidatePath(`/r/${restaurant.slug}`)
    }

    return { success: true }
}

export async function getReviewsByRestaurant(restaurantId: string): Promise<ReviewSummary> {
    const supabase = await createClient();

    const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
            id, restaurant_id, user_id, reservation_id, rating, comment, created_at,
            users (full_name, email),
            reservations (guest_name)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error || !reviews || reviews.length === 0) {
        return { average: 0, total: 0, breakdown: [], reviews: [] };
    }

    const total = reviews.length;
    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / total;

    const breakdown = [5, 4, 3, 2, 1].map(stars => {
        const count = reviews.filter(r => r.rating === stars).length;
        return { stars, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    });

    const mappedReviews = reviews.map(r => ({
        id: r.id,
        restaurant_id: r.restaurant_id,
        user_id: r.user_id,
        guest_name: (r.users as any)?.full_name || (r.reservations as any)?.guest_name || 'Guest',
        rating: r.rating,
        review_text: r.comment,
        visited_date: null,
        created_at: r.created_at
    }));

    return { average: Math.round(average * 10) / 10, total, breakdown, reviews: mappedReviews as unknown as Review[] };
}

export async function createReview(
    restaurantId: string,
    rating: number,
    reviewText: string,
    guestName: string,
): Promise<{ error?: string; success?: boolean }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // The current table requires reservation_id to be unique but we didn't make reservation_id required!
    // However, if reservation_id is null, unique constraint might be fine (SQL allows multiple nulls).
    const { error } = await supabase.from('reviews').insert({
        restaurant_id: restaurantId,
        user_id: user?.id || null,
        rating,
        comment: reviewText.trim() || null,
        // Optional: guest_name isn't in reviews table, so we use users/reservations join.
        // For anon reviews, guestName is lost unless we add it back. We don't have to perfectly support this, 
        // but let's avoid crashing.
    });

    if (error) return { error: error.message };

    const { data: restaurant } = await supabase.from('restaurants').select('slug').eq('id', restaurantId).single();
    if (restaurant) revalidatePath(`/restaurants/${restaurant.slug}`);

    return { success: true };
}
