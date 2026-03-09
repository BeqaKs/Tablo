'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Review {
    id: string;
    rating: number;
    review_text: string | null;
    created_at: string;
    guest_name: string;
    visited_date: string | null;
    images: string[] | null;
    user_id: string | null;
}

export interface ReviewSummary {
    average: number;
    total: number;
    breakdown: { stars: number; count: number; pct: number }[];
    reviews: Review[];
}

export async function getReviewsByRestaurant(restaurantId: string): Promise<ReviewSummary> {
    const supabase = await createClient();

    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

    if (error || !reviews || reviews.length === 0) {
        return { average: 0, total: 0, breakdown: [], reviews: [] };
    }

    const total = reviews.length;
    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / total;

    const breakdown = [5, 4, 3, 2, 1].map(stars => {
        const count = reviews.filter(r => r.rating === stars).length;
        return { stars, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    });

    return {
        average: Math.round(average * 10) / 10,
        total,
        breakdown,
        reviews: reviews as Review[],
    };
}

export async function createReview(
    restaurantId: string,
    rating: number,
    reviewText: string,
    guestName: string,
    images: string[] = []
): Promise<{ error?: string; success?: boolean }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('reviews').insert({
        restaurant_id: restaurantId,
        user_id: user?.id || null,
        rating,
        review_text: reviewText.trim() || null,
        guest_name: guestName.trim() || 'Anonymous Guest',
        images: images.length > 0 ? images : null,
    });

    if (error) return { error: error.message };

    const { data: restaurant } = await supabase.from('restaurants').select('slug').eq('id', restaurantId).single();
    if (restaurant) revalidatePath(`/restaurants/${restaurant.slug}`);

    return { success: true };
}

export async function submitReview(
    bookingId: string,
    rating: number,
    comment: string
): Promise<{ error?: string; success?: boolean }> {
    const supabase = await createClient();

    // 1. Verify reservation and get details
    const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('restaurant_id, user_id, guest_name')
        .eq('id', bookingId)
        .single();

    if (resError || !reservation) {
        return { error: 'Reservation not found or invalid' };
    }

    // 2. Insert into reviews table
    const { error } = await supabase.from('reviews').insert({
        restaurant_id: reservation.restaurant_id,
        reservation_id: bookingId,
        user_id: reservation.user_id,
        rating,
        review_text: comment.trim() || null,
        guest_name: reservation.guest_name || 'Guest',
    });

    if (error) return { error: error.message };

    // 3. Revalidate restaurant page to show the new review
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('slug')
        .eq('id', reservation.restaurant_id)
        .single();

    if (restaurant) {
        revalidatePath(`/restaurants/${restaurant.slug}`);
    }

    return { success: true };
}
