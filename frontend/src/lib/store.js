import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== AUTH =====
export const auth = {
    async signup(username, email, password, name) {
        // Check if username exists
        const { data: existing } = await supabase.from('users').select('id').eq('username', username).maybeSingle();
        if (existing) return { error: 'Username already taken' };

        const { data, error } = await supabase.from('users').insert({
            username,
            email: email || `${username}@genx.app`,
            password,
            name: name || username,
            avatar: `https://i.pravatar.cc/150?u=${username}`,
            is_public: true,
        }).select().single();

        if (error) return { error: error.message };
        const { password: _, ...safeUser } = data;
        localStorage.setItem('genx_current_user', JSON.stringify(safeUser));
        return { user: safeUser };
    },

    async login(emailOrUsername, password) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
            .eq('password', password)
            .maybeSingle();

        if (error || !data) return { error: 'Invalid credentials' };
        const { password: _, ...safeUser } = data;
        localStorage.setItem('genx_current_user', JSON.stringify(safeUser));
        return { user: safeUser };
    },

    logout() {
        localStorage.removeItem('genx_current_user');
    },

    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('genx_current_user')) || null;
        } catch { return null; }
    },

    async updateProfile(userId, updates) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) return { error: error.message };
        const { password: _, ...safeUser } = data;
        localStorage.setItem('genx_current_user', JSON.stringify(safeUser));
        return { user: safeUser };
    }
};

// ===== USERS =====
export const users = {
    async getById(id) {
        const { data } = await supabase.from('users').select('id,username,name,email,bio,avatar,phone,is_public,created_at').eq('id', id).maybeSingle();
        return data;
    },
    async getByUsername(username) {
        const { data } = await supabase.from('users').select('id,username,name,email,bio,avatar,phone,is_public,created_at').eq('username', username).maybeSingle();
        return data;
    },
    async search(query) {
        if (!query || query.length < 1) return [];
        const { data } = await supabase.from('users')
            .select('id,username,name,avatar')
            .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
            .limit(20);
        return data || [];
    },
    async getAll() {
        const { data } = await supabase.from('users').select('id,username,name,email,bio,avatar,phone,is_public,created_at');
        return data || [];
    }
};

// ===== POSTS =====
export const posts = {
    async getAll() {
        const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        return data || [];
    },
    async getByUser(userId) {
        const { data } = await supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    },
    async create(userId, image, caption) {
        const { data, error } = await supabase.from('posts').insert({
            user_id: userId,
            image,
            caption,
            likes_count: 0,
        }).select().single();

        if (error) return null;

        // Notify followers
        const { data: followerData } = await supabase.from('follows').select('user_id').eq('target_id', userId);
        if (followerData && followerData.length > 0) {
            const notifs = followerData.map(f => ({
                type: 'new_post',
                from_user_id: userId,
                to_user_id: f.user_id,
                post_id: data.id,
                read: false,
            }));
            await supabase.from('notifications').insert(notifs);
        }

        return data;
    }
};

// ===== LIKES =====
export const likes = {
    async toggle(userId, postId) {
        const { data: existing } = await supabase.from('likes')
            .select('id')
            .eq('user_id', userId)
            .eq('post_id', postId)
            .maybeSingle();

        if (existing) {
            await supabase.from('likes').delete().eq('id', existing.id);
            await supabase.rpc('decrement_likes', { p_post_id: postId }).catch(() => {
                // Fallback: manual update
                supabase.from('posts').select('likes_count').eq('id', postId).single().then(({ data }) => {
                    if (data) supabase.from('posts').update({ likes_count: Math.max(0, data.likes_count - 1) }).eq('id', postId);
                });
            });
            return false;
        } else {
            await supabase.from('likes').insert({ user_id: userId, post_id: postId });
            await supabase.rpc('increment_likes', { p_post_id: postId }).catch(() => {
                supabase.from('posts').select('likes_count').eq('id', postId).single().then(({ data }) => {
                    if (data) supabase.from('posts').update({ likes_count: data.likes_count + 1 }).eq('id', postId);
                });
            });

            // Get post owner for notification
            const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
            if (post && post.user_id !== userId) {
                await supabase.from('notifications').insert({
                    type: 'like',
                    from_user_id: userId,
                    to_user_id: post.user_id,
                    post_id: postId,
                    read: false,
                });
            }
            return true;
        }
    },
    async isLiked(userId, postId) {
        const { data } = await supabase.from('likes').select('id').eq('user_id', userId).eq('post_id', postId).maybeSingle();
        return !!data;
    }
};

// ===== SAVED =====
export const saved = {
    async toggle(userId, postId) {
        const { data: existing } = await supabase.from('saved').select('id').eq('user_id', userId).eq('post_id', postId).maybeSingle();
        if (existing) {
            await supabase.from('saved').delete().eq('id', existing.id);
            return false;
        } else {
            // We need a saved table — let's use localStorage fallback for now
            const all = JSON.parse(localStorage.getItem('genx_saved') || '[]');
            all.push({ userId, postId });
            localStorage.setItem('genx_saved', JSON.stringify(all));
            return true;
        }
    },
    async isSaved(userId, postId) {
        // Use localStorage for saved (no saved table in schema — keep simple)
        const all = JSON.parse(localStorage.getItem('genx_saved') || '[]');
        return all.some(s => s.userId === userId && s.postId === postId);
    },
    async getByUser(userId) {
        const all = JSON.parse(localStorage.getItem('genx_saved') || '[]');
        const savedPostIds = all.filter(s => s.userId === userId).map(s => s.postId);
        if (savedPostIds.length === 0) return [];
        const { data } = await supabase.from('posts').select('*').in('id', savedPostIds);
        return data || [];
    }
};

// ===== COMMENTS =====
export const comments = {
    async getByPost(postId) {
        const { data } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
        return data || [];
    },
    async add(userId, postId, text) {
        const { data, error } = await supabase.from('comments').insert({
            post_id: postId,
            user_id: userId,
            text,
            likes: 0,
        }).select().single();

        if (error) return null;

        // Notification
        const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
        if (post && post.user_id !== userId) {
            await supabase.from('notifications').insert({
                type: 'comment',
                from_user_id: userId,
                to_user_id: post.user_id,
                post_id: postId,
                text,
                read: false,
            });
        }
        return data;
    }
};

// ===== FOLLOWS =====
export const follows = {
    async toggle(userId, targetId) {
        const { data: existing } = await supabase.from('follows').select('id').eq('user_id', userId).eq('target_id', targetId).maybeSingle();
        if (existing) {
            await supabase.from('follows').delete().eq('id', existing.id);
            return false;
        } else {
            await supabase.from('follows').insert({ user_id: userId, target_id: targetId });
            await supabase.from('notifications').insert({
                type: 'follow',
                from_user_id: userId,
                to_user_id: targetId,
                read: false,
            });
            return true;
        }
    },
    async isFollowing(userId, targetId) {
        const { data } = await supabase.from('follows').select('id').eq('user_id', userId).eq('target_id', targetId).maybeSingle();
        return !!data;
    },
    async getFollowers(userId) {
        const { data } = await supabase.from('follows').select('*').eq('target_id', userId);
        return data || [];
    },
    async getFollowing(userId) {
        const { data } = await supabase.from('follows').select('*').eq('user_id', userId);
        return data || [];
    }
};

// ===== STORIES =====
export const stories = {
    async getAll() {
        const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false });
        return data || [];
    },
    async add(userId) {
        await supabase.from('stories').insert({ user_id: userId });
    }
};

// ===== NOTIFICATIONS =====
export const notifications = {
    async getForUser(userId) {
        const { data } = await supabase.from('notifications').select('*').eq('to_user_id', userId).order('created_at', { ascending: false }).limit(50);
        return data || [];
    },
    async markAllRead(userId) {
        await supabase.from('notifications').update({ read: true }).eq('to_user_id', userId).eq('read', false);
    },
    async getUnreadCount(userId) {
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('to_user_id', userId).eq('read', false);
        return count || 0;
    }
};

// ===== MESSAGES =====
export const messages = {
    async getConversations(userId) {
        // Get all messages involving this user
        const { data: allMsgs } = await supabase.from('messages')
            .select('*')
            .or(`from_id.eq.${userId},to_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (!allMsgs) return [];
        const convMap = {};
        allMsgs.forEach(m => {
            const otherId = m.from_id === userId ? m.to_id : m.from_id;
            if (!convMap[otherId]) convMap[otherId] = m;
        });
        return Object.entries(convMap).map(([otherId, lastMsg]) => ({
            userId: otherId,
            lastMessage: lastMsg.text || '📷 Photo',
            time: lastMsg.created_at,
            createdAt: lastMsg.created_at
        }));
    },
    async getMessages(userId1, userId2) {
        const { data } = await supabase.from('messages')
            .select('*')
            .or(`and(from_id.eq.${userId1},to_id.eq.${userId2}),and(from_id.eq.${userId2},to_id.eq.${userId1})`)
            .order('created_at', { ascending: true });
        return data || [];
    },
    async send(from, to, text, type = 'text', imageUrl = null) {
        const { data } = await supabase.from('messages').insert({
            from_id: from,
            to_id: to,
            text,
            type,
            image_url: imageUrl,
            viewed: false,
        }).select().single();
        return data;
    },
    async markViewed(msgId) {
        await supabase.from('messages').update({ viewed: true }).eq('id', msgId);
    },
    async getUnreadCount(userId) {
        const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('to_id', userId).eq('viewed', false);
        return count || 0;
    },
    async markConversationRead(userId, otherUserId) {
        await supabase.from('messages').update({ viewed: true }).eq('from_id', otherUserId).eq('to_id', userId).eq('viewed', false);
    }
};

// ===== THEME (stays local) =====
export const theme = {
    get() { return localStorage.getItem('genx_theme') || 'dark'; },
    set(t) { localStorage.setItem('genx_theme', t); document.documentElement.setAttribute('data-theme', t); },
    toggle() {
        const current = this.get();
        const next = current === 'dark' ? 'light' : 'dark';
        this.set(next);
        return next;
    },
    init() { this.set(this.get()); }
};

// ===== REALTIME SUBSCRIPTIONS =====
export function subscribeToMessages(userId, callback) {
    return supabase
        .channel('messages-channel')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `to_id=eq.${userId}`,
        }, payload => callback(payload.new))
        .subscribe();
}

export function subscribeToNotifications(userId, callback) {
    return supabase
        .channel('notifications-channel')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `to_user_id=eq.${userId}`,
        }, payload => callback(payload.new))
        .subscribe();
}

export function subscribeToCallSignals(userId, callback) {
    return supabase
        .channel('calls-channel')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'call_signals',
            filter: `to_id=eq.${userId}`,
        }, payload => callback(payload))
        .subscribe();
}

export default { auth, users, posts, likes, saved, comments, follows, stories, notifications, messages, theme };
