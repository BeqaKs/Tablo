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
    Briefcase, Info, UtensilsCrossed
} from 'lucide-react';
import { useLocale } from '@/lib/locale-context';
import { getRestaurantBySlug, createBooking } from '@/app/actions/bookings';
import { getProfile } from '@/app/actions/profile';
import { createClient } from '@/lib/supabase/client';
import { joinWaitlist, calculateWaitTime } from '@/app/actions/waitlist';
import { createOrder, CartItem } from '@/app/actions/orders';
import { getMenuByRestaurant } from '@/app/actions/menu';
import { Restaurant, Table } from '@/types/database';
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
    const [seatingPreference, setSeatingPreference] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'floor-plan'>('list');
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
    }, [showWaitlist, restaurant, partySize, selectedDate, selectedTime]);

    // Lightbox state — must be declared BEFORE any early returns (Rules of Hooks)
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(0);
    const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true); };

    // Static reviews data (would come from DB in production)
    const reviews = [
        { id: 1, name: 'Sarah M.', avatar: 'SM', rating: 5, date: 'Feb 2026', text: 'Absolutely incredible experience. The ambiance was perfect for our anniversary dinner, and the staff went above and beyond to make it special.', occasion: 'Anniversary' },
        { id: 2, name: 'David K.', avatar: 'DK', rating: 5, date: 'Jan 2026', text: "Best restaurant in the city. The tasting menu was a journey through flavors I'll never forget. Highly recommend the sommelier's wine pairing.", occasion: 'Date Night' },
        { id: 3, name: 'Ana L.', avatar: 'AL', rating: 4, date: 'Jan 2026', text: 'Wonderful food and great service. The pasta was exceptional and the desserts were out of this world. Will definitely be back!', occasion: null },
        { id: 4, name: 'Marco R.', avatar: 'MR', rating: 5, date: 'Dec 2025', text: 'Had our company dinner here and everyone was blown away. The private dining area was perfect and the chef accommodated all dietary restrictions flawlessly.', occasion: 'Business' },
    ];

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

    const filteredTables = (restaurant.tables || []).filter((t: any) => t.capacity >= partySize);

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
            seating_preference: seatingPreference || undefined,
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
            toast.success('Added to waitlist! We\'ll SMS you when a table opens.');
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
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] sm:h-[500px] rounded-2xl overflow-hidden shadow-lg">
                    {/* Main large image */}
                    <div className="col-span-4 sm:col-span-2 row-span-2 relative group cursor-pointer overflow-hidden" onClick={() => openLightbox(0)}>
                        <img
                            src={images[0]}
                            alt={`${restaurant.name} interior`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-6 left-6 text-white">
                            <h1 className="text-4xl font-bold mb-2 tracking-tight">{restaurant.name}</h1>
                            <div className="flex items-center gap-3 text-sm font-medium">
                                <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-white" /> {restaurant.rating || 4.8} ({restaurant.reviewCount || 120} reviews)</span>
                                <span>•</span>
                                <span>{restaurant.cuisine_type || restaurant.cuisine}</span>
                                <span>•</span>
                                <span>{restaurant.city}</span>
                            </div>
                        </div>
                    </div>
                    {/* Secondary images */}
                    <div className="hidden sm:block col-span-1 row-span-1 overflow-hidden group cursor-pointer" onClick={() => openLightbox(1)}>
                        <img src={images[1]} alt="Gallery 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="hidden sm:block col-span-1 row-span-1 overflow-hidden group cursor-pointer relative" onClick={() => openLightbox(2)}>
                        <img src={images[2]} alt="Gallery 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        {/* Favorite button overlay */}
                        <button className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full transition-colors text-white" onClick={e => e.stopPropagation()}>
                            <Heart className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="hidden sm:block col-span-1 row-span-1 overflow-hidden group cursor-pointer" onClick={() => openLightbox(3)}>
                        <img src={images[3]} alt="Gallery 4" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="hidden sm:block col-span-1 row-span-1 overflow-hidden group cursor-pointer relative" onClick={() => openLightbox(4)}>
                        <img src={images[4]} alt="Gallery 5" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        {/* View all photos button */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <button className="bg-white/90 hover:bg-white text-black font-semibold px-4 py-2 rounded-lg backdrop-blur-sm transition-colors text-sm flex items-center gap-2 shadow-lg">
                                <Globe className="h-4 w-4" /> View all {images.length} photos
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <div className="grid lg:grid-cols-[1fr_400px] gap-12 relative">

                    {/* Left Column: Rich Content */}
                    <div className="space-y-10">
                        {/* Section: Badges and Quick details */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <Badge variant="outline" className="text-sm px-3 py-1 font-semibold flex items-center gap-1 border-primary/20 text-primary bg-primary/5">
                                {'$'.repeat(restaurant.price_range || 3)}
                            </Badge>

                            {restaurant.vibe_tags?.map((vibe: string) => (
                                <Badge key={vibe} variant="secondary" className="text-sm px-3 py-1 font-medium bg-gray-100">
                                    {vibe}
                                </Badge>
                            ))}
                            {(restaurant.features || []).map((feature: string) => (
                                <Badge key={feature} variant="secondary" className="text-sm px-3 py-1 font-medium bg-gray-100">
                                    {feature}
                                </Badge>
                            ))}
                        </div>

                        {/* Section: About */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4 font-serif">About {restaurant.name}</h2>
                            <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                                {restaurant.description}
                            </p>
                        </section>

                        {/* Features */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {(restaurant.features || []).map((feature: string) => (
                                <Badge key={feature} variant="secondary">
                                    {feature}
                                </Badge>
                            ))}
                        </div>

                        {/* Section: Menus */}
                        <section className="pt-6 border-t border-gray-100">
                            <h2 className="text-2xl font-bold mb-4 font-serif">Menus</h2>
                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold text-lg">A la Carte Menu</h3>
                                </div>
                                <p className="text-gray-700 text-sm mb-4">
                                    Explore our seasonal offerings featuring local ingredients and modern techniques.
                                </p>
                                <Button variant="outline" size="sm">View Full Menu</Button>
                            </div>
                        </section>

                        {/* Section: Experiences */}
                        <section className="pt-6 border-t border-gray-100">
                            <h2 className="text-2xl font-bold mb-4 font-serif">Experiences</h2>
                            <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                                <h3 className="font-semibold text-lg mb-2">Chef's Tasting Menu</h3>
                                <p className="text-gray-700 text-sm mb-4">
                                    Join us for an exclusive 7-course seasonal tasting journey curated by our executive chef.
                                </p>
                                <Button variant="outline" size="sm" className="bg-white border-amber-200 hover:bg-amber-100">Learn More</Button>
                            </div>
                        </section>

                        {/* Section: Need to Know */}
                        <section className="pt-6 border-t border-gray-100">
                            <h2 className="text-2xl font-bold mb-4 font-serif">Need to Know</h2>
                            <div className="grid sm:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                                        <Briefcase className="h-4 w-4 text-primary" />
                                        Dress Code
                                    </h3>
                                    <p className="text-gray-700 text-sm">{restaurant.dress_code || "Smart Casual. Please no athletic wear."}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                                        <Info className="h-4 w-4 text-primary" />
                                        Cancellation Policy
                                    </h3>
                                    <p className="text-gray-700 text-sm">
                                        {restaurant.cancellation_policy || "Cancellations made within 24 hours of the reservation may be subject to a fee."}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section: Location Map */}
                        {restaurant.address && (
                            <section className="pt-6 border-t border-gray-100">
                                <h2 className="text-2xl font-bold mb-4 font-serif">{resT('findUs')}</h2>
                                <div className="rounded-xl overflow-hidden border shadow-sm">
                                    <iframe
                                        title="Restaurant Location"
                                        width="100%"
                                        height="260"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(restaurant.address)}&marker=0,0&layer=mapnik`}
                                    />
                                    <div className="p-4 bg-white flex items-center justify-between">
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-primary" />
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
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold font-serif">{resT('reviewsTitle')}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star key={i} className={`h-4 w-4 ${i <= 4.8 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                        <span className="text-sm font-semibold">{restaurant.rating || 4.8}</span>
                                        <span className="text-sm text-gray-500">({reviews.length * 30 + 12} reviews)</span>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">Write a Review</Button>
                            </div>

                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div key={review.id} className="bg-white rounded-xl p-5 border shadow-sm">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                    {review.avatar}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{review.name}</p>
                                                    <p className="text-xs text-gray-500">{review.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <Star key={i} className={`h-3.5 w-3.5 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        {review.occasion && (
                                            <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium mb-2">
                                                {review.occasion}
                                            </span>
                                        )}
                                        <p className="text-gray-700 text-sm leading-relaxed">{review.text}</p>
                                    </div>
                                ))}
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

                    {/* Booking Widget */}
                    <Card id="booking-widget" className="premium-card p-6 h-fit sticky top-24 z-10 scroll-mt-24">
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
                                                    List
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('floor-plan')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md smooth-transition ${viewMode === 'floor-plan' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    Floor Plan
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {viewMode === 'floor-plan' && restaurant.floor_plan_json ? (
                                        <div className="mb-4">
                                            <FloorPlanViewer
                                                tables={restaurant.tables} // Show all tables contextually
                                                backgroundImage={restaurant.floor_plan_json.backgroundImage}
                                                selectedTableId={selectedTable}
                                                onTableSelect={(id) => setSelectedTable(id)}
                                                getTableStatus={(table) => {
                                                    // 1. Capacity check
                                                    if (table.capacity < partySize) return 'disabled';
                                                    // 2. Availability check (future: check against bookings)
                                                    // For now, assume all tables matching capacity are available
                                                    return 'available';
                                                }}
                                            />
                                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                                Click on a green table to select it. Gray tables are too small/unavailable.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[400px] overflow-auto">
                                            {(filteredTables || []).map((table: any) => (
                                                <button
                                                    key={table.id}
                                                    onClick={() => setSelectedTable(table.id)}
                                                    className={`w-full p-4 border-2 rounded-lg text-left smooth-transition ${selectedTable === table.id
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-gray-200 hover:border-primary/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-semibold">{t('bookings.table')} {table.table_number}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {table.zone_name} • {t('common.upTo')} {table.capacity} {resT('guests')}
                                                            </p>
                                                        </div>
                                                        {selectedTable === table.id && (
                                                            <Check className="h-5 w-5 text-primary" />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* No tables for party — show waitlist option */}
                                {filteredTables.length === 0 && !showWaitlist && (
                                    <div className="text-center py-6 border-2 border-dashed border-muted rounded-xl">
                                        <p className="text-muted-foreground text-sm mb-3">
                                            No tables available for {partySize} guests at this time.
                                        </p>
                                        <Button variant="outline" size="sm" onClick={() => setShowWaitlist(true)}>
                                            Join Waitlist
                                        </Button>
                                    </div>
                                )}

                                {/* Waitlist form */}
                                {showWaitlist && (
                                    <div className="border rounded-xl p-4 space-y-3 bg-amber-50 border-amber-200">
                                        {waitlistDone ? (
                                            <div className="text-center py-4">
                                                <p className="font-semibold text-emerald-700">✅ You're on the waitlist!</p>
                                                <p className="text-sm text-muted-foreground mt-1">We'll SMS you when a table opens up.</p>
                                                <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setShowWaitlist(false); setWaitlistDone(false); }}>Close</Button>
                                            </div>
                                        ) : (
                                            <>
                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                    🔔 Join the Waitlist for {selectedDate} at {selectedTime}
                                                </h4>
                                                {waitlistQuote !== null && (
                                                    <div className="bg-amber-100 text-amber-900 border border-amber-200 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                                                        Estimated wait: {waitlistQuote} mins
                                                    </div>
                                                )}
                                                <input
                                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                                    placeholder="Your name"
                                                    value={waitlistName}
                                                    onChange={e => setWaitlistName(e.target.value)}
                                                />
                                                <input
                                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                                    placeholder="Phone (for SMS notification)"
                                                    type="tel"
                                                    value={waitlistPhone}
                                                    onChange={e => setWaitlistPhone(e.target.value)}
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={handleJoinWaitlist} disabled={waitlistLoading || !waitlistName} className="flex-1">
                                                        {waitlistLoading ? 'Joining...' : 'Confirm Waitlist'}
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setShowWaitlist(false)}>Cancel</Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <Button
                                    onClick={() => setStep('menu')}
                                    disabled={!selectedTable}
                                    className="w-full"
                                    size="lg"
                                >
                                    {resT('confirmContinue')}
                                </Button>
                            </div>
                        )}

                        {/* Step 2.5: Optional Menu / Advance Order */}
                        {step === 'menu' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">Order in Advance?</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setStep('table')}>Back</Button>
                                </div>
                                <p className="text-sm text-muted-foreground">Browse the menu and pre-select dishes — we'll have them ready at your table.</p>
                                {menuCategories.length > 0 ? (
                                    <MenuBrowser
                                        categories={menuCategories}
                                        cart={cartItems}
                                        onCartChange={setCartItems}
                                    />
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No menu available for this restaurant yet.</p>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" className="flex-1" onClick={() => { setCartItems([]); setStep('confirm'); }}>
                                        Skip Menu
                                    </Button>
                                    <Button className="flex-1" onClick={() => setStep('confirm')}>
                                        Continue {cartItems.length > 0 ? `(${cartItems.reduce((sum, i) => sum + i.quantity, 0)} items)` : ''}
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
                                            <option value="">None</option>
                                            <option value="Birthday">Birthday</option>
                                            <option value="Anniversary">Anniversary</option>
                                            <option value="Date Night">Date Night</option>
                                            <option value="Business">Business</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Seating Preference</label>
                                        <select
                                            value={seatingPreference}
                                            onChange={(e) => setSeatingPreference(e.target.value)}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">No Preference</option>
                                            <option value="Indoor">Indoor</option>
                                            <option value="Outdoor">Outdoor</option>
                                            <option value="Bar">Bar</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Dietary Restrictions</label>
                                        <input
                                            type="text"
                                            value={dietaryRestrictions}
                                            onChange={(e) => setDietaryRestrictions(e.target.value)}
                                            placeholder="e.g. Vegan, Nut Allergy"
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
            </div>

            {/* Mobile Sticky Booking Bar */}
            <div className="lg:hidden fixed bottom-16 sm:bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
                    <div className="flex-1">
                        <p className="font-semibold text-sm line-clamp-1">{restaurant.name}</p>
                        <p className="text-xs text-muted-foreground">Book a table now</p>
                    </div>
                    <Button asChild size="lg" className="px-8 shadow-md">
                        <a href="#booking-widget">
                            {resT('makeReservation')}
                        </a>
                    </Button>
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxOpen && (
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
            )}
        </div>
    );
}
