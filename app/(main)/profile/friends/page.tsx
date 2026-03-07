'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Search, ChevronLeft, Loader2, UserMinus } from 'lucide-react';
import { getFriends, getPendingRequests, searchUsers, sendFriendRequest, acceptFriendRequest, removeFriend } from '@/app/actions/friends';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function FriendsPage() {
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'friends' | 'add'>('friends');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [f, r] = await Promise.all([getFriends(), getPendingRequests()]);
            setFriends(f);
            setRequests(r);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 3) {
                const results = await searchUsers(searchQuery);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleAccept = async (id: string) => {
        setActionLoading(id);
        await acceptFriendRequest(id);
        await loadData();
        setActionLoading(null);
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        await removeFriend(id);
        await loadData();
        setActionLoading(null);
    };

    const handleSendRequest = async (userId: string) => {
        setActionLoading(userId);
        try {
            await sendFriendRequest(userId);
            setSearchQuery('');
            setSearchResults([]);
            // Could add toast here
        } catch (e: any) {
            alert(e.message);
        }
        setActionLoading(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="bg-white border-b sticky top-16 z-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6">
                    <Link href="/profile" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Profile
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Friends</h1>
                            <p className="text-muted-foreground mt-1">Connect with foodies and share your dining experiences.</p>
                        </div>
                    </div>

                    <div className="flex space-x-6 mt-8">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'friends' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-gray-900'}`}
                        >
                            My Friends <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{friends.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('add')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'add' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-gray-900'}`}
                        >
                            Add Friends {requests.length > 0 && <span className="ml-1 bg-primary text-white py-0.5 px-2 rounded-full text-xs">{requests.length}</span>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-8">
                {activeTab === 'friends' ? (
                    <div className="space-y-6">
                        {friends.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No friends yet</h3>
                                <p className="text-muted-foreground mb-6">Start building your dining network by adding friends.</p>
                                <Button onClick={() => setActiveTab('add')} className="rounded-full px-8">
                                    Find Friends
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                {friends.map((friend, idx) => (
                                    <div key={friend.id} className={`flex items-center justify-between p-4 sm:p-6 ${idx !== friends.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                                {friend.profile?.avatar_url ? (
                                                    <img src={friend.profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    friend.profile?.full_name?.charAt(0) || '?'
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{friend.profile?.full_name || 'Unknown User'}</h4>
                                                <p className="text-sm text-muted-foreground">Friends since {new Date(friend.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                            onClick={() => handleReject(friend.id)}
                                            disabled={actionLoading === friend.id}
                                        >
                                            <UserMinus className="w-5 h-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Pending Requests */}
                        {requests.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Pending Requests</h3>
                                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                    {requests.map((req, idx) => (
                                        <div key={req.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4 ${idx !== requests.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                    {req.profile?.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{req.profile?.full_name || 'Unknown User'}</h4>
                                                    <p className="text-sm text-muted-foreground">Wants to follow your dining journey</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <Button
                                                    className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 rounded-full gap-2"
                                                    onClick={() => handleAccept(req.id)}
                                                    disabled={actionLoading === req.id}
                                                >
                                                    {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    Accept
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 sm:flex-none rounded-full"
                                                    onClick={() => handleReject(req.id)}
                                                    disabled={actionLoading === req.id}
                                                >
                                                    Decline
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Search Users */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Find Friends</h3>
                            <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search by name..."
                                        className="pl-12 py-6 rounded-full bg-gray-50 border-transparent focus-visible:ring-primary/20 focus-visible:border-primary text-base"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {searchQuery.length >= 3 ? (
                                    <div className="space-y-4">
                                        {searchResults.length > 0 ? searchResults.map(user => {
                                            const isFriend = friends.some(f => f.profile?.id === user.id);
                                            const hasPending = requests.some(r => r.profile?.id === user.id);

                                            return (
                                                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                                            {user.full_name?.charAt(0) || '?'}
                                                        </div>
                                                        <h4 className="font-medium text-gray-900">{user.full_name}</h4>
                                                    </div>
                                                    <Button
                                                        variant={isFriend ? "secondary" : "default"}
                                                        size="sm"
                                                        className="rounded-full"
                                                        disabled={isFriend || hasPending || actionLoading === user.id}
                                                        onClick={() => handleSendRequest(user.id)}
                                                    >
                                                        {actionLoading === user.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : isFriend ? (
                                                            <><Check className="w-4 h-4 mr-1" /> Friends</>
                                                        ) : hasPending ? (
                                                            'Pending'
                                                        ) : (
                                                            <><UserPlus className="w-4 h-4 mr-1" /> Add</>
                                                        )}
                                                    </Button>
                                                </div>
                                            );
                                        }) : (
                                            <p className="text-center text-muted-foreground py-8">No foodies found matching "{searchQuery}"</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Search className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p className="text-muted-foreground">Type at least 3 characters to search</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
