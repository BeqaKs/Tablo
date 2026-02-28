'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Review {
    id: string;
    restaurant_id: string;
    user_id: string | null;
    guest_name: string;
    rating: number;
    review_text: string | null;
    visited_date: string | null;
    created_at: string;
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

    return { average: Math.round(average * 10) / 10, total, breakdown, reviews };
}

export async function createReview(
    restaurantId: string,
    rating: number,
    reviewText: string,
    guestName: string,
): Promise<{ error?: string; success?: boolean }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('reviews').insert({
        restaurant_id: restaurantId,
        user_id: user?.id || null,
        guest_name: guestName || user?.user_metadata?.full_name || 'Guest',
        rating,
        review_text: reviewText.trim() || null,
        visited_date: new Date().toISOString().split('T')[0],
    });

    if (error) return { error: error.message };

    revalidatePath(`/restaurants`);
    return { success: true };
}
