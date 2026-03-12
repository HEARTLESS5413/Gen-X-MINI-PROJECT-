-- Migration: Add game_sessions table for multiplayer games
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type TEXT NOT NULL,           -- 'rps', 'tictactoe', 'word'
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'waiting',     -- 'waiting', 'playing', 'finished'
  max_players INT DEFAULT 2,
  current_round INT DEFAULT 1,
  game_state JSONB DEFAULT '{}'::jsonb,
  winner_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  move TEXT,                         -- current move (e.g. 'rock', 'X')
  ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_host ON game_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_players_session ON game_players(session_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user ON game_players(user_id);

-- RLS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for game_sessions" ON game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for game_players" ON game_players FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
