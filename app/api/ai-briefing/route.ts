import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const generateSmartBriefing = (m: any, lang: string, date: string) => {
    const metrics = {
        expectedGuests: m?.expectedGuests || 0,
        peakHour: m?.peakHour || 'N/A',
        vips: m?.vips || 0,
        highRisk: m?.highRisk || 0
    };

    if (lang === 'ka') {
        return `**დღევანდელი შეჯამება (${date}):**
    
დღეს ველოდებით **${metrics.expectedGuests} სტუმარს**. პიკის საათი სავარაუდოდ იქნება **${metrics.peakHour}**.

${metrics.vips > 0 ? `🌟 გვყავს **${metrics.vips} VIP სტუმარი**, რომლებიც იმსახურებენ განსაკუთრებულ ყურადღებას.` : '🌟 დღეისთვის VIP სტუმრები არ არის დაფიქსირებული.'}
${metrics.highRisk > 0 ? `🚨 ყურადღება: გვყავს **${metrics.highRisk} მაღალი რისკის სტუმარი** (წინა გამოუცხადებლობის გამო).` : '✅ მაღალი რისკის სტუმრები დღეს არ გვყავს.'}

გისურვებთ წარმატებულ და დატვირთულ ცვლას!`;
    }

    return `**Daily Briefing (${date}):**

We are expecting **${metrics.expectedGuests} guests** today. Peak hour is anticipated around **${metrics.peakHour}**.

${metrics.vips > 0 ? `🌟 We have **${metrics.vips} VIP guests** arriving. Ensure they receive our signature premium service.` : '🌟 No VIP arrivals flagged for today yet.'}
${metrics.highRisk > 0 ? `🚨 Note: There are **${metrics.highRisk} high-risk guests** with past no-shows. Consider calling to confirm.` : '✅ All incoming guests have a clean attendance record.'}

Wishing the team a smooth and successful shift!`;
};

export async function POST(req: Request) {
    let requestData: any = {};
    const today = new Date().toISOString().split('T')[0];

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            requestData = await req.json();
        } catch (e) {
            console.error('[AI Briefing] Failed to parse JSON body');
        }

        const { date = today, metrics = {}, locale = 'en' } = requestData;

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ briefing: generateSmartBriefing(metrics, locale, date), source: 'template' });
        }

        try {
            const openai = new OpenAI({ apiKey });
            const prompt = `
You are the AI Restaurant Concierge for a premium restaurant management platform called Tablo. 
Your job is to provide a concise, insightful, and professional Daily Briefing for the restaurant manager.

Here is the data for today (${date}):
- Total Guests Expected: ${metrics.expectedGuests || 0}
- VIPs (5+ past visits): ${metrics.vips || 0}
- First-timers (0 past visits): ${metrics.firstTimers || 0}
- High-Risk (2+ past no-shows): ${metrics.highRisk || 0}
- Peak Hour: ${metrics.peakHour || 'N/A'}

Focus on actionable insights. 
- Acknowledge the overall volume.
- Specifically mention if there are VIPs to welcome or High-Risk guests to keep an eye on.
- Mention the peak hour so the kitchen/floor staff can prepare.
- Keep the tone professional, encouraging, and brief (3-4 short paragraphs maximum).
- Format the response in Markdown using bullet points or bold text where appropriate for readability.
- Do not greet with "Dear Manager" or similar letters, just jump straight into the briefing!
`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are an expert restaurant manager AI assistant." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            const briefing = completion.choices[0]?.message?.content || generateSmartBriefing(metrics, locale, date);
            return NextResponse.json({ briefing, source: 'openai' });

        } catch (openaiError: any) {
            console.warn('[AI Briefing] OpenAI failed, falling back to Smart Template:', openaiError.message);
            return NextResponse.json({ 
                briefing: generateSmartBriefing(metrics, locale, date), 
                source: 'template',
                fallback_reason: openaiError.message 
            });
        }
    } catch (error: any) {
        console.error('[AI Briefing] Global Exception:', error);
        // Even in case of a global crash, return the template instead of 500
        const fallbackDate = requestData?.date || today;
        const fallbackMetrics = requestData?.metrics || {};
        const fallbackLocale = requestData?.locale || 'en';
        
        return NextResponse.json({ 
            briefing: generateSmartBriefing(fallbackMetrics, fallbackLocale, fallbackDate), 
            source: 'emergency_template',
            error_logged: true
        });
    }
}
