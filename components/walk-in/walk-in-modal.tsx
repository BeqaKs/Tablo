'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, UserPlus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from '@/components/translations-provider'
import { toast } from 'sonner'

interface WalkInModalProps {
    restaurantId: string
    tables: Array<{ id: string; table_number: string; capacity: number; zone_name: string }>
    onSuccess?: () => void
    onClose: () => void
}

export function WalkInModal({ restaurantId, tables, onSuccess, onClose }: WalkInModalProps) {
    const { t } = useTranslations()
    const [guestName, setGuestName] = useState('')
    const [partySize, setPartySize] = useState(2)
    const [selectedTableId, setSelectedTableId] = useState<string>('')
    const [loading, setLoading] = useState(false)

    const eligibleTables = tables.filter(t => t.capacity >= partySize)

    const handleSubmit = async () => {
        if (!guestName.trim()) {
            toast.error(t.calendar?.guestNameRequired || 'Please enter a guest name')
            return
        }
        setLoading(true)
        try {
            const supabase = createClient()

            // Walk-ins: status = 'seated', no user_id, is_walk_in = true
            const now = new Date()
            const endTime = new Date(now.getTime() + 90 * 60000) // 90-min default turn

            const { error } = await supabase.from('reservations').insert({
                restaurant_id: restaurantId,
                user_id: null,
                table_id: selectedTableId || null,
                guest_count: partySize,
                reservation_time: now.toISOString(),
                end_time: endTime.toISOString(),
                status: 'seated',
                attendance_status: 'arrived',
                guest_name: guestName.trim(),
                is_walk_in: true,
            })

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success(t.walk_in?.success?.replace('{name}', guestName) || `Walk-in for ${guestName} added!`)
            onSuccess?.()
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">{t.walk_in?.title || 'Add Walk-In'}</h2>
                            <p className="text-xs text-muted-foreground">{t.walk_in?.subtitle || 'Fast check-in for arriving guests'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full smooth-transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Guest Name — large for tap-friendly use */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">{t.walk_in?.guestName || 'Guest Name *'}</label>
                        <input
                            type="text"
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                            placeholder={t.walk_in?.guestNamePlaceholder || 'Enter guest name'}
                            className="w-full px-4 py-4 text-lg border-2 rounded-xl focus:outline-none focus:border-primary smooth-transition"
                            autoFocus
                        />
                    </div>

                    {/* Party Size — large buttons */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">{t.walk_in?.partySize || 'Party Size'}</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
                                <button
                                    key={size}
                                    onClick={() => setPartySize(size)}
                                    className={`py-4 text-xl font-bold rounded-xl border-2 smooth-transition ${partySize === size
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-gray-200 hover:border-primary/50'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table (optional) */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            {t.walk_in?.table || 'Table'}{' '}
                            <span className="text-muted-foreground font-normal">({t.walk_in?.optional || 'optional'})</span>
                        </label>
                        {eligibleTables.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">
                                {t.walk_in?.noTables?.replace('{count}', partySize.toString()) || `No tables available for ${partySize} guests`}
                            </p>
                        ) : (
                            <select
                                value={selectedTableId}
                                onChange={e => setSelectedTableId(e.target.value)}
                                className="w-full px-4 py-4 text-base border-2 rounded-xl focus:outline-none focus:border-primary smooth-transition"
                            >
                                <option value="">— {t.walk_in?.seatAnywhere || 'Seat anywhere'} —</option>
                                {eligibleTables.map(ta => (
                                    <option key={ta.id} value={ta.id}>
                                        {t.calendar?.table || 'Table'} {ta.table_number} ({ta.zone_name}, {t.common?.upTo || 'up to'} {ta.capacity})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="flex gap-3 p-6 border-t">
                    <Button variant="outline" onClick={onClose} className="flex-1 py-6 text-base">
                        {t.walk_in?.cancel || 'Cancel'}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !guestName.trim()}
                        className="flex-1 py-6 text-base font-bold"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (t.walk_in?.seatGuest || 'Seat Guest →')}
                    </Button>
                </div>
            </div>
        </div>
    )
}
