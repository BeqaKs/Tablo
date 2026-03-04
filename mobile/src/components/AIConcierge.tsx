import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Image,
    ActivityIndicator,
    ScrollView,
    Dimensions
} from 'react-native';
import { MessageCircle, X, Send, Sparkles, ChefHat, MapPin, Star, ChevronRight } from 'lucide-react-native';
import { supabase } from '../services/supabase';
import { Restaurant } from '../types/database';
import i18n, { t } from '../localization/i18n';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

type Message = {
    id: string;
    role: 'user' | 'ai';
    content: string;
    restaurants?: Restaurant[];
};

export const AIConcierge = () => {
    const navigation = useNavigation<any>();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'ai', content: t('aiConcierge.greeting') }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const locale = i18n.locale || 'en';

    useEffect(() => {
        // Reset greeting when language changes
        setMessages([
            { id: '1', role: 'ai', content: t('aiConcierge.greeting') }
        ]);
    }, [locale]);

    const askConcierge = async (prompt: string, currentLocale: string): Promise<{ message: string; restaurants: Restaurant[] }> => {
        const lowerPrompt = prompt.toLowerCase();
        const keywords: Record<string, string[]> = {
            romantic: ['romantic', 'date', 'anniversary', 'couple', 'love', 'რომანტიკული', 'პაემანი', 'წყვილი', 'სიყვარული'],
            steak: ['steak', 'meat', 'beef', 'steakhouse', 'grill', 'bbq', 'სტეიკი', 'ხორცი', 'გრილი', 'მწვადი'],
            sushi: ['sushi', 'japanese', 'roll', 'sashimi', 'asian', 'fish', 'სუში', 'იაპონური', 'აზიური', 'თევზი'],
            wine: ['wine', 'drinks', 'bar', 'cocktail', 'georgian wine', 'alcohol', 'ღვინო', 'ბარი', 'სასმელი', 'კოქტეილი'],
            view: ['view', 'rooftop', 'scenic', 'patio', 'outside', 'terrace', 'ხედი', 'ტერასა', 'გარეთ', 'ვერანდა'],
            georgian: ['georgian', 'khinkali', 'khachapuri', 'local', 'traditional', 'national', 'ქართული', 'ხინკალი', 'ხაჭაპური', 'ტრადიციული'],
            fineDining: ['fine dining', 'fancy', 'expensive', 'upscale', 'michelin', 'luxury', 'premium', 'ძვირი', 'ლამაზი', 'ფაინ დაინინგი', 'პრემიუმ'],
            family: ['family', 'kids', 'children', 'loud', 'group', 'ოჯახი', 'ბავშვები', 'მეგობრები', 'ჯგუფი'],
            breakfast: ['breakfast', 'brunch', 'morning', 'coffee', 'cafe', 'საუზმე', 'ბრანჩი', 'დილა', 'ყავა', 'კაფე'],
            cheap: ['cheap', 'affordable', 'budget', 'street food', 'fast', 'იაფი', 'ბიუჯეტური', 'სწრაფი']
        };

        let matchedTags: string[] = [];
        for (const [tag, words] of Object.entries(keywords)) {
            if (words.some(w => lowerPrompt.includes(w))) {
                matchedTags.push(tag);
            }
        }

        try {
            let query = supabase.from('restaurants').select('*');

            if (matchedTags.length > 0) {
                const orConditions = matchedTags.map(tag =>
                    `cuisine_type.ilike.%${tag}%,name.ilike.%${tag}%`
                ).join(',');
                query = query.or(orConditions);
            } else {
                const words = lowerPrompt.split(' ').filter(w => w.length > 3);
                if (words.length > 0) {
                    const fallbackOr = words.map(w => `description.ilike.%${w}%,cuisine_type.ilike.%${w}%`).join(',');
                    query = query.or(fallbackOr);
                }
            }

            let { data, error } = await query.limit(3);
            if (error) throw error;

            let responseMsg = currentLocale === 'ka' ? "აი მოძებნილი შესანიშნავი ვარიანტები:" : "Here are some fantastic options I found for you:";

            if (!data || data.length === 0) {
                const fallbackQuery = await supabase.from('restaurants').select('*').limit(3);
                data = fallbackQuery.data || [];
                responseMsg = currentLocale === 'ka'
                    ? "ზუსტი დამთხვევა ვერ ვიპოვე, მაგრამ აი ჩვენი საუკეთესო რეკომენდაციები ამაღამ:"
                    : "I couldn't find an exact match for that, but here are our top recommendations for tonight:";
            }

            // Custom responses based on tags (same logic as web)
            if (matchedTags.includes('romantic')) {
                responseMsg = currentLocale === 'ka' ? "ეს ადგილები იდეალურია რომანტიკული საღამოსთვის. გირჩევთ მალე დაჯავშნოთ." : "These spots are perfect for a romantic evening. I highly recommend securing a table soon.";
            } else if (matchedTags.includes('wine')) {
                responseMsg = currentLocale === 'ka' ? "შესანიშნავი არჩევანია. ამ რესტორნებს აქვთ გამორჩეული ღვინის სია და საუკეთესო ატმოსფერო." : "Excellent choice. These restaurants feature exceptional wine lists and a great atmosphere.";
            }

            return { message: responseMsg, restaurants: data || [] };
        } catch (error) {
            console.error('Concierge Error:', error);
            return {
                message: currentLocale === 'ka' ? "უკაცრავად, დაკავშირების პრობლემაა." : "Apologies, I'm having trouble searching right now.",
                restaurants: []
            };
        }
    };

    const handleSubmit = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');

        const newMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: newMsgId, role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const response = await askConcierge(userMsg, locale);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: response.message,
                restaurants: response.restaurants
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 2).toString(),
                role: 'ai',
                content: t('aiConcierge.error')
            }]);
        } finally {
            setIsLoading(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[
            styles.messageContainer,
            item.role === 'user' ? styles.userMessage : styles.aiMessage
        ]}>
            <View style={[
                styles.bubble,
                item.role === 'user' ? styles.userBubble : styles.aiBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    item.role === 'user' ? styles.userText : styles.aiText
                ]}>{item.content}</Text>
            </View>

            {item.role === 'ai' && item.restaurants && item.restaurants.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.restaurantCarousel}
                >
                    {item.restaurants.map((r) => (
                        <TouchableOpacity
                            key={r.id}
                            style={styles.restaurantCardSmall}
                            onPress={() => {
                                setIsOpen(false);
                                navigation.navigate('restaurants/[slug]', { slug: r.slug, id: r.id });
                            }}
                        >
                            <Image
                                source={{ uri: r.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&fit=crop' }}
                                style={styles.cardImageSmall}
                            />
                            <View style={styles.cardInfoSmall}>
                                <Text style={styles.cardTitleSmall} numberOfLines={1}>{r.name}</Text>
                                <View style={styles.cardMetaSmall}>
                                    <Star size={10} color="#F59E0B" fill="#F59E0B" />
                                    <Text style={styles.cardRatingSmall}>{r.rating || '4.9'}</Text>
                                    <Text style={styles.cardCitySmall}>· {r.city}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    return (
        <>
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setIsOpen(true)}
                activeOpacity={0.8}
            >
                <View style={styles.fabInner}>
                    <Sparkles size={24} color="#FFF" />
                </View>
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setIsOpen(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.header}>
                        <View style={styles.headerInfo}>
                            <View style={styles.avatar}>
                                <ChefHat size={18} color="#FFF" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>{t('aiConcierge.title')}</Text>
                                <View style={styles.statusRow}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>{t('aiConcierge.online')}</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                            <X size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    />

                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                        </View>
                    )}

                    <View style={styles.inputArea}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={input}
                                onChangeText={setInput}
                                placeholder={t('aiConcierge.placeholder')}
                                placeholderTextColor="#9CA3AF"
                                onSubmitEditing={handleSubmit}
                                returnKeyType="send"
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={!input.trim() || isLoading}
                            >
                                <Send size={20} color={input.trim() ? "#FFF" : "#9CA3AF"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 1000,
    },
    fabInner: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#6B7280',
    },
    closeButton: {
        padding: 5,
    },
    messagesList: {
        padding: 20,
        paddingBottom: 30,
    },
    messageContainer: {
        marginBottom: 20,
        maxWidth: '85%',
    },
    userMessage: {
        alignSelf: 'flex-end',
    },
    aiMessage: {
        alignSelf: 'flex-start',
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    userBubble: {
        backgroundColor: '#000',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: '#FFF',
    },
    aiText: {
        color: '#1F2937',
    },
    loadingContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        alignItems: 'flex-start',
    },
    inputArea: {
        padding: 15,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 5,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 15,
        color: '#1F2937',
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: 'transparent',
    },
    restaurantCarousel: {
        marginTop: 12,
        paddingRight: 20,
        gap: 12,
    },
    restaurantCardSmall: {
        width: 220,
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardImageSmall: {
        width: '100%',
        height: 100,
    },
    cardInfoSmall: {
        padding: 12,
    },
    cardTitleSmall: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    cardMetaSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    cardRatingSmall: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F2937',
    },
    cardCitySmall: {
        fontSize: 12,
        color: '#6B7280',
    }
});
