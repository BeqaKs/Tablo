import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Using anon key for now, might need service role for some things but anon should be enough for SELECT/INSERT if RLS is off or permissive

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndSeed() {
    console.log('Checking database state...');

    // 1. Check for users
    const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);
    if (userError) {
        console.error('Error fetching users:', userError);
        // If it's a permissions error, we might need to use the service role key or wait for the user to sign up
    }

    if (!users || users.length === 0) {
        console.log('No users found in public.users. Please sign up in the app first.');
        // We can't easily seed a user because it depends on auth.users
        return;
    }

    const ownerId = users[0].id;
    console.log('Using owner ID:', ownerId);

    // 2. Check for restaurants
    const { data: restaurants } = await supabase.from('restaurants').select('id, slug');

    let restaurantId;
    if (!restaurants || restaurants.length === 0) {
        console.log('No restaurants found. Seeding Shavi Lomi...');
        const { data: newRestaurant, error: restError } = await supabase.from('restaurants').insert({
            owner_id: ownerId,
            name: 'Shavi Lomi',
            slug: 'shavi-lomi',
            description: 'Modern Georgian cuisine in an intimate setting.',
            address: '123 Rustaveli Avenue, Tbilisi',
            city: 'Tbilisi',
            cuisine_type: 'Georgian Fine Dining',
            price_range: '$$$',
            is_open: true
        }).select().single();

        if (restError) {
            console.error('Error seeding restaurant:', restError);
            return;
        }
        restaurantId = newRestaurant.id;
        console.log('Seeded Shavi Lomi:', restaurantId);
    } else {
        restaurantId = restaurants[0].id;
        console.log('Existing restaurant found:', restaurants[0].slug);
    }

    // 3. Check for tables
    const { data: tables } = await supabase.from('tables').select('id').eq('restaurant_id', restaurantId);
    if (!tables || tables.length === 0) {
        console.log('No tables found for this restaurant. Seeding tables...');
        const { error: tablesError } = await supabase.from('tables').insert([
            { restaurant_id: restaurantId, table_number: '1', capacity: 2, shape: 'square', x_coord: 100, y_coord: 100 },
            { restaurant_id: restaurantId, table_number: '2', capacity: 2, shape: 'square', x_coord: 200, y_coord: 100 },
            { restaurant_id: restaurantId, table_number: '3', capacity: 4, shape: 'rectangle', x_coord: 350, y_coord: 100 },
            { restaurant_id: restaurantId, table_number: '4', capacity: 4, shape: 'rectangle', x_coord: 100, y_coord: 250 },
            { restaurant_id: restaurantId, table_number: '5', capacity: 6, shape: 'round', x_coord: 300, y_coord: 250 }
        ]);

        if (tablesError) {
            console.error('Error seeding tables:', tablesError);
        } else {
            console.log('Seeded 5 tables successfully.');
        }
    } else {
        console.log('Tables already exist:', tables.length);
    }

    console.log('Database check/seed complete.');
}

checkAndSeed();
