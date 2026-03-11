'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/components/translations-provider';
import { toast } from 'sonner';
import { 
    Clock, Users, User, Phone, Check, X, Plus, 
    Loader2, AlertCircle, Send, Timer
} from 'lucide-react';
import { getLiveWaitlist, addWalkInToWaitlist, updateWaitlistStatusOwner } from '@/app/actions/waitlist';
import { differenceInMinutes, format } from 'date-fns';

export function WaitlistPanel({ 
    restaurantId, 
    onSeatGuest, // Callback to open the Walk-in Modal pre-filled
}: { 
    restaurantId: string;
    onSeatGuest: (waitlistEntry: any) => void;
}) {
    const { t } = useTranslations();
    
    // Fallback translations if not found
    const getT = (key: string, fallback: string) => {
        const val = t(key);
        return val === key ? fallback : val;
    };

    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    
    // Quick Add Form
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [size, setSize] = useState(2);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadWaitlist = async () => {
        setLoading(true);
        const { data, error } = await getLiveWaitlist();
        if (error) {
            toast.error(error);
        } else {
            setEntries(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadWaitlist();
        // Refresh every minute to update wait times
        const interval = setInterval(loadWaitlist, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error(getT('nameRequired', 'Name is required'));
        
        setIsSubmitting(true);
        const { error } = await addWalkInToWaitlist(name, phone, size);
        setIsSubmitting(false);
        
        if (error) {
            toast.error(error);
        } else {
            toast.success(getT('addedSuccess', 'Added to waitlist'));
            setAdding(false);
            setName('');
            setPhone('');
            setSize(2);
            loadWaitlist();
        }
    };

    const handleStatus = async (id: string, status: 'cancelled' | 'offered') => {
        const { error } = await updateWaitlistStatusOwner(id, status);
        if (error) {
            toast.error(error);
        } else {
            if (status === 'offered') toast.success(getT('notifiedGuest', 'Guest marked as notified'));
            loadWaitlist();
        }
    };

    if (loading && entries.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-hsl(220_15%_45%)" style={{ color: 'hsl(220 15% 45%)' }}/>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-hsl(231_38%_6%) border-l border-hsl(231_24%_16%) w-80 shrink-0"
             style={{ background: 'hsl(231 38% 6%)', borderColor: 'hsl(231 24% 16%)' }}>
            
            {/* Header */}
            <div className="p-4 border-b border-hsl(231_24%_16%) flex items-center justify-between"
                 style={{ borderColor: 'hsl(231 24% 16%)' }}>
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-hsl(38_80%_60%)" style={{ color: 'hsl(38 80% 60%)' }} />
                    <h2 className="font-bold text-white text-sm">
                        {getT('title', 'Waitlist')} 
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ background: 'hsl(231 24% 20%)' }}>
                            {entries.length}
                        </span>
                    </h2>
                </div>
                {!adding && (
                    <button onClick={() => setAdding(true)} 
                            className="p-1.5 rounded-md hover:bg-hsl(231_24%_16%) text-white transition-colors"
                            style={{ background: 'hsl(231 24% 16%)' }}>
                        <Plus className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Add Form */}
            {adding && (
                <div className="p-4 border-b border-hsl(231_24%_16%) bg-hsl(231_32%_10%)"
                     style={{ borderColor: 'hsl(231 24% 16%)', background: 'hsl(231 32% 10%)' }}>
                    <form onSubmit={handleAdd} className="space-y-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-white">{getT('newGuest', 'New Waitlist Guest')}</span>
                            <button type="button" onClick={() => setAdding(false)} className="text-hsl(220_15%_55%) hover:text-white" style={{ color: 'hsl(220 15% 55%)' }}>
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        
                        <div>
                            <input 
                                autoFocus
                                className="w-full bg-hsl(231_24%_15%) border border-hsl(231_24%_25%) rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-hsl(347_78%_60%)"
                                style={{ background: 'hsl(231 24% 15%)', borderColor: 'hsl(231 24% 25%)' }}
                                placeholder={getT('guestName', 'Guest Name')}
                                value={name} onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-hsl(231_24%_15%) border border-hsl(231_24%_25%) rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-hsl(347_78%_60%)"
                                style={{ background: 'hsl(231 24% 15%)', borderColor: 'hsl(231 24% 25%)' }}
                                placeholder={getT('phone', 'Phone (Optional)')}
                                value={phone} onChange={e => setPhone(e.target.value)}
                            />
                            <input 
                                type="number" min="1" max="20"
                                className="w-16 bg-hsl(231_24%_15%) border border-hsl(231_24%_25%) rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-hsl(347_78%_60%) text-center"
                                style={{ background: 'hsl(231 24% 15%)', borderColor: 'hsl(231 24% 25%)' }}
                                value={size} onChange={e => setSize(Number(e.target.value))}
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full py-1.5 rounded-md text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                            style={{ background: 'hsl(347 78% 55%)' }}
                        >
                            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            {getT('addToWaitlist', 'Add to Waitlist')}
                        </button>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {entries.length === 0 && !loading && !adding && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-50">
                        <Users className="h-8 w-8 text-white" />
                        <p className="text-sm text-white">{getT('empty', 'Waitlist is clear')}</p>
                    </div>
                )}

                {entries.map((entry, idx) => {
                    const waitMins = differenceInMinutes(new Date(), new Date(entry.created_at));
                    const isLongWait = waitMins > 30;

                    return (
                        <div key={entry.id} className="bg-hsl(231_32%_13%) border border-hsl(231_24%_20%) rounded-lg p-3 hover:border-hsl(231_24%_30%) transition-colors"
                             style={{ background: 'hsl(231 32% 13%)', borderColor: 'hsl(231 24% 20%)' }}>
                            
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <span className="text-xs text-hsl(220_15%_50%) font-mono" style={{ color: 'hsl(220 15% 50%)' }}>#{idx + 1}</span>
                                        {entry.guest_name}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] uppercase font-semibold" style={{ color: 'hsl(220 15% 55%)' }}>
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" /> {entry.party_size}
                                        </span>
                                        {entry.guest_phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> {entry.guest_phone}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={`flex flex-col items-end text-xs font-bold ${isLongWait ? 'text-hsl(38_80%_55%)' : 'text-white'}`}
                                     style={isLongWait ? { color: 'hsl(38 80% 55%)' } : {}}>
                                    <div className="flex items-center gap-1">
                                        <Timer className="h-3.5 w-3.5" />
                                        {waitMins}m
                                    </div>
                                    <span className="text-[9px] font-normal" style={{ color: 'hsl(220 15% 45%)' }}>
                                        {format(new Date(entry.created_at), 'h:mm a')}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-3 text-xs">
                                <button 
                                    onClick={() => onSeatGuest(entry)}
                                    className="flex-1 py-1.5 rounded bg-hsl(160_60%_45%_/_0.15) text-hsl(160_60%_60%) hover:bg-hsl(160_60%_45%_/_0.25) transition-colors font-semibold flex items-center justify-center gap-1"
                                    style={{ background: 'hsl(160 60% 45% / 0.15)', color: 'hsl(160 60% 60%)' }}
                                >
                                    <Check className="h-3 w-3" /> {getT('seat', 'Seat')}
                                </button>
                                
                                {entry.status === 'offered' ? (
                                    <div className="flex-1 py-1.5 text-center rounded border border-hsl(231_24%_25%) text-hsl(220_15%_45%)"
                                         style={{ borderColor: 'hsl(231 24% 25%)', color: 'hsl(220 15% 50%)' }}>
                                        {getT('notified', 'Notified')}
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleStatus(entry.id, 'offered')}
                                        className="flex-1 py-1.5 rounded bg-hsl(231_24%_18%) text-white hover:bg-hsl(231_24%_25%) transition-colors font-semibold flex items-center justify-center gap-1"
                                        style={{ background: 'hsl(231 24% 18%)' }}
                                    >
                                        <Send className="h-3 w-3" /> {getT('notify', 'Notify')}
                                    </button>
                                )}

                                <button 
                                    onClick={() => handleStatus(entry.id, 'cancelled')}
                                    className="p-1.5 rounded bg-transparent hover:bg-hsl(347_78%_55%_/_0.15) text-hsl(220_15%_45%) hover:text-hsl(347_78%_60%) transition-colors"
                                    style={{ color: 'hsl(220 15% 45%)' }}
                                    title={getT('cancel', 'Cancel')}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}
