'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Plus, Trash2, Pencil, ChevronDown, ChevronUp,
    Loader2, UtensilsCrossed, Check, X
} from 'lucide-react'
import {
    getOwnerMenu, createMenuCategory, updateMenuCategory, deleteMenuCategory,
    createMenuItem, updateMenuItem, deleteMenuItem
} from '@/app/actions/menu'
import { MenuCategory, MenuItem } from '@/types/database'
import { toast } from 'sonner'

const DIETARY_OPTIONS = ['vegan', 'vegetarian', 'gluten-free', 'spicy', 'halal', 'dairy-free']

export default function MenuPage() {
    const [categories, setCategories] = useState<MenuCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedCat, setExpandedCat] = useState<string | null>(null)
    const [showCatForm, setShowCatForm] = useState(false)
    const [newCatName, setNewCatName] = useState('')
    const [showItemForm, setShowItemForm] = useState<string | null>(null) // category id

    const [itemForm, setItemForm] = useState({
        name: '', description: '', price: '', image_url: '', dietary_tags: [] as string[],
    })

    useEffect(() => {
        getOwnerMenu().then(({ data }) => {
            setCategories(data as MenuCategory[])
            setLoading(false)
        })
    }, [])

    async function addCategory() {
        if (!newCatName.trim()) return
        const { data, error } = await createMenuCategory({ name: newCatName.trim() })
        if (error) { toast.error(error); return }
        setCategories(prev => [...prev, { ...(data as MenuCategory), menu_items: [] }])
        setNewCatName('')
        setShowCatForm(false)
        toast.success('Category created')
    }

    async function removeCategory(id: string) {
        if (!confirm('Delete this category and all its items?')) return
        const { error } = await deleteMenuCategory(id)
        if (error) { toast.error(error); return }
        setCategories(prev => prev.filter(c => c.id !== id))
        toast.success('Category deleted')
    }

    async function addItem(categoryId: string) {
        if (!itemForm.name.trim() || !itemForm.price) return
        const { data, error } = await createMenuItem({
            category_id: categoryId,
            name: itemForm.name.trim(),
            description: itemForm.description || undefined,
            price: parseFloat(itemForm.price),
            image_url: itemForm.image_url || undefined,
            dietary_tags: itemForm.dietary_tags,
        })
        if (error) { toast.error(error); return }
        setCategories(prev => prev.map(c =>
            c.id === categoryId
                ? { ...c, menu_items: [...(c.menu_items ?? []), data as MenuItem] }
                : c
        ))
        setItemForm({ name: '', description: '', price: '', image_url: '', dietary_tags: [] })
        setShowItemForm(null)
        toast.success('Item added')
    }

    async function removeItem(categoryId: string, itemId: string) {
        const { error } = await deleteMenuItem(itemId)
        if (error) { toast.error(error); return }
        setCategories(prev => prev.map(c =>
            c.id === categoryId
                ? { ...c, menu_items: (c.menu_items ?? []).filter(i => i.id !== itemId) }
                : c
        ))
        toast.success('Item removed')
    }

    async function toggleAvailability(categoryId: string, item: MenuItem) {
        const { error } = await updateMenuItem(item.id, { is_available: !item.is_available })
        if (error) { toast.error(error); return }
        setCategories(prev => prev.map(c =>
            c.id === categoryId
                ? { ...c, menu_items: (c.menu_items ?? []).map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i) }
                : c
        ))
    }

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UtensilsCrossed className="h-6 w-6 text-primary" />
                        Menu Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {categories.length} categories · {categories.reduce((s, c) => s + (c.menu_items?.length || 0), 0)} items
                    </p>
                </div>
                <Button onClick={() => setShowCatForm(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Category
                </Button>
            </div>

            {/* Add Category Form */}
            {showCatForm && (
                <Card className="p-4 border-primary/30 bg-primary/5">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            placeholder="Category name (e.g. Starters, Mains...)"
                            onKeyDown={e => e.key === 'Enter' && addCategory()}
                            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                        />
                        <Button onClick={addCategory} size="sm">Add</Button>
                        <Button variant="outline" size="sm" onClick={() => setShowCatForm(false)}>Cancel</Button>
                    </div>
                </Card>
            )}

            {/* Categories */}
            {categories.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground">
                    <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No menu categories yet. Add your first one above.</p>
                </Card>
            ) : (
                categories.map(cat => (
                    <Card key={cat.id} className="overflow-hidden">
                        {/* Category header */}
                        <div
                            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 smooth-transition"
                            onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                        >
                            <div className="flex items-center gap-3">
                                {expandedCat === cat.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                <span className="font-semibold">{cat.name}</span>
                                <Badge variant="secondary" className="text-xs">{cat.menu_items?.length ?? 0} items</Badge>
                            </div>
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setShowItemForm(cat.id); setExpandedCat(cat.id) }}
                                    className="gap-1 text-xs"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add Item
                                </Button>
                                <button
                                    onClick={() => removeCategory(cat.id)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg smooth-transition"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Items list */}
                        {expandedCat === cat.id && (
                            <div className="border-t">
                                {/* Add item form */}
                                {showItemForm === cat.id && (
                                    <div className="p-4 bg-gray-50 border-b space-y-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Item</p>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={itemForm.name}
                                                onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                                                placeholder="Item name *"
                                                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <input
                                                type="number"
                                                value={itemForm.price}
                                                onChange={e => setItemForm({ ...itemForm, price: e.target.value })}
                                                placeholder="Price ($) *"
                                                min="0"
                                                step="0.01"
                                                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <input
                                                type="text"
                                                value={itemForm.description}
                                                onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                                                placeholder="Description (optional)"
                                                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2"
                                            />
                                            <input
                                                type="url"
                                                value={itemForm.image_url}
                                                onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })}
                                                placeholder="Image URL (optional)"
                                                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2"
                                            />
                                        </div>
                                        {/* Dietary tags */}
                                        <div>
                                            <p className="text-xs font-medium mb-2">Dietary tags</p>
                                            <div className="flex flex-wrap gap-2">
                                                {DIETARY_OPTIONS.map(tag => {
                                                    const active = itemForm.dietary_tags.includes(tag)
                                                    return (
                                                        <button
                                                            key={tag}
                                                            onClick={() => setItemForm(prev => ({
                                                                ...prev,
                                                                dietary_tags: active
                                                                    ? prev.dietary_tags.filter(t => t !== tag)
                                                                    : [...prev.dietary_tags, tag]
                                                            }))}
                                                            className={`px-3 py-1 rounded-full text-xs border smooth-transition ${active ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:border-primary/50'}`}
                                                        >
                                                            {tag}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => addItem(cat.id)}>Save Item</Button>
                                            <Button size="sm" variant="outline" onClick={() => setShowItemForm(null)}>Cancel</Button>
                                        </div>
                                    </div>
                                )}

                                {/* Item rows */}
                                {(cat.menu_items ?? []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">No items in this category yet.</p>
                                ) : (
                                    (cat.menu_items ?? []).map((item: MenuItem) => (
                                        <div key={item.id} className="flex items-center justify-between px-5 py-3 border-b last:border-b-0 gap-3">
                                            {item.image_url && (
                                                <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{item.name}</p>
                                                {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                                                {(item.dietary_tags?.length ?? 0) > 0 && (
                                                    <div className="flex gap-1 mt-1 flex-wrap">
                                                        {item.dietary_tags?.map(t => (
                                                            <span key={t} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{t}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-bold text-primary text-sm shrink-0">${item.price.toFixed(2)}</span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {/* Available toggle */}
                                                <button
                                                    onClick={() => toggleAvailability(cat.id, item)}
                                                    title={item.is_available ? 'Mark unavailable' : 'Mark available'}
                                                    className={`p-1.5 rounded-lg smooth-transition ${item.is_available ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 bg-gray-100 hover:bg-gray-200'}`}
                                                >
                                                    {item.is_available ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => removeItem(cat.id, item.id)}
                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg smooth-transition"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </Card>
                ))
            )}
        </div>
    )
}
