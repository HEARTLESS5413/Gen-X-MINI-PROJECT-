import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ===== LOCAL STORAGE HELPERS (works without Supabase) =====

const STORAGE_KEYS = {
    USERS: 'rimi_users',
    CURRENT_USER: 'rimi_current_user',
    POSTS: 'rimi_posts',
    STORIES: 'rimi_stories',
    MESSAGES: 'rimi_messages',
    NOTIFICATIONS: 'rimi_notifications',
    FOLLOWS: 'rimi_follows',
    COMMENTS: 'rimi_comments',
    LIKES: 'rimi_likes',
    SAVED: 'rimi_saved',
    THEME: 'rimi_theme',
};

function getStore(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch { return []; }
}

function setStore(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getStoreObj(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || null;
    } catch { return null; }
}

// ===== SEED DATA =====
function seedData() {
    if (getStore(STORAGE_KEYS.USERS).length > 0) return;

    const users = [
        { id: 'u1', username: 'rimi_star', name: 'Rimi Star', email: 'rimi@demo.com', password: 'demo123', bio: 'Living my best life ✨\nContent creator | Dreamer', avatar: 'https://i.pravatar.cc/150?img=1', isPublic: true },
        { id: 'u2', username: 'cyber_punk', name: 'Cyber Punk', email: 'cyber@demo.com', password: 'demo123', bio: 'Tech enthusiast 🤖\nBuilding the future', avatar: 'https://i.pravatar.cc/150?img=2', isPublic: true },
        { id: 'u3', username: 'zen_vibes', name: 'Zen Vibes', email: 'zen@demo.com', password: 'demo123', bio: 'Peace & positivity 🧘', avatar: 'https://i.pravatar.cc/150?img=3', isPublic: true },
        { id: 'u4', username: 'art_soul', name: 'Art Soul', email: 'art@demo.com', password: 'demo123', bio: 'Artist | Painter 🎨', avatar: 'https://i.pravatar.cc/150?img=4', isPublic: true },
        { id: 'u5', username: 'wanderlust', name: 'Wander Lust', email: 'wander@demo.com', password: 'demo123', bio: 'Traveler 🌍 | 30 countries', avatar: 'https://i.pravatar.cc/150?img=5', isPublic: false },
        { id: 'u6', username: 'foodie_queen', name: 'Foodie Queen', email: 'foodie@demo.com', password: 'demo123', bio: 'Eat. Cook. Repeat. 🍕', avatar: 'https://i.pravatar.cc/150?img=6', isPublic: true },
        { id: 'u7', username: 'fit_life', name: 'Fit Life', email: 'fit@demo.com', password: 'demo123', bio: 'Fitness is a lifestyle 💪', avatar: 'https://i.pravatar.cc/150?img=7', isPublic: true },
        { id: 'u8', username: 'music_maven', name: 'Music Maven', email: 'music@demo.com', password: 'demo123', bio: 'Lost in melodies 🎵', avatar: 'https://i.pravatar.cc/150?img=8', isPublic: true },
    ];

    const posts = [
        { id: 'p1', userId: 'u2', image: 'https://picsum.photos/id/10/800/800', caption: 'Exploring the nexus of technology and nature 🌿💻 #future #rimi', likes: 234, time: '2h', createdAt: Date.now() - 7200000 },
        { id: 'p2', userId: 'u3', image: 'https://picsum.photos/id/20/800/800', caption: 'Pure serenity in the digital age ✨ #peace', likes: 856, time: '5h', createdAt: Date.now() - 18000000 },
        { id: 'p3', userId: 'u4', image: 'https://picsum.photos/id/30/800/800', caption: 'My latest painting 🎨 What do you think?', likes: 412, time: '8h', createdAt: Date.now() - 28800000 },
        { id: 'p4', userId: 'u6', image: 'https://picsum.photos/id/40/800/800', caption: 'Sunday brunch vibes 🥞☕', likes: 1023, time: '12h', createdAt: Date.now() - 43200000 },
        { id: 'p5', userId: 'u1', image: 'https://picsum.photos/id/50/800/800', caption: 'Golden hour magic 🌅', likes: 567, time: '1d', createdAt: Date.now() - 86400000 },
        { id: 'p6', userId: 'u5', image: 'https://picsum.photos/id/60/800/800', caption: 'Somewhere between the mountains ⛰️', likes: 789, time: '1d', createdAt: Date.now() - 90000000 },
        { id: 'p7', userId: 'u7', image: 'https://picsum.photos/id/70/800/800', caption: 'Morning workout done! 💪🔥', likes: 345, time: '2d', createdAt: Date.now() - 172800000 },
        { id: 'p8', userId: 'u8', image: 'https://picsum.photos/id/80/800/800', caption: 'Late night studio sessions 🎵🌙', likes: 678, time: '3d', createdAt: Date.now() - 259200000 },
    ];

    const comments = [
        { id: 'c1', postId: 'p1', userId: 'u3', text: 'This is amazing! 🔥', time: '1h', likes: 12 },
        { id: 'c2', postId: 'p1', userId: 'u4', text: 'Love the composition', time: '30m', likes: 3 },
        { id: 'c3', postId: 'p2', userId: 'u1', text: 'So peaceful ✨', time: '4h', likes: 8 },
        { id: 'c4', postId: 'p3', userId: 'u2', text: 'Beautiful work!', time: '6h', likes: 15 },
        { id: 'c5', postId: 'p4', userId: 'u7', text: 'Yummy! 😋', time: '10h', likes: 5 },
    ];

    setStore(STORAGE_KEYS.USERS, users);
    setStore(STORAGE_KEYS.POSTS, posts);
    setStore(STORAGE_KEYS.COMMENTS, comments);
    setStore(STORAGE_KEYS.FOLLOWS, []);
    setStore(STORAGE_KEYS.LIKES, []);
    setStore(STORAGE_KEYS.SAVED, []);
    setStore(STORAGE_KEYS.NOTIFICATIONS, []);
    setStore(STORAGE_KEYS.MESSAGES, []);
    setStore(STORAGE_KEYS.STORIES, [
        { id: 's1', userId: 'u1', viewed: false },
        { id: 's2', userId: 'u2', viewed: false },
        { id: 's3', userId: 'u3', viewed: false },
        { id: 's4', userId: 'u4', viewed: false },
        { id: 's5', userId: 'u6', viewed: false },
    ]);
}

seedData();

// ===== AUTH =====
export const auth = {
    signup(username, email, password, name) {
        const users = getStore(STORAGE_KEYS.USERS);
        if (users.find(u => u.username === username)) return { error: 'Username already taken' };
        if (users.find(u => u.email === email)) return { error: 'Email already registered' };
        const newUser = {
            id: 'u_' + Date.now(),
            username,
            email,
            password,
            name: name || username,
            bio: '',
            avatar: `https://i.pravatar.cc/150?u=${username}`,
            isPublic: true,
            createdAt: Date.now()
        };
        users.push(newUser);
        setStore(STORAGE_KEYS.USERS, users);
        const { password: _, ...safeUser } = newUser;
        setStore(STORAGE_KEYS.CURRENT_USER, safeUser);
        return { user: safeUser };
    },

    login(emailOrUsername, password) {
        const users = getStore(STORAGE_KEYS.USERS);
        const user = users.find(u => (u.email === emailOrUsername || u.username === emailOrUsername) && u.password === password);
        if (!user) return { error: 'Invalid credentials' };
        const { password: _, ...safeUser } = user;
        setStore(STORAGE_KEYS.CURRENT_USER, safeUser);
        return { user: safeUser };
    },

    logout() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },

    getCurrentUser() {
        return getStoreObj(STORAGE_KEYS.CURRENT_USER);
    },

    updateProfile(userId, updates) {
        const users = getStore(STORAGE_KEYS.USERS);
        const idx = users.findIndex(u => u.id === userId);
        if (idx === -1) return { error: 'User not found' };
        users[idx] = { ...users[idx], ...updates };
        setStore(STORAGE_KEYS.USERS, users);
        const { password: _, ...safeUser } = users[idx];
        setStore(STORAGE_KEYS.CURRENT_USER, safeUser);
        return { user: safeUser };
    }
};

// ===== USERS =====
export const users = {
    getById(id) {
        return getStore(STORAGE_KEYS.USERS).find(u => u.id === id) || null;
    },
    getByUsername(username) {
        return getStore(STORAGE_KEYS.USERS).find(u => u.username === username) || null;
    },
    search(query) {
        if (!query || query.length < 1) return [];
        const q = query.toLowerCase();
        return getStore(STORAGE_KEYS.USERS).filter(u =>
            u.username.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q))
        );
    },
    getAll() {
        return getStore(STORAGE_KEYS.USERS);
    }
};

// ===== POSTS =====
export const posts = {
    getAll() {
        return getStore(STORAGE_KEYS.POSTS).sort((a, b) => b.createdAt - a.createdAt);
    },
    getByUser(userId) {
        return getStore(STORAGE_KEYS.POSTS).filter(p => p.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
    },
    create(userId, image, caption) {
        const allPosts = getStore(STORAGE_KEYS.POSTS);
        const newPost = {
            id: 'p_' + Date.now(),
            userId,
            image,
            caption,
            likes: 0,
            time: 'now',
            createdAt: Date.now()
        };
        allPosts.unshift(newPost);
        setStore(STORAGE_KEYS.POSTS, allPosts);

        // Notify followers
        const follows = getStore(STORAGE_KEYS.FOLLOWS);
        const followers = follows.filter(f => f.targetId === userId).map(f => f.userId);
        const notifs = getStore(STORAGE_KEYS.NOTIFICATIONS);
        followers.forEach(fId => {
            notifs.unshift({
                id: 'n_' + Date.now() + '_' + fId,
                type: 'new_post',
                fromUserId: userId,
                toUserId: fId,
                postId: newPost.id,
                read: false,
                createdAt: Date.now()
            });
        });
        setStore(STORAGE_KEYS.NOTIFICATIONS, notifs);

        return newPost;
    }
};

// ===== LIKES =====
export const likes = {
    toggle(userId, postId) {
        const allLikes = getStore(STORAGE_KEYS.LIKES);
        const idx = allLikes.findIndex(l => l.userId === userId && l.postId === postId);
        const allPosts = getStore(STORAGE_KEYS.POSTS);
        const postIdx = allPosts.findIndex(p => p.id === postId);

        if (idx > -1) {
            allLikes.splice(idx, 1);
            if (postIdx > -1) allPosts[postIdx].likes = Math.max(0, allPosts[postIdx].likes - 1);
            setStore(STORAGE_KEYS.LIKES, allLikes);
            setStore(STORAGE_KEYS.POSTS, allPosts);
            return false;
        } else {
            allLikes.push({ userId, postId });
            if (postIdx > -1) {
                allPosts[postIdx].likes += 1;
                // Notification
                const notifs = getStore(STORAGE_KEYS.NOTIFICATIONS);
                if (allPosts[postIdx].userId !== userId) {
                    notifs.unshift({
                        id: 'n_' + Date.now(),
                        type: 'like',
                        fromUserId: userId,
                        toUserId: allPosts[postIdx].userId,
                        postId,
                        read: false,
                        createdAt: Date.now()
                    });
                    setStore(STORAGE_KEYS.NOTIFICATIONS, notifs);
                }
            }
            setStore(STORAGE_KEYS.LIKES, allLikes);
            setStore(STORAGE_KEYS.POSTS, allPosts);
            return true;
        }
    },
    isLiked(userId, postId) {
        return getStore(STORAGE_KEYS.LIKES).some(l => l.userId === userId && l.postId === postId);
    }
};

// ===== SAVED =====
export const saved = {
    toggle(userId, postId) {
        const all = getStore(STORAGE_KEYS.SAVED);
        const idx = all.findIndex(s => s.userId === userId && s.postId === postId);
        if (idx > -1) { all.splice(idx, 1); setStore(STORAGE_KEYS.SAVED, all); return false; }
        else { all.push({ userId, postId }); setStore(STORAGE_KEYS.SAVED, all); return true; }
    },
    isSaved(userId, postId) {
        return getStore(STORAGE_KEYS.SAVED).some(s => s.userId === userId && s.postId === postId);
    },
    getByUser(userId) {
        const all = getStore(STORAGE_KEYS.SAVED).filter(s => s.userId === userId);
        const allPosts = getStore(STORAGE_KEYS.POSTS);
        return all.map(s => allPosts.find(p => p.id === s.postId)).filter(Boolean);
    }
};

// ===== COMMENTS =====
export const comments = {
    getByPost(postId) {
        return getStore(STORAGE_KEYS.COMMENTS).filter(c => c.postId === postId);
    },
    add(userId, postId, text) {
        const all = getStore(STORAGE_KEYS.COMMENTS);
        const newComment = {
            id: 'c_' + Date.now(),
            postId,
            userId,
            text,
            time: 'now',
            likes: 0,
            createdAt: Date.now()
        };
        all.push(newComment);
        setStore(STORAGE_KEYS.COMMENTS, all);

        // Notification
        const allPosts = getStore(STORAGE_KEYS.POSTS);
        const post = allPosts.find(p => p.id === postId);
        if (post && post.userId !== userId) {
            const notifs = getStore(STORAGE_KEYS.NOTIFICATIONS);
            notifs.unshift({
                id: 'n_' + Date.now(),
                type: 'comment',
                fromUserId: userId,
                toUserId: post.userId,
                postId,
                text,
                read: false,
                createdAt: Date.now()
            });
            setStore(STORAGE_KEYS.NOTIFICATIONS, notifs);
        }
        return newComment;
    }
};

// ===== FOLLOWS =====
export const follows = {
    toggle(userId, targetId) {
        const all = getStore(STORAGE_KEYS.FOLLOWS);
        const idx = all.findIndex(f => f.userId === userId && f.targetId === targetId);
        if (idx > -1) {
            all.splice(idx, 1);
            setStore(STORAGE_KEYS.FOLLOWS, all);
            return false;
        } else {
            all.push({ userId, targetId, createdAt: Date.now() });
            setStore(STORAGE_KEYS.FOLLOWS, all);
            // Notification
            const notifs = getStore(STORAGE_KEYS.NOTIFICATIONS);
            notifs.unshift({
                id: 'n_' + Date.now(),
                type: 'follow',
                fromUserId: userId,
                toUserId: targetId,
                read: false,
                createdAt: Date.now()
            });
            setStore(STORAGE_KEYS.NOTIFICATIONS, notifs);
            return true;
        }
    },
    isFollowing(userId, targetId) {
        return getStore(STORAGE_KEYS.FOLLOWS).some(f => f.userId === userId && f.targetId === targetId);
    },
    getFollowers(userId) {
        return getStore(STORAGE_KEYS.FOLLOWS).filter(f => f.targetId === userId);
    },
    getFollowing(userId) {
        return getStore(STORAGE_KEYS.FOLLOWS).filter(f => f.userId === userId);
    }
};

// ===== STORIES =====
export const stories = {
    getAll() { return getStore(STORAGE_KEYS.STORIES); },
    add(userId) {
        const all = getStore(STORAGE_KEYS.STORIES);
        all.push({ id: 's_' + Date.now(), userId, viewed: false, createdAt: Date.now() });
        setStore(STORAGE_KEYS.STORIES, all);
    }
};

// ===== NOTIFICATIONS =====
export const notifications = {
    getForUser(userId) {
        return getStore(STORAGE_KEYS.NOTIFICATIONS).filter(n => n.toUserId === userId).sort((a, b) => b.createdAt - a.createdAt);
    },
    markAllRead(userId) {
        const all = getStore(STORAGE_KEYS.NOTIFICATIONS);
        all.forEach(n => { if (n.toUserId === userId) n.read = true; });
        setStore(STORAGE_KEYS.NOTIFICATIONS, all);
    },
    getUnreadCount(userId) {
        return getStore(STORAGE_KEYS.NOTIFICATIONS).filter(n => n.toUserId === userId && !n.read).length;
    }
};

// ===== MESSAGES =====
export const messages = {
    getConversations(userId) {
        const allMsgs = getStore(STORAGE_KEYS.MESSAGES);
        const convMap = {};
        allMsgs.forEach(m => {
            if (m.from === userId || m.to === userId) {
                const otherId = m.from === userId ? m.to : m.from;
                if (!convMap[otherId] || convMap[otherId].createdAt < m.createdAt) {
                    convMap[otherId] = m;
                }
            }
        });
        return Object.entries(convMap).map(([otherId, lastMsg]) => ({
            userId: otherId,
            lastMessage: lastMsg.text || '📷 Photo',
            time: lastMsg.time || 'now',
            createdAt: lastMsg.createdAt
        })).sort((a, b) => b.createdAt - a.createdAt);
    },
    getMessages(userId1, userId2) {
        return getStore(STORAGE_KEYS.MESSAGES)
            .filter(m => (m.from === userId1 && m.to === userId2) || (m.from === userId2 && m.to === userId1))
            .sort((a, b) => a.createdAt - b.createdAt);
    },
    send(from, to, text, type = 'text', imageUrl = null) {
        const all = getStore(STORAGE_KEYS.MESSAGES);
        const msg = {
            id: 'm_' + Date.now(),
            from,
            to,
            text,
            type,
            imageUrl,
            viewed: false,
            time: 'now',
            createdAt: Date.now()
        };
        all.push(msg);
        setStore(STORAGE_KEYS.MESSAGES, all);
        return msg;
    },
    markViewed(msgId) {
        const all = getStore(STORAGE_KEYS.MESSAGES);
        const idx = all.findIndex(m => m.id === msgId);
        if (idx > -1) {
            if (all[idx].type === 'one-time') {
                all.splice(idx, 1);
            } else {
                all[idx].viewed = true;
            }
            setStore(STORAGE_KEYS.MESSAGES, all);
        }
    },
    getUnreadCount(userId) {
        return getStore(STORAGE_KEYS.MESSAGES).filter(m => m.to === userId && !m.viewed).length;
    },
    markConversationRead(userId, otherUserId) {
        const all = getStore(STORAGE_KEYS.MESSAGES);
        all.forEach(m => {
            if (m.from === otherUserId && m.to === userId && !m.viewed) {
                m.viewed = true;
            }
        });
        setStore(STORAGE_KEYS.MESSAGES, all);
    }
};

// ===== THEME =====
export const theme = {
    get() { return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark'; },
    set(t) { localStorage.setItem(STORAGE_KEYS.THEME, t); document.documentElement.setAttribute('data-theme', t); },
    toggle() {
        const current = this.get();
        const next = current === 'dark' ? 'light' : 'dark';
        this.set(next);
        return next;
    },
    init() { this.set(this.get()); }
};

export default { auth, users, posts, likes, saved, comments, follows, stories, notifications, messages, theme };
