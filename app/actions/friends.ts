'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getFriends() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const userId = session.user.id;

    const { data, error } = await supabase
        .from('friends')
        .select(`
      id,
      user_id,
      friend_id,
      status,
      created_at
    `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error || !data) return [];

    // Fetch profiles
    const friendIds = data.map((f: any) => f.user_id === userId ? f.friend_id : f.user_id);
    if (friendIds.length === 0) return [];

    const { data: profiles } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', friendIds);

    return data.map(f => {
        const otherId = f.user_id === userId ? f.friend_id : f.user_id;
        return {
            ...f,
            profile: profiles?.find(p => p.id === otherId)
        };
    });
}

export async function getPendingRequests() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const userId = session.user.id;

    const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', userId)
        .eq('status', 'pending');

    if (error || !data || data.length === 0) return [];

    const senderIds = data.map((f: any) => f.user_id);
    const { data: profiles } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', senderIds);

    return data.map(f => ({
        ...f,
        profile: profiles?.find(p => p.id === f.user_id)
    }));
}

export async function sendFriendRequest(friendId: string) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const userId = session.user.id;
    if (userId === friendId) throw new Error('Cannot add yourself');

    const { data: existing } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .single();

    if (existing) throw new Error('Request exists or already friends');

    const { error } = await supabase
        .from('friends')
        .insert({
            user_id: userId,
            friend_id: friendId,
            status: 'pending'
        });

    if (error) throw error;

    revalidatePath('/profile/friends');
    return { success: true };
}

export async function acceptFriendRequest(requestId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

    if (error) throw error;

    revalidatePath('/profile/friends');
    return { success: true };
}

export async function removeFriend(requestId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);

    if (error) throw error;

    revalidatePath('/profile/friends');
    return { success: true };
}

export async function searchUsers(query: string) {
    if (!query || query.length < 3) return [];

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${query}%`)
        .neq('id', session.user.id)
        .limit(10);

    if (error) return [];
    return data;
}
