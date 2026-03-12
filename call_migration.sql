-- Migration: Add WebRTC signaling columns to call_signals
-- Run this in the Supabase SQL Editor

ALTER TABLE call_signals ADD COLUMN IF NOT EXISTS sdp_offer TEXT;
ALTER TABLE call_signals ADD COLUMN IF NOT EXISTS sdp_answer TEXT;
ALTER TABLE call_signals ADD COLUMN IF NOT EXISTS ice_candidates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE call_signals ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
