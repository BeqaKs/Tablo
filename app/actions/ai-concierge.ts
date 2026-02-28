'use server';

import { createClient } from '@/lib/supabase/server';
import { Restaurant } from '@/types/database';

export interface ConciergeResponse {
    message: string;
    restaurants?: Restaurant[];
}

export async function askConcierge(prompt: string, locale: string = 'en'): Promise<ConciergeResponse> {
    const supabase = await createClient();
    const lowerPrompt = prompt.toLowerCase();

    // Keyword extraction for our "smart search" - supports English and Georgian
    const keywords = {
        romantic: ['romantic', 'date', 'anniversary', 'couple', 'რომანტიკული', 'პაემანი', 'წყვილი'],
        steak: ['steak', 'meat', 'beef', 'steakhouse', 'სტეიკი', 'ხორცი'],
        sushi: ['sushi', 'japanese', 'roll', 'sashimi', 'asian', 'სუში', 'იაპონური', 'აზიური'],
        wine: ['wine', 'drinks', 'bar', 'cocktail', 'georgian wine', 'ღვინო', 'ბარი', 'სასმელი'],
        view: ['view', 'rooftop', 'scenic', 'patio', 'outside', 'ხედი', 'ტერასა', 'გარეთ'],
        georgian: ['georgian', 'khinkali', 'khachapuri', 'local', 'traditional', 'ქართული', 'ხინკალი', 'ხაჭაპური', 'ტრადიციული'],
        fineDining: ['fine dining', 'fancy', 'expensive', 'upscale', 'michelin', 'ძვირი', 'ლამაზი', 'ფაინ დაინინგი']
    };

    let matchedTags: string[] = [];

    // Find which tags match the user's prompt
    for (const [tag, words] of Object.entries(keywords)) {
        if (words.some(w => lowerPrompt.includes(w))) {
            matchedTags.push(tag);
        }
    }

    try {
        let query = supabase.from('restaurants').select('*');

        // If we recognized specific vibes/cuisines, filter by them
        if (matchedTags.length > 0) {
            // Or filter across cuisine, or name
            const orConditions = matchedTags.map(tag =>
                `cuisine_type.ilike.%${tag}%,name.ilike.%${tag}%`
            ).join(',');

            query = query.or(orConditions);
        } else {
            // Fallback: Just do a generic text search on the prompt words
            const words = lowerPrompt.split(' ').filter(w => w.length > 3);
            if (words.length > 0) {
                const fallbackOr = words.map(w => `description.ilike.%${w}%,cuisine_type.ilike.%${w}%`).join(',');
                query = query.or(fallbackOr);
            }
        }

        // Limit to top 3 recommendations
        const { data, error } = await query.limit(3);

        if (error) {
            console.error('Concierge DB Error:', error);
            return { message: locale === 'ka' ? "ამჟამად მონაცემთა ბაზასთან დაკავშირება ვერ მოხერხდა. სცადეთ მოგვიანებით." : "I'm having trouble accessing my culinary database right now. Please try again later." };
        }

        if (!data || data.length === 0) {
            return { message: locale === 'ka' ? "ზუსტი დამთხვევა ვერ ვიპოვე, მაგრამ შეგიძლიათ ნახოთ დაჯავშნადი ადგილები მთავარ გვერდზე!" : "I couldn't find an exact match for that, but you might want to explore our 'Tonight's Hitlist' on the homepage for some amazing available tables!" };
        }

        // Generate a contextual message based on the match
        let responseMsg = locale === 'ka' ? "აი მოძებნილი შესანიშნავი ვარიანტები:" : "Here are some fantastic options I found for you:";

        if (matchedTags.includes('romantic')) {
            responseMsg = locale === 'ka' ? "ეს ადგილები იდეალურია რომანტიკული საღამოსთვის. გირჩევთ მალე დაჯავშნოთ." : "These spots are perfect for a romantic evening. I highly recommend securing a table soon.";
        } else if (matchedTags.includes('wine')) {
            responseMsg = locale === 'ka' ? "შესანიშნავი არჩევანია. ამ რესტორნებს აქვთ გამორჩეული ღვინის სია და საუკეთესო ატმოსფერო." : "Excellent choice. These restaurants feature exceptional wine lists and a great atmosphere.";
        } else if (matchedTags.includes('georgian')) {
            responseMsg = locale === 'ka' ? "ნამდვილ ქართულ სამზარეულოს არაფერი სჯობს. აი საუკეთესო ლოკალური რესტორნები:" : "You can't go wrong with authentic Georgian cuisine. Here are the top-rated local favorites:";
        }

        return {
            message: responseMsg,
            restaurants: data
        };

    } catch (err) {
        console.error('Concierge Error:', err);
        return { message: locale === 'ka' ? "უკაცრავად, დაკავშირების პრობლემაა. სცადეთ მოგვიანებით." : "Apologies, my brain is a bit scrambled right now. Please try searching manually." };
    }
}
