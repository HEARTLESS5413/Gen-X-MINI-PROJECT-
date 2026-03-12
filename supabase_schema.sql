-- Gen-X Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- ===== USERS TABLE =====
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== POSTS TABLE =====
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image TEXT,
  caption TEXT DEFAULT '',
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== COMMENTS TABLE =====
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== LIKES TABLE =====
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- ===== FOLLOWS TABLE =====
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, target_id)
);

-- ===== MESSAGES TABLE =====
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT DEFAULT '',
  type TEXT DEFAULT 'text',
  image_url TEXT,
  viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== NOTIFICATIONS TABLE =====
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID,
  text TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== STORIES TABLE =====
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== CALL SIGNALING TABLE =====
CREATE TABLE IF NOT EXISTS call_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_id UUID REFERENCES users(id) ON DELETE CASCADE,
  call_type TEXT DEFAULT 'audio',
  status TEXT DEFAULT 'ringing',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_user_id ON follows(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_target_id ON follows(target_id);
CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_id);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_to ON notifications(to_user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);

-- ===== ROW LEVEL SECURITY =====
-- Disable RLS for now (allow all operations with anon key)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon users (simple policy for MVP)
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for posts" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for likes" ON likes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for follows" ON follows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for stories" ON stories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for call_signals" ON call_signals FOR ALL USING (true) WITH CHECK (true);

-- ===== ENABLE REALTIME =====
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;

-- ===== SEED DEMO DATA =====
INSERT INTO users (id, username, name, email, password, bio, avatar, is_public) VALUES
  ('00000000-0000-0000-0000-000000000001', 'genx_star', 'GenX Star', 'genx@demo.com', 'demo123', 'Living my best life ✨', 'https://i.pravatar.cc/150?img=1', true),
  ('00000000-0000-0000-0000-000000000002', 'cyber_punk', 'Cyber Punk', 'cyber@demo.com', 'demo123', 'Tech enthusiast 🤖', 'https://i.pravatar.cc/150?img=2', true),
  ('00000000-0000-0000-0000-000000000003', 'zen_vibes', 'Zen Vibes', 'zen@demo.com', 'demo123', 'Peace & positivity 🧘', 'https://i.pravatar.cc/150?img=3', true),
  ('00000000-0000-0000-0000-000000000004', 'art_soul', 'Art Soul', 'art@demo.com', 'demo123', 'Artist | Painter 🎨', 'https://i.pravatar.cc/150?img=4', true),
  ('00000000-0000-0000-0000-000000000005', 'wanderlust', 'Wander Lust', 'wander@demo.com', 'demo123', 'Traveler 🌍 | 30 countries', 'https://i.pravatar.cc/150?img=5', false),
  ('00000000-0000-0000-0000-000000000006', 'foodie_queen', 'Foodie Queen', 'foodie@demo.com', 'demo123', 'Eat. Cook. Repeat. 🍕', 'https://i.pravatar.cc/150?img=6', true),
  ('00000000-0000-0000-0000-000000000007', 'fit_life', 'Fit Life', 'fit@demo.com', 'demo123', 'Fitness is a lifestyle 💪', 'https://i.pravatar.cc/150?img=7', true),
  ('00000000-0000-0000-0000-000000000008', 'music_maven', 'Music Maven', 'music@demo.com', 'demo123', 'Lost in melodies 🎵', 'https://i.pravatar.cc/150?img=8', true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO posts (user_id, image, caption, likes_count) VALUES
  ('00000000-0000-0000-0000-000000000002', 'https://picsum.photos/id/10/800/800', 'Exploring the nexus of technology and nature 🌿💻 #future #genx', 234),
  ('00000000-0000-0000-0000-000000000003', 'https://picsum.photos/id/20/800/800', 'Pure serenity in the digital age ✨ #peace', 856),
  ('00000000-0000-0000-0000-000000000004', 'https://picsum.photos/id/30/800/800', 'My latest painting 🎨 What do you think?', 412),
  ('00000000-0000-0000-0000-000000000006', 'https://picsum.photos/id/40/800/800', 'Sunday brunch vibes 🥞☕', 1023),
  ('00000000-0000-0000-0000-000000000001', 'https://picsum.photos/id/50/800/800', 'Golden hour magic 🌅', 567),
  ('00000000-0000-0000-0000-000000000005', 'https://picsum.photos/id/60/800/800', 'Somewhere between the mountains ⛰️', 789),
  ('00000000-0000-0000-0000-000000000007', 'https://picsum.photos/id/70/800/800', 'Morning workout done! 💪🔥', 345),
  ('00000000-0000-0000-0000-000000000008', 'https://picsum.photos/id/80/800/800', 'Late night studio sessions 🎵🌙', 678);

INSERT INTO stories (user_id) VALUES
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000006');
