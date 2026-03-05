import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { ReviewForm } from './review-form'; // Client component 

export default async function ReviewPage({
    params,
    searchParams
}: {
    params: { slug: string };
    searchParams: { bookingId?: string };
}) {
    const bookingId = searchParams.bookingId;
    if (!bookingId) return notFound();

    const supabase = await createClient();

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('slug', params.slug)
        .single();

    if (!restaurant) return notFound();

    // Verify booking
    const { data: reservation } = await supabase
        .from('reservations')
        .select('id, status, guest_name')
        .eq('id', bookingId)
        .eq('restaurant_id', restaurant.id)
        .single();

    if (!reservation) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full dash-card p-8 text-center space-y-4">
                    <h2 className="text-xl font-bold text-white">Invalid Link</h2>
                    <p className="text-muted-foreground">This review link is invalid or has expired.</p>
                </div>
            </div>
        );
    }

    // Check if already reviewed
    const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('reservation_id', bookingId)
        .maybeSingle();

    const isReviewed = !!existing;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <header className="border-b border-white/10 px-6 py-4 flex items-center justify-center">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 shadow-lg group-hover:shadow-rose-500/25 transition-all">
                        <UtensilsCrossed className="h-4 w-4 text-white" />
                    </div>
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-md w-full dash-card p-8">
                    {isReviewed ? (
                        <div className="text-center space-y-4 py-8">
                            <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold">Review Received</h2>
                            <p className="text-muted-foreground">Thank you! Your feedback for {restaurant.name} has been saved.</p>
                            <div className="pt-6">
                                <Link href={`/restaurants/${params.slug}`} className="dash-button-primary inline-flex h-10 px-6">
                                    Return to Restaurant
                                </Link>
                            </div>
                        </div>
                    ) : (
                        reservation.status !== 'completed' ? (
                            <div className="text-center space-y-4">
                                <h2 className="text-xl font-bold text-white">Not Ready</h2>
                                <p className="text-muted-foreground">You can only review a reservation after it has been marked as completed.</p>
                            </div>
                        ) : (
                            <ReviewForm
                                bookingId={bookingId}
                                restaurantName={restaurant.name}
                                guestName={reservation.guest_name}
                                slug={params.slug}
                            />
                        )
                    )}
                </div>
            </main>
        </div>
    );
}
