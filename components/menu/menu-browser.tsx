'use client'

import { useState } from 'react'
import { MenuCategory, MenuItem } from '@/types/database'
import { ShoppingCart, Plus, Minus, Info, Leaf, Flame, Wheat } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CartItem } from '@/app/actions/orders'

const DIETARY_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    vegan: { icon: <Leaf className="h-3 w-3" />, label: 'Vegan', color: 'text-green-600 bg-green-50' },
    vegetarian: { icon: <Leaf className="h-3 w-3" />, label: 'Vegetarian', color: 'text-green-500 bg-green-50' },
    spicy: { icon: <Flame className="h-3 w-3" />, label: 'Spicy', color: 'text-orange-500 bg-orange-50' },
    'gluten-free': { icon: <Wheat className="h-3 w-3" />, label: 'GF', color: 'text-amber-600 bg-amber-50' },
}

interface MenuBrowserProps {
    categories: MenuCategory[]
    cart: CartItem[]
    onCartChange: (cart: CartItem[]) => void
}

export function MenuBrowser({ categories, cart, onCartChange }: MenuBrowserProps) {
    const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id ?? '')

    const getQty = (itemId: string) =>
        cart.find(c => c.menu_item_id === itemId)?.quantity ?? 0

    const addItem = (item: MenuItem) => {
        const existing = cart.find(c => c.menu_item_id === item.id)
        if (existing) {
            onCartChange(cart.map(c =>
                c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c
            ))
        } else {
            onCartChange([...cart, {
                menu_item_id: item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
            }])
        }
    }

    const removeItem = (itemId: string) => {
        const existing = cart.find(c => c.menu_item_id === itemId)
        if (!existing) return
        if (existing.quantity <= 1) {
            onCartChange(cart.filter(c => c.menu_item_id !== itemId))
        } else {
            onCartChange(cart.map(c =>
                c.menu_item_id === itemId ? { ...c, quantity: c.quantity - 1 } : c
            ))
        }
    }

    const totalItems = cart.reduce((s, c) => s + c.quantity, 0)

    if (!categories.length) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No menu available yet.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap smooth-transition border ${activeCategory === cat.id
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-muted-foreground border-gray-200 hover:border-primary/50'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Items for active category */}
            {categories
                .filter(cat => cat.id === activeCategory)
                .map(cat => (
                    <div key={cat.id} className="space-y-3">
                        {(cat.menu_items ?? []).map((item: MenuItem) => {
                            const qty = getQty(item.id)
                            return (
                                <div
                                    key={item.id}
                                    className={`flex gap-3 p-3 rounded-xl border smooth-transition ${qty > 0 ? 'border-primary/30 bg-primary/5' : 'border-gray-100 bg-white'
                                        }`}
                                >
                                    {/* Image */}
                                    {item.image_url && (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                                        />
                                    )}

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold text-sm leading-tight">{item.name}</p>
                                            <p className="font-bold text-primary text-sm shrink-0">
                                                ${item.price.toFixed(2)}
                                            </p>
                                        </div>
                                        {item.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                {item.description}
                                            </p>
                                        )}
                                        {/* Dietary tags */}
                                        {(item.dietary_tags?.length ?? 0) > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {item.dietary_tags?.map(tag => {
                                                    const info = DIETARY_ICONS[tag]
                                                    return info ? (
                                                        <span
                                                            key={tag}
                                                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${info.color}`}
                                                        >
                                                            {info.icon} {info.label}
                                                        </span>
                                                    ) : (
                                                        <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                                                            {tag}
                                                        </Badge>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Qty control */}
                                    <div className="flex items-center gap-1 shrink-0 self-center">
                                        {qty > 0 ? (
                                            <>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 smooth-transition"
                                                >
                                                    <Minus className="h-3.5 w-3.5" />
                                                </button>
                                                <span className="w-5 text-center text-sm font-bold">{qty}</span>
                                            </>
                                        ) : null}
                                        <button
                                            onClick={() => addItem(item)}
                                            className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 smooth-transition"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ))}

            {/* Cart summary strip */}
            {totalItems > 0 && (
                <div className="sticky bottom-0 bg-white border-t pt-3 mt-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {totalItems} item{totalItems !== 1 ? 's' : ''} in order
                        </span>
                        <span className="font-bold text-primary">
                            ${cart.reduce((s, c) => s + c.price * c.quantity, 0).toFixed(2)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
