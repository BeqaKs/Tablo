'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    MapPin, Star, Clock, Users, Phone, Mail, Globe,
    ChevronLeft, ChevronRight, Calendar, Check, X, ShieldCheck, Heart,
    Briefcase, Info, UtensilsCrossed, ImagePlus, Trash2
} from 'lucide-react';
import { useLocale } from '@/lib/locale-context';
import { getRestaurantBySlug, createBooking, getUnavailableTables } from '@/app/actions/bookings';
import { getProfile } from '@/app/actions/profile';
import { createClient } from '@/lib/supabase/client';
import { joinWaitlist, calculateWaitTime } from '@/app/actions/waitlist';
import { createOrder, CartItem } from '@/app/actions/orders';
import { getMenuByRestaurant } from '@/app/actions/menu';
import { getReviewsByRestaurant, createReview, ReviewSummary } from '@/app/actions/reviews';
import { Tables } from '@/types/database';
type Restaurant = Tables<'restaurants'>;
type Table = Tables<'tables'>;
import { toast } from 'sonner';
import { FloorPlanViewer } from '@/components/floor-plan/floor-plan-viewer';
import { TablePosition } from '@/lib/stores/floor-plan-store';
import { MenuBrowser } from '@/components/menu/menu-browser';

const BOOKING_STEPS = [
    { key: 'datetime', rawLabel: 'Date & Time', num: 1 },
    { key: 'table', rawLabel: 'Table', num: 2 },
    { key: 'menu', rawLabel: 'Extras', num: 3 },
    { key: 'confirm', rawLabel: 'Confirm', num: 4 },
];

export default function RestaurantProfilePage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { t } = useLocale();
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [partySize, setPartySize] = useState<number>(2);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [step, setStep] = useState<'datetime' | 'table' | 'menu' | 'confirm'>('datetime');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [guestNotes, setGuestNotes] = useState('');
    const [occasion, setOccasion] = useState('');
    const [dietaryRestrictions, setDietaryRestrictions] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'floor-plan'>('list');
    const [mobileBookingOpen, setMobileBookingOpen] = useState(false);
    // Waitlist state
    const [showWaitlist, setShowWaitlist] = useState(false);
    const [waitlistLoading, setWaitlistLoading] = useState(false);
    const [waitlistName, setWaitlistName] = useState('');
    const [waitlistPhone, setWaitlistPhone] = useState('');
    const [waitlistDone, setWaitlistDone] = useState(false);
    const [waitlistQuote, setWaitlistQuote] = useState<number | null>(null);
    // Menu / order state
    const [menuCategories, setMenuCategories] = useState<any[]>([]);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    // Reviews state
    const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewName, setReviewName] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [reviewImages, setReviewImages] = useState<File[]>([]);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    // Past visit memory
    const [pastVisit, setPastVisit] = useState<{ date: string; time: string; guests: number } | null>(null);
    // Real-time table availability
    const [unavailableTables, setUnavailableTables] = useState<string[]>([]);

    const resT = (key: string) => t(`restaurant.${key}`);

    const availableTimes = [
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
    ];

    useEffect(() => {
        async function loadData() {
            const { data } = await getRestaurantBySlug(resolvedParams.slug);
            if (data) {
                setRestaurant(data);
                const { data: cats } = await getMenuByRestaurant(data.id);
                setMenuCategories(cats || []);
                // Load reviews from DB
                const summary = await getReviewsByRestaurant(data.id);
                setReviewSummary(summary);
            }

            // Check auth and fetch profile for "Dining DNA"
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { profile } = await getProfile(user.id);
                if (profile) {
                    if (profile.full_name) setGuestName(profile.full_name);
                    if (profile.phone) setGuestPhone(profile.phone);
                    if (profile.dietary_restrictions && profile.dietary_restrictions.length > 0) {
                        setDietaryRestrictions(profile.dietary_restrictions.join(', '));
                    }
                } else if (user.user_metadata?.full_name) {
                    setGuestName(user.user_metadata.full_name);
                }

                // Load past visit for this restaurant
                if (data) {
                    const { data: pastBookings } = await supabase
                        .from('reservations')
                        .select('reservation_time, guest_count')
                        .eq('user_id', user.id)
                        .eq('restaurant_id', data.id)
                        .neq('status', 'cancelled')
                        .order('reservation_time', { ascending: false })
                        .limit(1);
                    if (pastBookings && pastBookings.length > 0) {
                        const d = new Date(pastBookings[0].reservation_time);
                        setPastVisit({
                            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            guests: pastBookings[0].guest_count,
                        });
                    }
                }
            }

            setLoading(false);
        }
        loadData();
    }, [resolvedParams.slug]);

    useEffect(() => {
        if (showWaitlist && restaurant && selectedDate && selectedTime) {
            calculateWaitTime(
                restaurant.id,
                partySize,
                new Date(`${selectedDate}T${selectedTime}`).toISOString()
            ).then(res => {
                if (res.data) setWaitlistQuote(res.data);
            });
        }

        // Fetch booked tables when date/time changes
        if (restaurant && selectedDate && selectedTime) {
            getUnavailableTables(restaurant.id, selectedDate, selectedTime).then((ids: string[]) => {
                setUnavailableTables(ids);
                // Also clear selected table if it just became unavailable
                if (selectedTable && ids.includes(selectedTable)) {
                    setSelectedTable(null);
                }
            });
        }
    }, [showWaitlist, restaurant, partySize, selectedDate, selectedTime]);

    // Lightbox state — must be declared BEFORE any early returns (Rules of Hooks)
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(0);
    const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true); };

    // Static reviews data removed — now loaded from DB
    const reviews: ReviewSummary['reviews'] = reviewSummary?.reviews || [];


    if (loading) return (
        <div className="min-h-screen bg-gray-50 pt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <div className="grid lg:grid-cols-[1fr_400px] gap-12">
                    <div className="space-y-6">
                        <div className="skeleton h-[500px] rounded-2xl" />
                        <div className="skeleton h-8 w-1/2 rounded-lg" />
                        <div className="skeleton h-32 rounded-xl" />
                    </div>
                    <div className="skeleton h-[500px] rounded-2xl" />
                </div>
            </div>
        </div>
    );
    if (!restaurant) return <div className="min-h-screen flex items-center justify-center">Restaurant not found.</div>;

    const filteredTables = (restaurant.tables || [])
        .filter((t: any) => t.capacity >= partySize)
        .filter((t: any) => !unavailableTables.includes(t.id));

    const handleBooking = async () => {
        if (!selectedTable || !selectedDate || !selectedTime) return;

        setBookingLoading(true);
        const reservationTime = new Date(`${selectedDate}T${selectedTime}`).toISOString();

        const result = await createBooking({
            restaurant_id: restaurant.id,
            table_id: selectedTable,
            guest_count: partySize,
            reservation_time: reservationTime,
            guest_name: guestName,
            guest_phone: guestPhone,
            guest_notes: guestNotes,
            occasion: occasion || undefined,
            dietary_restrictions: dietaryRestrictions || undefined,
        });

        setBookingLoading(false);
        if (result.success) {
            // Create order if cart has items
            if (cartItems.length > 0 && result.reservationId) {
                createOrder({
                    reservation_id: result.reservationId,
                    restaurant_id: restaurant.id,
                    items: cartItems,
                }).catch(console.error);
            }
            // Navigate to the confirmation page
            const params = new URLSearchParams({
                restaurant: restaurant.name,
                date: selectedDate,
                time: selectedTime,
                guests: String(partySize),
                address: restaurant.address || '',
                occasion: occasion || '',
                ...(result.reservationId ? { id: result.reservationId } : {}),
            });
            router.push(`/booking-confirmed?${params.toString()}`);
        } else {
            toast.error(result.error || 'Failed to create reservation');
        }
    };

    const handleJoinWaitlist = async () => {
        if (!selectedDate || !selectedTime) return;
        setWaitlistLoading(true);
        const { error } = await joinWaitlist({
            restaurant_id: restaurant.id,
            party_size: partySize,
            requested_time: new Date(`${selectedDate}T${selectedTime}`).toISOString(),
            guest_name: waitlistName || undefined,
            guest_phone: waitlistPhone || undefined,
        });
        setWaitlistLoading(false);
        if (error) toast.error(error);
        else {
            setWaitlistDone(true);
            toast.success(t('waitlist.successToast'));
        }
    };

    const images = restaurant.gallery_images || restaurant.images || [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=1200&h=800&fit=crop'
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-20">
            {/* Back Button */}
            <div className="bg-white/80 backdrop-blur-md sticky top-16 z-40 border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
                    <Link href="/restaurants" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary smooth-transition">
                        <ChevronLeft className="h-4 w-4" />
                        {resT('back')}
                    </Link>
                </div>
            </div>

            {/* Hero Gallery */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-8 mt-4 mb-10">
                <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[450px] sm:h-[550px] rounded-[2rem] overflow-hidden shadow-2xl bg-white p-2">
                    {/* Main large image or video */}
                    <div className="col-span-4 sm:col-span-2 row-span-2 relative group cursor-pointer overflow-hidden rounded-[1.5rem]" onClick={() => !restaurant.video_url && openLightbox(0)}>
                        {restaurant.video_url ? (
                            <video
                                src={restaurant.video_url}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 pointer-events-none"
                            />
                        ) : (
                            <img
                                src={images[0]}
                                alt={`${restaurant.name} interior`}
                                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                            />
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                        {/* Glassmorphic Title Card */}
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl transform transition-transform duration-500 group-hover:translate-y-[-4px]">
                                <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-white drop-shadow-lg">{restaurant.name}</h1>
                                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/90">
                                    <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
                                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                        {restaurant.rating || 4.8} ({restaurant.reviewCount || 120})
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
                                        <UtensilsCrossed className="h-3.5 w-3.5" />
                                        {t(`home.cuisineFilters.${(restaurant.cuisine_type || restaurant.cuisine || '').toLowerCase().replace(' ', '')}`) || restaurant.cuisine_type || restaurant.cuisine}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {restaurant.city}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary images */}
                    <div className="hidden sm:block col-span-1 row-span-1 overflow-hidden group cursor-pointer rounded-[1.5rem]" onClick={() => openLightbox(1)}>
                        <img src={images[1]} alt="Gallery 2" className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110" />
                    </div>
                    <div className="hidden sm:block col-span-1 row-span-1 overflow-hidden group cursor-pointer relative rounded-[1.5rem]" onClick={() => openLightbox(2)}>
                        <img src={images[2]} alt="Gallery 3" className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110" />
                        {/* Favorite button overlay */}
                        <button className="absolute top-4 right-4 p-2.5 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full transition-all duration-300 text-white hover:scale-110 hover:text-red-500 shadow-lg" onClick={e => e.stopPropagation()}>
                            <Heart className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="hidden sm:block col-span-1 row-span-1 overflow-hidden group cursor-pointer rounded-[1.5rem]" onClick={() => openLightbox(3)}>
                        <img src={images[3]} alt="Gallery 4" className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110" />
                    </div>
                    <div className="hidden sm:block col-span-1 row-span-1 overflow-hidden group cursor-pointer relative rounded-[1.5rem]" onClick={() => openLightbox(4)}>
                        <img src={images[4]} alt="Gallery 5" className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110" />
                        {/* View all photos button */}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center backdrop-blur-[2px]">
                            <button className="bg-white/95 hover:bg-white text-black font-bold px-5 py-2.5 rounded-xl transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-xl text-sm flex items-center gap-2">
                                <Globe className="h-4 w-4" /> {t('common.viewAll')} ({images.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <div className="grid lg:grid-cols-[1fr_400px] gap-12 relative">

                    {/* Left Column: Rich Content */}
                    <div className="space-y-12">
                        {/* Section: Badges and Quick details */}
                        <div className="flex flex-wrap gap-2.5 mb-6">
                            <Badge variant="outline" className="text-sm px-4 py-1.5 font-bold flex items-center gap-1 border-primary/30 text-primary bg-primary/5 rounded-full shadow-sm">
                                {'$'.repeat(restaurant.price_range || 3)}
                            </Badge>

                            {restaurant.vibe_tags?.map((vibe: string) => (
                                <Badge key={vibe} variant="secondary" className="text-sm px-4 py-1.5 font-semibold bg-gray-100/80 hover:bg-gray-200 text-gray-800 rounded-full transition-colors border border-gray-200/50">
                                    {vibe}
                                </Badge>
                            ))}
                            {(restaurant.features || []).map((feature: string) => (
                                <Badge key={feature} variant="secondary" className="text-sm px-4 py-1.5 font-semibold bg-gray-100/80 hover:bg-gray-200 text-gray-800 rounded-full transition-colors border border-gray-200/50">
                                    {feature}
                                </Badge>
                            ))}
                        </div>

                        {/* Section: About */}
                        <section className="prose prose-lg max-w-none">
                            <h2 className="text-3xl font-bold mb-5 font-[family-name:var(--font-geist-sans)] tracking-tight text-gray-900 border-b pb-4">
                                {resT('aboutUs') || `About ${restaurant.name}`}
                            </h2>
                            <p className="text-gray-600 leading-loose text-lg whitespace-pre-line font-medium text-balance">
                                {restaurant.description}
                            </p>
                        </section>

                        {/* Section: Menus */}
                        <section className="pt-8">
                            <h2 className="text-2xl font-bold mb-6 font-[family-name:var(--font-geist-sans)] tracking-tight">{resT('menus')}</h2>
                            <div className="bg-white rounded-[1.5rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                            <UtensilsCrossed className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-bold text-xl">A la Carte Menu</h3>
                                    </div>
                                    <p className="text-gray-500 text-base mb-6 max-w-md leading-relaxed">
                                        Explore our seasonal offerings featuring local ingredients and modern techniques curated by our head chef.
                                    </p>
                                    <Button variant="outline" className="rounded-full px-6 font-semibold border-gray-200 hover:border-primary hover:text-primary transition-all">
                                        View Full Menu
                                    </Button>
                                </div>
                            </div>
                        </section>

                        {/* Section: Experiences */}
                        <section className="pt-4">
                            <h2 className="text-2xl font-bold mb-6 font-[family-name:var(--font-geist-sans)] tracking-tight">{resT('experiences')}</h2>
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-[1.5rem] p-8 border border-amber-100/50 shadow-[0_8px_30px_rgb(251,191,36,0.1)] relative overflow-hidden group">
                                <div className="absolute right-0 bottom-0 w-48 h-48 bg-amber-200/20 blur-3xl rounded-full" />
                                <div className="relative z-10">
                                    <h3 className="font-bold text-xl mb-3 text-amber-900 tracking-tight">Chef's Tasting Menu</h3>
                                    <p className="text-amber-800/80 text-base mb-6 max-w-md leading-relaxed">
                                        Join us for an exclusive 7-course seasonal tasting journey, perfectly paired with our sommelier's wine selection.
                                    </p>
                                    <Button className="rounded-full px-6 font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all border-0">
                                        Learn More
                                    </Button>
                                </div>
                            </div>
                        </section>

                        {/* Section: Need to Know */}
                        <section className="pt-8 mb-8 border-t border-gray-100">
                            <h2 className="text-2xl font-bold mb-6 font-[family-name:var(--font-geist-sans)] tracking-tight">{resT('needToKnow')}</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50/80 p-6 rounded-[1.25rem] border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                                    <h3 className="font-bold flex items-center gap-3 mb-3 text-gray-900">
                                        <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-100"><Briefcase className="h-4 w-4 text-primary" /></div>
                                        {resT('dressCode')}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed font-medium">{restaurant.dress_code || t('bookings.modifyDialog.optional')}</p>
                                </div>
                                <div className="bg-gray-50/80 p-6 rounded-[1.25rem] border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                                    <h3 className="font-bold flex items-center gap-3 mb-3 text-gray-900">
                                        <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-100"><Info className="h-4 w-4 text-primary" /></div>
                                        {resT('cancellationPolicy')}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                                        {restaurant.cancellation_policy || "Cancellations made within 24 hours of the reservation may be subject to a fee."}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section: Location Map */}
                        {restaurant.address && (
                            <section className="pt-8 border-t border-gray-100">
                                <h2 className="text-2xl font-bold mb-6 font-[family-name:var(--font-geist-sans)] tracking-tight">{resT('findUs')}</h2>
                                <div className="rounded-[1.5rem] overflow-hidden border border-gray-200 shadow-xl shadow-gray-200/20">
                                    <iframe
                                        title="Restaurant Location"
                                        width="100%"
                                        height="300"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(restaurant.address)}&marker=0,0&layer=mapnik`}
                                        className="grayscale-[30%] contrast-[110%]"
                                    />
                                    <div className="p-5 bg-white flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                                <MapPin className="h-4 w-4" />
                                            </div>
                                            {restaurant.address}
                                        </p>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary font-medium hover:underline"
                                        >
                                            {resT('openInMaps')}
                                        </a>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Section: Reviews */}
                        <section className="pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold font-[family-name:var(--font-geist-sans)] tracking-tight text-gray-900">{resT('reviewsTitle') || 'Guest Reviews'}</h2>
                                    {reviewSummary && reviewSummary.total > 0 && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <Star key={i} className={`h-5 w-5 ${i <= Math.round(reviewSummary.average) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                                ))}
                                            </div>
                                            <span className="text-lg font-bold ml-1 text-gray-900">{reviewSummary.average}</span>
                                            <span className="text-sm font-medium text-gray-500">({reviewSummary.total} {t('common.reviews')})</span>
                                        </div>
                                    )}
                                </div>
                                <Button variant="outline" className="rounded-full px-6 font-semibold border-gray-200 hover:border-amber-500 hover:text-amber-600 transition-all font-[family-name:var(--font-geist-sans)]" onClick={() => setReviewModalOpen(true)}>{t('bookings.reviews.writeReview')}</Button>
                            </div>

                            {/* Rating breakdown bars */}
                            {reviewSummary && reviewSummary.total > 0 && (
                                <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 space-y-3">
                                    {reviewSummary.breakdown.map(({ stars, count, pct }) => (
                                        <div key={stars} className="flex items-center gap-4 group cursor-default">
                                            <div className="flex items-center gap-1.5 w-12 shrink-0 justify-end">
                                                <span className="text-sm font-bold text-gray-700">{stars}</span>
                                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                            </div>
                                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden relative">
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-300 to-amber-500 rounded-full transition-all duration-1000 ease-out shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-400 w-8">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Write a Review Modal */}
                            {reviewModalOpen && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setReviewModalOpen(false)}>
                                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 transform transition-all duration-300 scale-100 opacity-100" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-2xl font-bold font-[family-name:var(--font-geist-sans)] tracking-tight">{t('bookings.reviews.writeReview')}</h3>
                                            <button onClick={() => setReviewModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="space-y-5">
                                            <div>
                                                <label className="text-sm font-bold text-gray-700 mb-2 block">{t('bookings.guestDetails.name')}</label>
                                                <input type="text" value={reviewName} onChange={e => setReviewName(e.target.value)} placeholder={t('bookings.guestDetails.namePlaceholder') || "How should we display your name?"} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[1rem] text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-bold text-gray-700 mb-2 block">Rating</label>
                                                <div className="flex gap-2 p-2 bg-gray-50 rounded-[1rem] border border-gray-100 w-fit">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <button key={s} onClick={() => setReviewRating(s)} className="hover:scale-110 transition-transform">
                                                            <Star className={`w-8 h-8 transition-colors ${s <= reviewRating ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-gray-300 hover:text-amber-200'}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-bold text-gray-700 mb-2 block">Review</label>
                                                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Wait, that's optional!" rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[1.25rem] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-bold text-gray-700 mb-2 block">Photos</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {reviewImages.map((file, idx) => (
                                                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                                                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="upload preview" />
                                                            <button
                                                                onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 className="w-5 h-5 text-white" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors shrink-0">
                                                        <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                if (e.target.files) {
                                                                    setReviewImages(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 4));
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                            <Button
                                                className="w-full rounded-full py-6 text-base font-bold bg-gray-900 hover:bg-black text-white shadow-xl shadow-gray-900/20 transition-all border-0 mt-2"
                                                disabled={reviewSubmitting || !reviewName.trim()}
                                                onClick={async () => {
                                                    if (!restaurant) return;
                                                    setReviewSubmitting(true);

                                                    // Upload images first
                                                    const uploadedUrls: string[] = [];
                                                    const supabase = createClient();
                                                    for (const file of reviewImages) {
                                                        const fileExt = file.name.split('.').pop();
                                                        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                                                        const filePath = `${restaurant.id}/${fileName}`;

                                                        const { data, error } = await supabase.storage.from('reviews_images').upload(filePath, file);
                                                        if (data) {
                                                            const { data: { publicUrl } } = supabase.storage.from('reviews_images').getPublicUrl(filePath);
                                                            uploadedUrls.push(publicUrl);
                                                        }
                                                    }

                                                    const result = await createReview(restaurant.id, reviewRating, reviewText, reviewName, uploadedUrls);
                                                    setReviewSubmitting(false);
                                                    if (result.error) {
                                                        toast.error(result.error);
                                                    } else {
                                                        toast.success('Review submitted! Thank you.');
                                                        setReviewModalOpen(false);
                                                        setReviewText(''); setReviewName(''); setReviewRating(5); setReviewImages([]);
                                                        const summary = await getReviewsByRestaurant(restaurant.id);
                                                        setReviewSummary(summary);
                                                    }
                                                }}
                                            >
                                                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid sm:grid-cols-2 gap-4">
                                {reviews.length === 0 && (
                                    <div className="sm:col-span-2 text-center py-12 text-gray-400 text-base font-medium border-2 border-dashed border-gray-200 rounded-[2rem] bg-gray-50/50">
                                        No reviews yet. Be the first to share your experience!
                                    </div>
                                )}
                                {reviews.map((review) => {
                                    const initials = review.guest_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                                    const displayDate = review.visited_date
                                        ? new Date(review.visited_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                        : new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                    return (
                                        <div key={review.id} className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 group">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-base">{review.guest_name}</p>
                                                        <p className="text-xs font-medium text-gray-500 mt-0.5">{displayDate}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5 shrink-0 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <Star key={i} className={`h-3 w-3 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            {review.review_text && (
                                                <p className="text-gray-600 text-sm leading-relaxed font-medium line-clamp-4 group-hover:line-clamp-none transition-all duration-500">
                                                    "{review.review_text}"
                                                </p>
                                            )}
                                            {review.images && review.images.length > 0 && (
                                                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                                    {review.images.map((img, idx) => (
                                                        <img key={idx} src={img} alt="Review attachment" className="h-24 w-24 object-cover rounded-xl shadow-sm cursor-pointer hover:opacity-90 transition-opacity shrink-0" onClick={() => window.open(img, '_blank')} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t">
                            {restaurant.address && (
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span>{restaurant.address}</span>
                                </div>
                            )}
                            {restaurant.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span>{restaurant.phone}</span>
                                </div>
                            )}
                            {restaurant.email && (
                                <div className="flex items-center gap-2 text-sm break-all">
                                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span>{restaurant.email}</span>
                                </div>
                            )}
                            {restaurant.website && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <a href={restaurant.website.startsWith('http') ? restaurant.website : `https://${restaurant.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline truncate">
                                        {restaurant.website}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking Widget - desktop only */}
                    <Card id="booking-widget" className="hidden lg:block premium-card p-6 h-fit sticky top-24 z-10 scroll-mt-24">

                        {/* Cooking loader overlay */}
                        {bookingLoading && (
                            <div className="absolute inset-0 z-50 rounded-2xl bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                <div className="relative w-16 h-16">
                                    <span className="absolute -top-4 left-3 text-lg animate-steam">💨</span>
                                    <span className="absolute -top-4 left-6 text-lg animate-steam-2">💨</span>
                                    <span className="absolute -top-4 left-9 text-lg animate-steam-3">💨</span>
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl">
                                        👨‍🍳
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-gray-700">Preparing your table…</p>
                                <p className="text-xs text-gray-400">Almost there!</p>
                            </div>
                        )}

                        {/* Past visit memory banner */}
                        {pastVisit && (
                            <div className="mb-4 flex items-start gap-3 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                                <span className="text-xl shrink-0">👋</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-emerald-800">Welcome back!</p>
                                    <p className="text-[11px] text-emerald-600 mt-0.5">
                                        Your last visit was on <strong>{pastVisit.date}</strong> for {pastVisit.guests} guests. Same time works great?
                                    </p>
                                </div>
                            </div>
                        )}

                        <h2 className="text-2xl font-bold mb-4">{resT('makeReservation')}</h2>

                        {/* Animated Stepper */}
                        <div className="flex items-center mb-6">
                            {BOOKING_STEPS.map((s, idx) => {
                                const currentIdx = BOOKING_STEPS.findIndex(x => x.key === step);
                                const isDone = idx < currentIdx;
                                const isCurrent = s.key === step;
                                return (
                                    <>
                                        <div key={s.key} className="flex flex-col items-center">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isDone ? 'bg-green-500 text-white' :
                                                isCurrent ? 'bg-primary text-white ring-4 ring-primary/20' :
                                                    'bg-gray-100 text-gray-400'
                                                }`}>
                                                {isDone ? '✓' : s.num}
                                            </div>
                                            <span className={`text-[10px] mt-1 font-medium transition-colors ${isCurrent ? 'text-primary' : isDone ? 'text-green-600' : 'text-gray-400'
                                                }`}>{
                                                    s.key === 'datetime' ? resT('stepper.step1').split(': ')[1] || s.rawLabel :
                                                        s.key === 'table' ? resT('stepper.step2').split(': ')[1] || s.rawLabel :
                                                            s.key === 'menu' ? resT('stepper.step3').split(': ')[1] || s.rawLabel :
                                                                s.key === 'confirm' ? resT('stepper.step4').split(': ')[1] || s.rawLabel : s.rawLabel
                                                }</span>
                                        </div>
                                        {idx < BOOKING_STEPS.length - 1 && (
                                            <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all duration-500 ${idx < currentIdx ? 'bg-green-400' : 'bg-gray-200'
                                                }`} />
                                        )}
                                    </>
                                );
                            })}
                        </div>

                        {/* Step 1: Date, Time, Party Size */}
                        {step === 'datetime' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">{resT('chooseDay')}</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">{resT('partySize')}</label>
                                    <select
                                        value={partySize}
                                        onChange={(e) => setPartySize(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
                                            <option key={size} value={size}>{size} {size === 1 ? resT('guest') : resT('guests')}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">{resT('time')}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {availableTimes.map((time) => (
                                            <button
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={`px-3 py-2 border rounded-lg text-sm font-medium smooth-transition ${selectedTime === time
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'hover:border-primary hover:bg-primary/5'
                                                    }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setStep('table')}
                                    disabled={!selectedDate || !selectedTime}
                                    className="w-full"
                                    size="lg"
                                >
                                    {resT('chooseTable')}
                                </Button>
                            </div>
                        )}

                        {/* Step 2: Table Selection */}
                        {step === 'table' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedDate} {t('common.at')} {selectedTime}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {partySize} {partySize === 1 ? resT('guest') : resT('guests')}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setStep('datetime')}>
                                        {resT('change')}
                                    </Button>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium">
                                            {resT('availableTables')} ({filteredTables.length})
                                        </label>
                                        {restaurant.floor_plan_json?.backgroundImage && (
                                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setViewMode('list')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md smooth-transition ${viewMode === 'list' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    {resT('floorPlanModes.list')}
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('floor-plan')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md smooth-transition ${viewMode === 'floor-plan' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    {resT('floorPlanModes.floorPlan')}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {viewMode === 'floor-plan' && restaurant?.floor_plan_json?.backgroundImage ? (
                                        <div className="-mx-2 mb-4 bg-gray-50 rounded-xl overflow-hidden border">
                                            <FloorPlanViewer
                                                tables={restaurant.tables}
                                                backgroundImage={restaurant.floor_plan_json.backgroundImage}
                                                selectedTableId={selectedTable}
                                                onTableSelect={(id) => {
                                                    const table = restaurant.tables.find((t: any) => t.id === id);
                                                    if (!table || table.capacity < partySize || unavailableTables.includes(id)) return;
                                                    setSelectedTable(id);
                                                }}
                                                getTableStatus={(table) => {
                                                    if (table.capacity < partySize) return 'disabled';
                                                    if (unavailableTables.includes(table.id)) return 'booked';
                                                    return 'available';
                                                }}
                                                className="border-none bg-transparent"
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 mb-6 max-h-[300px] overflow-auto hide-scrollbar">
                                            {filteredTables.map((table: any) => (
                                                <button
                                                    key={table.id}
                                                    onClick={() => setSelectedTable(table.id)}
                                                    className={`p-3 text-left border-2 rounded-xl smooth-transition ${selectedTable === table.id
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-gray-200 hover:border-primary/30'
                                                        }`}
                                                >
                                                    <p className="font-bold">{t('bookings.table')} {table.table_number}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5" suppressHydrationWarning>
                                                        {t('common.upTo')} {table.capacity} {resT('guests')}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* No tables for party — show waitlist option */}
                                    {filteredTables.length === 0 && !showWaitlist && (
                                        <div className="text-center py-6 border-2 border-dashed border-muted rounded-xl">
                                            <p className="text-muted-foreground text-sm mb-3">
                                                {t('restaurant.noTables', { partySize })}
                                            </p>
                                            <Button variant="outline" size="sm" onClick={() => setShowWaitlist(true)}>
                                                {resT('joinWaitlist')}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Waitlist form */}
                                    {showWaitlist && (
                                        <div className="border rounded-xl p-4 space-y-3 bg-amber-50 border-amber-200">
                                            {waitlistDone ? (
                                                <div className="text-center py-4">
                                                    <p className="font-semibold text-emerald-700">{t('waitlist.success')}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{t('waitlist.successDesc')}</p>
                                                    <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setShowWaitlist(false); setWaitlistDone(false); }}>{t('common.close')}</Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                                        🔔 {t('waitlist.title', { date: selectedDate, time: selectedTime })}
                                                    </h4>
                                                    {waitlistQuote !== null && (
                                                        <div className="bg-amber-100 text-amber-900 border border-amber-200 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                                                            {t('waitlist.estimatedWait', { mins: waitlistQuote })}
                                                        </div>
                                                    )}
                                                    <input
                                                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                                                        placeholder={t('waitlist.namePlaceholder')}
                                                        value={waitlistName}
                                                        onChange={e => setWaitlistName(e.target.value)}
                                                    />
                                                    <input
                                                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                                                        placeholder={t('waitlist.phonePlaceholder')}
                                                        type="tel"
                                                        value={waitlistPhone}
                                                        onChange={e => setWaitlistPhone(e.target.value)}
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button size="sm" onClick={handleJoinWaitlist} disabled={waitlistLoading || !waitlistName} className="flex-1 border-amber-300 text-amber-900 hover:bg-amber-100 hover:text-amber-950">
                                                            {waitlistLoading ? t('waitlist.joining') : t('waitlist.confirmWaitlist')}
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setShowWaitlist(false)} className="text-amber-700 hover:text-amber-900">{t('common.cancel')}</Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        onClick={() => setStep('menu')}
                                        disabled={!selectedTable}
                                        className="w-full mt-4"
                                        size="lg"
                                    >
                                        {resT('confirmContinue')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 2.5: Optional Menu / Advance Order */}
                        {step === 'menu' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{t('menu.orderInAdvance')}</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setStep('table')}>{t('common.back')}</Button>
                                </div>
                                <p className="text-sm text-muted-foreground">{t('menu.orderDesc')}</p>
                                {menuCategories.length > 0 ? (
                                    <MenuBrowser
                                        categories={menuCategories}
                                        cart={cartItems}
                                        onCartChange={setCartItems}
                                    />
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">{t('menu.noMenu')}</p>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" className="flex-1" onClick={() => { setCartItems([]); setStep('confirm'); }}>
                                        {t('menu.skip')}
                                    </Button>
                                    <Button className="flex-1" onClick={() => setStep('confirm')}>
                                        {cartItems.length > 0 ? t('menu.continueWithItems', { count: cartItems.reduce((sum, i) => sum + i.quantity, 0) }) : resT('confirmContinue')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Confirmation */}
                        {step === 'confirm' && (
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <h3 className="font-semibold">{resT('summary')}</h3>
                                    <div className="text-sm space-y-1">
                                        <p><span className="text-muted-foreground">{t('common.restaurant')}:</span> {restaurant.name}</p>
                                        <p><span className="text-muted-foreground">{resT('date')}:</span> {selectedDate}</p>
                                        <p><span className="text-muted-foreground">{resT('time')}:</span> {selectedTime}</p>
                                        <p><span className="text-muted-foreground">{resT('partySize')}:</span> {partySize} {partySize === 1 ? resT('guest') : resT('guests')}</p>
                                        <p><span className="text-muted-foreground">{t('bookings.table')}:</span> {selectedTable}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{resT('name')}</label>
                                        <input
                                            type="text"
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            placeholder={t('auth.fullName')}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{resT('phone')}</label>
                                        <input
                                            type="tel"
                                            value={guestPhone}
                                            onChange={(e) => setGuestPhone(e.target.value)}
                                            placeholder="+995 555 123 456"
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Occasion ({t('common.optional')})</label>
                                        <select
                                            value={occasion}
                                            onChange={(e) => setOccasion(e.target.value)}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">{resT('occasions.none')}</option>
                                            <option value="Birthday">{resT('occasions.birthday')}</option>
                                            <option value="Anniversary">{resT('occasions.anniversary')}</option>
                                            <option value="Date Night">{resT('occasions.dateNight')}</option>
                                            <option value="Business">{resT('occasions.business')}</option>
                                            <option value="Other">{resT('occasions.other')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{resT('dietaryRestrictions')}</label>
                                        <input
                                            type="text"
                                            value={dietaryRestrictions}
                                            onChange={(e) => setDietaryRestrictions(e.target.value)}
                                            placeholder={resT('dietaryPlaceholder')}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{resT('specialRequests')} ({t('common.optional')})</label>
                                        <textarea
                                            value={guestNotes}
                                            onChange={(e) => setGuestNotes(e.target.value)}
                                            placeholder={t('bookings.specialRequests')}
                                            rows={3}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep('table')} className="flex-1">
                                        {t('common.back')}
                                    </Button>
                                    <Button
                                        onClick={handleBooking}
                                        className="flex-1"
                                        size="lg"
                                        disabled={bookingLoading || !guestName || !guestPhone}
                                    >
                                        {bookingLoading ? t('common.loading') : resT('confirmBooking')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Opening Hours */}
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <Card className="p-6">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Clock className="h-6 w-6 text-primary" />
                            {resT('openingHours')}
                        </h2>
                        <div className="grid md:grid-cols-2 gap-3">
                            {restaurant.opening_hours && Object.entries(restaurant.opening_hours).map(([day, hours]: [string, any]) => (
                                <div key={day} className="flex justify-between items-center py-2 border-b last:border-0">
                                    <span className="font-medium capitalize">{t(`restaurant.days.${day}`)}</span>
                                    <span className={hours === 'Closed' ? 'text-red-600' : 'text-muted-foreground'}>
                                        {hours === 'Closed' ? t('common.closed') : hours}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div >

            {/* Mobile sticky booking bar */}
            < div className="lg:hidden fixed bottom-0 left-0 right-0 z-50" >
                {/* Backdrop */}
                {
                    mobileBookingOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={() => setMobileBookingOpen(false)}
                        />
                    )
                }

                {/* Drawer */}
                <div
                    className={`relative z-50 bg-white dark:bg-card rounded-t-3xl border-t border-border shadow-[0_-8px_40px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out ${mobileBookingOpen ? 'translate-y-0' : 'translate-y-[calc(100%-80px)]'
                        }`}
                    style={{ maxHeight: '92dvh', overflowY: 'auto' }}
                >
                    {/* Drag handle + compact summary */}
                    <button
                        className="w-full pt-3 pb-4 px-6 flex flex-col items-center gap-2 focus:outline-none"
                        onClick={() => setMobileBookingOpen(o => !o)}
                    >
                        <div className="w-10 h-1 bg-gray-300 dark:bg-muted-foreground/30 rounded-full" />
                        <div className="w-full flex items-center justify-between">
                            <div className="text-left">
                                <p className="font-bold text-base leading-tight">{restaurant.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {step === 'datetime' && !selectedDate && resT('mobile.tapToReserve')}
                                    {step === 'datetime' && selectedDate && `${selectedDate} · ${partySize} ${resT(partySize === 1 ? 'guest' : 'guests')}`}
                                    {step === 'table' && resT('mobile.chooseYourTable')}
                                    {step === 'menu' && resT('mobile.optionalExtras')}
                                    {step === 'confirm' && resT('mobile.almostDone')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Step dots */}
                                {BOOKING_STEPS.map((s, i) => {
                                    const ci = BOOKING_STEPS.findIndex(x => x.key === step);
                                    return (
                                        <div
                                            key={s.key}
                                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i < ci ? 'bg-green-500' : i === ci ? 'bg-primary' : 'bg-gray-200'
                                                }`}
                                        />
                                    );
                                })}
                                <div className={`ml-1 transition-transform duration-200 ${mobileBookingOpen ? 'rotate-180' : ''}`}>
                                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Full booking widget rendered inside the drawer */}
                    {mobileBookingOpen && (
                        <div className="px-5 pb-8 pt-0">
                            {/* Stepper */}
                            <div className="flex items-center mb-5">
                                {BOOKING_STEPS.map((s, idx) => {
                                    const currentIdx = BOOKING_STEPS.findIndex(x => x.key === step);
                                    const isDone = idx < currentIdx;
                                    const isCurrent = s.key === step;
                                    return (
                                        <>
                                            <div key={s.key} className="flex flex-col items-center">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isDone ? 'bg-green-500 text-white' :
                                                    isCurrent ? 'bg-primary text-white ring-4 ring-primary/20' :
                                                        'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    {isDone ? '✓' : s.num}
                                                </div>
                                                <span className={`text-[10px] mt-1 font-medium ${isCurrent ? 'text-primary' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {s.rawLabel}
                                                </span>
                                            </div>
                                            {idx < BOOKING_STEPS.length - 1 && (
                                                <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all duration-500 ${idx < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                                            )}
                                        </>
                                    );
                                })}
                            </div>

                            {/* Step 1 */}
                            {step === 'datetime' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{resT('chooseDay')}</label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{resT('partySize')}</label>
                                        <select
                                            value={partySize}
                                            onChange={(e) => setPartySize(parseInt(e.target.value))}
                                            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
                                                <option key={size} value={size}>{size} {size === 1 ? resT('guest') : resT('guests')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{resT('time')}</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {availableTimes.map(time => (
                                                <button
                                                    key={time}
                                                    onClick={() => setSelectedTime(time)}
                                                    className={`py-2.5 border rounded-xl text-sm font-medium smooth-transition ${selectedTime === time ? 'bg-primary text-white border-primary' : 'hover:border-primary hover:bg-primary/5'
                                                        }`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStep('table')}
                                        disabled={!selectedDate || !selectedTime}
                                        className="w-full py-3.5 rounded-xl font-semibold bg-primary text-white disabled:opacity-40 smooth-transition hover:bg-primary/90"
                                    >
                                        {resT('chooseTable')}
                                    </button>
                                </div>
                            )}

                            {/* Step 2 */}
                            {step === 'table' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{selectedDate} {t('common.at')} {selectedTime}</p>
                                            <p className="text-sm text-muted-foreground">{partySize} {partySize === 1 ? resT('guest') : resT('guests')}</p>
                                        </div>
                                        <button onClick={() => setStep('datetime')} className="text-sm text-primary font-medium">{resT('change')}</button>
                                    </div>
                                    <div className="flex items-center justify-between mb-2 mt-4">
                                        <label className="block text-sm font-medium">{resT('availableTables')} ({filteredTables.length})</label>
                                        {restaurant.floor_plan_json?.backgroundImage && (
                                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setViewMode('list')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md smooth-transition ${viewMode === 'list' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    {resT('floorPlanModes.list')}
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('floor-plan')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md smooth-transition ${viewMode === 'floor-plan' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    {resT('floorPlanModes.floorPlan')}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {viewMode === 'floor-plan' && restaurant?.floor_plan_json?.backgroundImage ? (
                                        <div className="-mx-2 mb-4 bg-gray-50 rounded-xl overflow-hidden border">
                                            <FloorPlanViewer
                                                tables={restaurant.tables}
                                                backgroundImage={restaurant.floor_plan_json.backgroundImage}
                                                selectedTableId={selectedTable}
                                                onTableSelect={(id) => {
                                                    const table = restaurant.tables.find((t: any) => t.id === id);
                                                    if (!table || table.capacity < partySize || unavailableTables.includes(id)) return;
                                                    setSelectedTable(id);
                                                }}
                                                getTableStatus={(table) => {
                                                    if (table.capacity < partySize) return 'disabled';
                                                    if (unavailableTables.includes(table.id)) return 'booked';
                                                    return 'available';
                                                }}
                                                className="border-none bg-transparent"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-auto">
                                            {filteredTables.map((table: any) => (
                                                <button
                                                    key={table.id}
                                                    onClick={() => setSelectedTable(table.id)}
                                                    className={`w-full p-4 border-2 rounded-xl text-left smooth-transition ${selectedTable === table.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-semibold text-sm">{t('bookings.table')} {table.table_number}</p>
                                                            <p className="text-xs text-muted-foreground">{table.zone_name} · {t('common.upTo')} {table.capacity} {resT('guests')}</p>
                                                        </div>
                                                        {selectedTable === table.id && <Check className="h-4 w-4 text-primary" />}
                                                    </div>
                                                </button>
                                            ))}
                                            {filteredTables.length === 0 && (
                                                <div className="text-center py-6 border-2 border-dashed rounded-xl">
                                                    <p className="text-muted-foreground text-sm">{t('restaurant.noTables', { partySize })}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setStep('menu')}
                                        disabled={!selectedTable}
                                        className="w-full py-3.5 rounded-xl font-semibold bg-primary text-white disabled:opacity-40 smooth-transition hover:bg-primary/90"
                                    >
                                        {resT('confirmContinue')}
                                    </button>
                                </div>
                            )}

                            {/* Step 2.5 */}
                            {step === 'menu' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">{t('menu.orderInAdvance')}</h3>
                                        <button onClick={() => setStep('table')} className="text-sm text-primary font-medium">{t('common.back')}</button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{t('menu.orderDesc')}</p>
                                    {menuCategories.length > 0 ? (
                                        <MenuBrowser categories={menuCategories} cart={cartItems} onCartChange={setCartItems} />
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">{t('menu.noMenu')}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button onClick={() => { setCartItems([]); setStep('confirm'); }} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium">{t('menu.skip')}</button>
                                        <button onClick={() => setStep('confirm')} className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold">
                                            {cartItems.length > 0 ? t('menu.continueWithItems', { count: cartItems.reduce((s, i) => s + i.quantity, 0) }) : resT('confirmContinue')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3 */}
                            {step === 'confirm' && (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-muted rounded-xl p-4 text-sm space-y-1">
                                        <h3 className="font-semibold mb-2">{resT('summary')}</h3>
                                        <p><span className="text-muted-foreground">{t('common.restaurant')}:</span> {restaurant.name}</p>
                                        <p><span className="text-muted-foreground">{resT('date')}:</span> {selectedDate}</p>
                                        <p><span className="text-muted-foreground">{resT('time')}:</span> {selectedTime}</p>
                                        <p><span className="text-muted-foreground">{resT('partySize')}:</span> {partySize} {partySize === 1 ? resT('guest') : resT('guests')}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder={resT('name')} className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                        <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+995 555 123 456" className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                        <select value={occasion} onChange={e => setOccasion(e.target.value)} className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                            <option value="">Occasion ({t('common.optional')})</option>
                                            <option value="Birthday">{resT('occasions.birthday')}</option>
                                            <option value="Anniversary">{resT('occasions.anniversary')}</option>
                                            <option value="Date Night">{resT('occasions.dateNight')}</option>
                                            <option value="Business">{resT('occasions.business')}</option>
                                        </select>
                                        <textarea value={guestNotes} onChange={e => setGuestNotes(e.target.value)} placeholder={t('bookings.specialRequests')} rows={2} className="w-full px-4 py-3 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setStep('menu')} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium">{t('common.back')}</button>
                                        <button
                                            onClick={handleBooking}
                                            disabled={bookingLoading || !guestName || !guestPhone}
                                            className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40"
                                        >
                                            {bookingLoading ? t('common.loading') : resT('confirmBooking')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div >

            {/* Lightbox Modal */}
            {
                lightboxOpen && (
                    <div
                        className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <button
                            className="absolute top-5 right-5 text-white/60 hover:text-white text-4xl w-10 h-10 flex items-center justify-center"
                            onClick={() => setLightboxOpen(false)}
                        >
                            <X className="h-7 w-7" />
                        </button>
                        <button
                            className="absolute left-4 text-white/60 hover:text-white p-2"
                            onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + images.length) % images.length); }}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </button>
                        <img
                            src={images[lightboxIdx]}
                            alt={`Photo ${lightboxIdx + 1}`}
                            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        />
                        <button
                            className="absolute right-4 text-white/60 hover:text-white p-2"
                            onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % images.length); }}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </button>
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                            {images.map((_: string, i: number) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setLightboxIdx(i); }}
                                    className={`w-2 h-2 rounded-full transition-all ${i === lightboxIdx ? 'bg-white scale-125' : 'bg-white/40'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="absolute bottom-14 left-1/2 -translate-x-1/2 text-white/50 text-sm">
                            {lightboxIdx + 1} / {images.length}
                        </p>
                    </div>
                )
            }
        </div >
    );
}
