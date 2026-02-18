'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { updateProfile } from '@/app/actions/profile';
import { toast } from 'sonner';
import { User, Phone, Mail, Save, X } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';

interface ProfileFormProps {
    profile: {
        id: string;
        email: string;
        full_name?: string;
        phone?: string;
        dietary_restrictions?: string[];
        preferred_cuisines?: string[];
        email_notifications?: boolean;
        sms_notifications?: boolean;
    };
}

const dietaryKeys = [
    'vegetarian',
    'vegan',
    'glutenFree',
    'dairyFree',
    'nutAllergy',
    'shellfishAllergy',
    'halal',
    'kosher',
];

const cuisineKeys = [
    'georgian',
    'italian',
    'japanese',
    'french',
    'mediterranean',
    'asianFusion',
    'steakhouse',
    'seafood',
];

export function ProfileForm({ profile }: ProfileFormProps) {
    const { t } = useLocale();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        dietary_restrictions: profile.dietary_restrictions || [],
        preferred_cuisines: profile.preferred_cuisines || [],
        email_notifications: profile.email_notifications ?? true,
        sms_notifications: profile.sms_notifications ?? false,
    });

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateProfile(profile.id, formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(t('common.success'));
            setIsEditing(false);
        }
        setIsSaving(false);
    };

    const toggleDietaryRestriction = (restriction: string) => {
        setFormData((prev) => ({
            ...prev,
            dietary_restrictions: prev.dietary_restrictions.includes(restriction)
                ? prev.dietary_restrictions.filter((r) => r !== restriction)
                : [...prev.dietary_restrictions, restriction],
        }));
    };

    const toggleCuisine = (cuisine: string) => {
        setFormData((prev) => ({
            ...prev,
            preferred_cuisines: prev.preferred_cuisines.includes(cuisine)
                ? prev.preferred_cuisines.filter((c) => c !== cuisine)
                : [...prev.preferred_cuisines, cuisine],
        }));
    };

    return (
        <div className="space-y-6">
            {/* Personal Information */}
            <Card className="premium-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">{t('profile.personalInfo')}</h2>
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} variant="outline">
                            {t('profile.editProfile')}
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        full_name: profile.full_name || '',
                                        phone: profile.phone || '',
                                        dietary_restrictions: profile.dietary_restrictions || [],
                                        preferred_cuisines: profile.preferred_cuisines || [],
                                        email_notifications: profile.email_notifications ?? true,
                                        sms_notifications: profile.sms_notifications ?? false,
                                    });
                                }}
                                variant="outline"
                                size="sm"
                            >
                                <X className="h-4 w-4 mr-2" />
                                {t('profile.cancel')}
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                size="sm"
                                className="bg-primary hover:bg-tablo-red-600"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? t('profile.saving') : t('profile.saveChanges')}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label htmlFor="full_name" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {t('profile.fullName')}
                        </Label>
                        <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            disabled={!isEditing}
                            placeholder={t('auth.fullName')}
                        />
                    </div>

                    {/* Email (Read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {t('profile.email')}
                        </Label>
                        <Input
                            id="email"
                            value={profile.email}
                            disabled
                            className="bg-gray-50"
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('profile.emailNote')}
                        </p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {t('profile.phone')}
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            disabled={!isEditing}
                            placeholder="+995 XX XXX XXX"
                        />
                    </div>
                </div>
            </Card>

            {/* Dietary Restrictions */}
            <Card className="premium-card p-6">
                <h2 className="text-2xl font-bold mb-4">{t('profile.dietaryRestrictions')}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    {t('profile.dietaryDesc')}
                </p>
                <div className="flex flex-wrap gap-2">
                    {dietaryKeys.map((key) => (
                        <Badge
                            key={key}
                            variant={formData.dietary_restrictions.includes(key) ? 'default' : 'outline'}
                            className={`cursor-pointer smooth-transition ${formData.dietary_restrictions.includes(key)
                                ? 'bg-primary hover:bg-tablo-red-600'
                                : 'hover:bg-gray-100'
                                } ${!isEditing && 'cursor-not-allowed opacity-60'}`}
                            onClick={() => isEditing && toggleDietaryRestriction(key)}
                        >
                            {t(`profile.dietary.${key}`)}
                        </Badge>
                    ))}
                </div>
            </Card>

            {/* Preferred Cuisines */}
            <Card className="premium-card p-6">
                <h2 className="text-2xl font-bold mb-4">{t('profile.preferredCuisines')}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    {t('profile.cuisinesDesc')}
                </p>
                <div className="flex flex-wrap gap-2">
                    {cuisineKeys.map((key) => (
                        <Badge
                            key={key}
                            variant={formData.preferred_cuisines.includes(key) ? 'default' : 'outline'}
                            className={`cursor-pointer smooth-transition ${formData.preferred_cuisines.includes(key)
                                ? 'bg-primary hover:bg-tablo-red-600'
                                : 'hover:bg-gray-100'
                                } ${!isEditing && 'cursor-not-allowed opacity-60'}`}
                            onClick={() => isEditing && toggleCuisine(key)}
                        >
                            {t(`profile.cuisines.${key}`)}
                        </Badge>
                    ))}
                </div>
            </Card>

            {/* Notification Preferences */}
            <Card className="premium-card p-6">
                <h2 className="text-2xl font-bold mb-4">{t('profile.notifications')}</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{t('profile.emailNotifications')}</p>
                            <p className="text-sm text-muted-foreground">
                                {t('profile.emailNotificationsDesc')}
                            </p>
                        </div>
                        <button
                            type="button"
                            disabled={!isEditing}
                            onClick={() =>
                                setFormData({ ...formData, email_notifications: !formData.email_notifications })
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full smooth-transition ${formData.email_notifications ? 'bg-primary' : 'bg-gray-200'
                                } ${!isEditing && 'cursor-not-allowed opacity-60'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white smooth-transition ${formData.email_notifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{t('profile.smsNotifications')}</p>
                            <p className="text-sm text-muted-foreground">
                                {t('profile.smsNotificationsDesc')}
                            </p>
                        </div>
                        <button
                            type="button"
                            disabled={!isEditing}
                            onClick={() =>
                                setFormData({ ...formData, sms_notifications: !formData.sms_notifications })
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full smooth-transition ${formData.sms_notifications ? 'bg-primary' : 'bg-gray-200'
                                } ${!isEditing && 'cursor-not-allowed opacity-60'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white smooth-transition ${formData.sms_notifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
