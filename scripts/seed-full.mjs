import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly in node script
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndSeedFull() {
    console.log('--- Starting Comprehensive Tablo Seeding ---');

    // 0. Create Test Users via Auth API
    const testUsers = [
        { email: 'owner@tablo.com', password: 'password123', name: 'Restaurant Owner' },
        { email: 'admin@tablo.com', password: 'password123', name: 'Tablo Admin' },
        { email: 'customer@tablo.com', password: 'password123', name: 'Hungry Customer' }
    ];

    for (const u of testUsers) {
        // Try to create user
        const { data: auth, error: authErr } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { full_name: u.name }
        });

        let userId;

        if (authErr && authErr.message.includes('already registered')) {
            console.log(`User ${u.email} already exists. To test as a new user, you must use a different email or log in.`);
            // Since we can't search via admin API, we must assume they exist in public.users
        } else if (authErr) {
            console.error(`Error signing up user ${u.email}:`, authErr.message);
        } else if (auth.user) {
            userId = auth.user.id;
            console.log(`Signed up user: ${u.email}`);
        }

        if (userId) {
            // Upsert into public.users
            const role = u.email.includes('owner') ? 'restaurant_owner' : u.email.includes('admin') ? 'admin' : 'customer';
            const { error: profileErr } = await supabase.from('users').upsert({
                id: userId,
                email: u.email,
                full_name: u.name,
                role: role
            });
            if (profileErr) console.error(`Error upserting profile for ${u.email}:`, profileErr);
            else console.log(`Upserted public profile for ${u.email} as ${role}`);
        }
    }

    const { data: users, error: userError } = await supabase.from('users').select('*');
    if (userError) {
        console.error('Error fetching users:', userError.message);
        return;
    }

    if (!users || users.length === 0) {
        console.log('No users found even after auth creation attempt.');
        return;
    }

    // 1. Get Roles
    let adminId = users.find(u => u.role === 'admin')?.id;
    let ownerId = users.find(u => u.role === 'restaurant_owner')?.id;
    let customerId = users.find(u => u.role === 'customer')?.id;

    if (!ownerId) return;

    // 2. Seed Restaurants
    const restaurantsList = [
        {
            owner_id: ownerId,
            name: 'Shavi Lomi',
            slug: 'shavi-lomi',
            description: 'Modern Georgian cuisine in an intimate setting blending traditional flavors with contemporary techniques.',
            address: '28 Zurab Kvlividze St',
            city: 'Tbilisi',
            cuisine_type: 'Georgian',
            price_range: '$$$',
            is_open: true,
            images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800']
        },
        {
            owner_id: ownerId, // Same owner for testing multi-restaurant dashboard if applicable
            name: 'Cafe Littera',
            slug: 'cafe-littera',
            description: 'Fine dining located in the historic Writers House garden. A fusion of Georgian flavors.',
            address: '13 Ivane Machabeli St',
            city: 'Tbilisi',
            cuisine_type: 'Fine Dining',
            price_range: '$$$$',
            is_open: true,
            images: ['https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800']
        }
    ];

    for (const restData of restaurantsList) {
        // Check if exists
        const { data: existing } = await supabase.from('restaurants').select('id').eq('slug', restData.slug).maybeSingle();
        let restId;

        if (!existing) {
            const { data: newRest, error } = await supabase.from('restaurants').insert(restData).select().single();
            if (error) console.error(`Error creating ${restData.name}:`, error.message);
            else {
                restId = newRest.id;
                console.log(`Created restaurant: ${restData.name}`);
            }
        } else {
            // Update to be sure
            await supabase.from('restaurants').update(restData).eq('id', existing.id);
            restId = existing.id;
            console.log(`Updated restaurant: ${restData.name}`);
        }

        if (restId) {
            // 3. Seed Tables
            const { data: tables } = await supabase.from('tables').select('id').eq('restaurant_id', restId);
            if (!tables || tables.length === 0) {
                const tablesData = [
                    { restaurant_id: restId, table_number: '1', capacity: 2, shape: 'square', x_coord: 100, y_coord: 100 },
                    { restaurant_id: restId, table_number: '2', capacity: 2, shape: 'square', x_coord: 240, y_coord: 100 },
                    { restaurant_id: restId, table_number: '3', capacity: 4, shape: 'rectangle', x_coord: 380, y_coord: 100, width: 120, height: 60 },
                    { restaurant_id: restId, table_number: 'T1', capacity: 4, shape: 'rectangle', x_coord: 100, y_coord: 250, width: 120, height: 60 },
                    { restaurant_id: restId, table_number: 'T2', capacity: 6, shape: 'round', x_coord: 380, y_coord: 250 },
                    { restaurant_id: restId, table_number: 'VIP', capacity: 8, shape: 'rectangle', x_coord: 240, y_coord: 400, width: 160, height: 80 }
                ];
                await supabase.from('tables').insert(tablesData);
                console.log(`Seeded 6 tables for ${restData.name}`);
            }

            // 4. Seed Reservations for Shavi Lomi
            if (restData.slug === 'shavi-lomi') {
                const { data: activeTables } = await supabase.from('tables').select('id').eq('restaurant_id', restId);
                const { data: existingRes } = await supabase.from('reservations').select('id').eq('restaurant_id', restId).limit(1);

                if (activeTables && activeTables.length > 0 && (!existingRes || existingRes.length === 0)) {
                    const today = new Date();
                    today.setHours(19, 0, 0, 0); // 7 PM today

                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const reservationsData = [
                        {
                            restaurant_id: restId,
                            table_id: activeTables[0].id,
                            guest_name: 'Alexandre Dumas',
                            guest_count: 2,
                            guest_phone: '+995 555 123 456',
                            guest_notes: 'Anniversary dinner',
                            reservation_time: today.toISOString(),
                            end_time: new Date(today.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                            status: 'confirmed'
                        },
                        {
                            restaurant_id: restId,
                            table_id: activeTables[2].id,
                            guest_name: 'Nino Chabukiani',
                            guest_count: 4,
                            guest_phone: '+995 555 987 654',
                            guest_notes: 'Window seat preference',
                            reservation_time: new Date(today.getTime() + 1 * 60 * 60 * 1000).toISOString(), // 8 PM today
                            end_time: new Date(today.getTime() + 3 * 60 * 60 * 1000).toISOString(),
                            status: 'pending'
                        },
                        {
                            restaurant_id: restId,
                            table_id: activeTables[4].id,
                            guest_name: 'Giorgi Maisuradze',
                            guest_count: 5,
                            guest_phone: '+995 599 111 222',
                            reservation_time: tomorrow.toISOString(), // 7 PM tomorrow
                            end_time: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                            status: 'confirmed'
                        }
                    ];

                    const { error: resError } = await supabase.from('reservations').insert(reservationsData);
                    if (resError) console.error('Error seeding reservations:', resError.message);
                    else console.log(`Seeded 3 reservations for Shavi Lomi`);
                }
            }
        }
    }

    console.log('--- Seeding Complete ---');
}

checkAndSeedFull();
