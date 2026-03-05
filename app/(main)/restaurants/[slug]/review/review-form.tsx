'use client';

import { useState } from 'react';
import { submitReview } from '@/app/actions/reviews';
import { Star, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ReviewForm({
    bookingId,
    restaurantName,
    guestName,
    slug
}: {
    bookingId: string;
    restaurantName: string;
    guestName: string | null;
    slug: string;
}) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a star rating.');
            return;
        }
        setLoading(true);
        setError('');

        const res = await submitReview(bookingId, rating, comment);
        if (res.error) {
            setError(res.error);
            setLoading(false);
        } else {
            // Trigger refresh to show the success state on the parent UI
            router.refresh();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">How was your visit?</h2>
                <p className="text-muted-foreground">{restaurantName}</p>
                {guestName && <p className="text-sm font-medium text-white/80">Dining guest: {guestName}</p>}
            </div>

            <div className="flex flex-col items-center gap-2 py-4">
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 transition-transform hover:scale-110 focus:outline-none"
                        >
                            <Star
                                className={`w-10 h-10 ${(hoverRating || rating) >= star
                                        ? 'fill-rose-500 text-rose-500'
                                        : 'text-white/20'
                                    } transition-colors duration-200`}
                            />
                        </button>
                    ))}
                </div>
                <div className="h-6 mt-2 text-sm text-center font-medium text-rose-400">
                    {hoverRating === 1 || rating === 1 ? 'Poor' : ''}
                    {hoverRating === 2 || rating === 2 ? 'Fair' : ''}
                    {hoverRating === 3 || rating === 3 ? 'Good' : ''}
                    {hoverRating === 4 || rating === 4 ? 'Very Good' : ''}
                    {hoverRating === 5 || rating === 5 ? 'Excellent' : ''}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                    Any thoughts to share? <span className="text-white/40 font-normal">(Optional)</span>
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="dash-input w-full min-h-[100px] resize-none"
                    placeholder="Tell us about the food, service, or ambiance..."
                    maxLength={500}
                />
            </div>

            {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm border border-red-500/20">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={loading || rating === 0}
                className="dash-button-primary w-full h-[48px] text-lg font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Submitting...' : 'Submit Review'}
            </button>
        </form>
    );
}
