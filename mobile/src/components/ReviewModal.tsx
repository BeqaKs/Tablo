import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Image } from 'react-native';
import { X, Star, ImagePlus, Trash2 } from 'lucide-react-native';
import { Colors as ThemeColors, Shadows as ThemeShadows } from '../../src/constants/Colors';
const Colors = ThemeColors.light;
const Shadows = ThemeShadows;
import { supabase } from '../services/supabase';
import { t } from '../localization/i18n';
import * as ImagePicker from 'expo-image-picker';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    restaurantId: string;
    onSuccess: () => void;
}

export function ReviewModal({ visible, onClose, restaurantId, onSuccess }: ReviewModalProps) {
    const [name, setName] = useState('');
    const [rating, setRating] = useState(5);
    const [text, setText] = useState('');
    const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
            selectionLimit: 4 - images.length,
            allowsMultipleSelection: true,
        });

        if (!result.canceled) {
            setImages(prev => [...prev, ...result.assets].slice(0, 4));
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const submitReview = async () => {
        if (!name.trim()) return;
        setSubmitting(true);

        try {
            const uploadedUrls: string[] = [];

            for (const asset of images) {
                const uri = asset.uri;
                const fileExt = uri.split('.').pop() || 'jpg';
                const fileName = `${restaurantId}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

                const response = await fetch(uri);
                const blob = await response.blob();
                const arraybuffer = await new Response(blob).arrayBuffer();

                const { data, error } = await supabase.storage
                    .from('reviews_images')
                    .upload(fileName, arraybuffer, { contentType: asset.mimeType || 'image/jpeg' });

                if (data) {
                    const { data: { publicUrl } } = supabase.storage.from('reviews_images').getPublicUrl(fileName);
                    uploadedUrls.push(publicUrl);
                } else if (error) {
                    console.warn('Image upload error:', error);
                }
            }

            const { error } = await supabase.from('reviews').insert({
                restaurant_id: restaurantId,
                guest_name: name,
                rating,
                review_text: text,
                images: uploadedUrls,
            });

            if (error) throw error;

            onSuccess();
            onClose();
            setName('');
            setText('');
            setRating(5);
            setImages([]);
        } catch (error) {
            console.error('Error submitting review', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('bookings.reviews.writeReview') || 'Write a Review'}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={20} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>{t('bookings.guestDetails.name') || 'Guest Name'}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('bookings.guestDetails.namePlaceholder') || "What's your name?"}
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor={Colors.textMuted}
                    />

                    <Text style={styles.label}>Rating</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <TouchableOpacity key={i} onPress={() => setRating(i)}>
                                <Star size={32} color={i <= rating ? '#FBBF24' : '#E5E7EB'} fill={i <= rating ? '#FBBF24' : 'transparent'} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Review Comments</Text>
                    <TextInput
                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                        placeholder="Share your experience (optional)"
                        value={text}
                        onChangeText={setText}
                        multiline
                        placeholderTextColor={Colors.textMuted}
                    />

                    <Text style={styles.label}>Photos (Max 4)</Text>
                    <View style={styles.imagesRow}>
                        {images.map((img, idx) => (
                            <View key={idx} style={styles.imagePreviewContainer}>
                                <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                                <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                                    <Trash2 size={16} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {images.length < 4 && (
                            <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                                <ImagePlus size={24} color={Colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, (!name.trim() || submitting) && styles.submitButtonDisabled]}
                        onPress={submitReview}
                        disabled={!name.trim() || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Review</Text>
                        )}
                    </TouchableOpacity>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
        marginTop: 20,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: Colors.text,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 8,
    },
    imagesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8,
    },
    addImageBtn: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
    },
    imagePreviewContainer: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        ...Shadows.sm,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
});
