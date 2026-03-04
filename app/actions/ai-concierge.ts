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
        let { data, error } = await query.limit(3);

        if (error) {
            console.error('Concierge DB Error:', error);
            return { message: locale === 'ka' ? "ამჟამად მონაცემთა ბაზასთან დაკავშირება ვერ მოხერხდა. სცადეთ მოგვიანებით." : "I'm having trouble accessing my culinary database right now. Please try again later." };
        }

        // --- NEW FALLBACK LOGIC ---
        // If the query returned nothing (e.g. they typed gibberish or a very rare word),
        // we just fetch the top 3 highest rated restaurants so the AI never "fails" to give a recommendation.
        let responseMsg = locale === 'ka' ? "აი მოძებნილი შესანიშნავი ვარიანტები:" : "Here are some fantastic options I found for you:";

        if (!data || data.length === 0) {
            const fallbackQuery = await supabase.from('restaurants').select('*').limit(3);
            data = fallbackQuery.data || [];
            responseMsg = locale === 'ka'
                ? "ზუსტი დამთხვევა ვერ ვიპოვე, მაგრამ აი ჩვენი საუკეთესო რეკომენდაციები ამაღამ:"
                : "I couldn't find an exact match for that, but here are our top recommendations for tonight:";
        }

        if (matchedTags.includes('romantic')) {
            responseMsg = locale === 'ka' ? "ეს ადგილები იდეალურია რომანტიკული საღამოსთვის. გირჩევთ მალე დაჯავშნოთ." : "These spots are perfect for a romantic evening. I highly recommend securing a table soon.";
        } else if (matchedTags.includes('wine')) {
            responseMsg = locale === 'ka' ? "შესანიშნავი არჩევანია. ამ რესტორნებს აქვთ გამორჩეული ღვინის სია და საუკეთესო ატმოსფერო." : "Excellent choice. These restaurants feature exceptional wine lists and a great atmosphere.";
        } else if (matchedTags.includes('georgian')) {
            responseMsg = locale === 'ka' ? "ნამდვილ ქართულ სამზარეულოს არაფერი სჯობს. აი საუკეთესო ლოკალური რესტორნები:" : "You can't go wrong with authentic Georgian cuisine. Here are the top-rated local favorites:";
        } else if (matchedTags.includes('sushi')) {
            responseMsg = locale === 'ka' ? "საუკეთესო სუში და აზიური გემოები ქალაქში:" : "The best sushi and Asian flavors in town. Check these out:";
        } else if (matchedTags.includes('steak')) {
            responseMsg = locale === 'ka' ? "თუ ხორცი გიყვართ, ეს რესტორნები ნამდვილად მოგეწონებათ:" : "If you love a good steak or grill, these are incredibly highly rated:";
        } else if (matchedTags.includes('family')) {
            responseMsg = locale === 'ka' ? "შესანიშნავი ადგილები ოჯახისა და ბავშვებისთვის, სადაც ყველა კომფორტულად იგრძნობს თავს:" : "Great family-friendly spots where you can enjoy a meal with the kids and a larger group:";
        } else if (matchedTags.includes('breakfast')) {
            responseMsg = locale === 'ka' ? "საუკეთესო საუზმე და ყავა დილის დასაწყებად:" : "The perfect places for a great breakfast, brunch, or morning coffee:";
        } else if (matchedTags.includes('fineDining')) {
            responseMsg = locale === 'ka' ? "პრემიუმ კლასის რესტორნები, დაუვიწყარი გამოცდილებისთვის:" : "Premium, upscale dining experiences for when you want the absolute best:";
        } else if (matchedTags.includes('view')) {
            responseMsg = locale === 'ka' ? "რესტორნები საუკეთესო ხედით ქალაქზე:" : "Restaurants with absolutely stunning views and great patios:";
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
