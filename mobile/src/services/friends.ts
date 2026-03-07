import { supabase } from './supabase';
import { Tables } from '../types/database';

export type Friend = Tables<'friends'>;
export type Profile = Tables<'users'>; // or profiles depending on DB

export const friendsService = {
    /**
     * Send a friend request
     */
    async sendRequest(userId: string, friendId: string) {
        if (userId === friendId) throw new Error("Cannot add yourself");

        // Check if a request already exists
        const { data: existing } = await supabase
            .from('friends')
            .select('*')
            .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
            .single();

        if (existing) {
            throw new Error("Request already exists or you are already friends");
        }

        const { data, error } = await supabase
            .from('friends')
            .insert({
                user_id: userId,
                friend_id: friendId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Accept a friend request
     */
    async acceptRequest(requestId: string) {
        const { data, error } = await supabase
            .from('friends')
            .update({ status: 'accepted' })
            .eq('id', requestId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Reject or remove a friend
     */
    async removeFriend(requestId: string) {
        const { error } = await supabase
            .from('friends')
            .delete()
            .eq('id', requestId);

        if (error) throw error;
        return true;
    },

    /**
     * List all friends (accepted)
     */
    async getFriends(userId: string) {
        // We want records where we are user_id or friend_id AND status == 'accepted'
        // Also we want to fetch the other user's profile info.
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

        if (error) throw error;

        // Fetch profile details for the "other" person in each relationship
        if (data && data.length > 0) {
            const friendIds = data.map(f => f.user_id === userId ? f.friend_id : f.user_id);
            const { data: profiles } = await supabase
                .from('users') // Note: assuming we use 'users' based on schema we saw earlier
                .select('id, full_name, avatar_url')
                .in('id', friendIds);

            return data.map(f => {
                const otherId = f.user_id === userId ? f.friend_id : f.user_id;
                const profile = profiles?.find(p => p.id === otherId);
                return {
                    ...f,
                    profile
                };
            });
        }

        return [];
    },

    /**
     * List pending friend requests we received
     */
    async getPendingRequests(userId: string) {
        const { data, error } = await supabase
            .from('friends')
            .select('*')
            .eq('friend_id', userId)
            .eq('status', 'pending');

        if (error) throw error;

        // Fetch profile details for request senders
        if (data && data.length > 0) {
            const senderIds = data.map(f => f.user_id);
            const { data: profiles } = await supabase
                .from('users')
                .select('id, full_name, avatar_url')
                .in('id', senderIds);

            return data.map(f => ({
                ...f,
                profile: profiles?.find(p => p.id === f.user_id)
            }));
        }

        return [];
    },

    /**
     * Search for users to add
     */
    async searchUsers(query: string, currentUserId: string) {
        if (!query || query.length < 3) return [];

        // Simple text search on full_name
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, avatar_url')
            .ilike('full_name', `%${query}%`)
            .neq('id', currentUserId)
            .limit(10);

        if (error) {
            console.error("Error searching users:", error);
            return [];
        }
        return data || [];
    }
};
