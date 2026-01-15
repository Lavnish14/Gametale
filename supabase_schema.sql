-- GameTale Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor: https://eyeywkvxdfxdjfpyyufi.supabase.co

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id INTEGER NOT NULL,
  game_name TEXT NOT NULL,
  game_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Enable RLS on wishlists
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Wishlists policies
CREATE POLICY "Users can view their own wishlist"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wishlist"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their wishlist"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Reviews table (GOAT/MID/TRASH Rating System)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id INTEGER NOT NULL,
  rating TEXT CHECK (rating IN ('goat', 'mid', 'trash')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Enable RLS on reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable Realtime for comments (run this to enable live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 5. Game Overrides table (manual corrections for RAWG data + auto-detection cache)
CREATE TABLE IF NOT EXISTS game_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id INTEGER UNIQUE NOT NULL,
  game_name TEXT NOT NULL,
  is_released BOOLEAN DEFAULT NULL,
  release_date DATE DEFAULT NULL,
  is_trending BOOLEAN DEFAULT FALSE,
  trending_score INTEGER DEFAULT 0,
  detected_via TEXT DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on game_overrides
ALTER TABLE game_overrides ENABLE ROW LEVEL SECURITY;

-- Game overrides are viewable by everyone (public read)
CREATE POLICY "Game overrides are viewable by everyone"
  ON game_overrides FOR SELECT
  USING (true);

-- Allow inserts for auto-detection (using service role or anon with RLS bypass)
CREATE POLICY "Allow game override inserts"
  ON game_overrides FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow game override updates"
  ON game_overrides FOR UPDATE
  USING (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_game_overrides_game_id ON game_overrides(game_id);

-- 6. YouTube Trending Cache table
CREATE TABLE IF NOT EXISTS youtube_trending_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id INTEGER UNIQUE NOT NULL,
  game_name TEXT NOT NULL,
  total_views BIGINT DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  avg_views_per_video BIGINT DEFAULT 0,
  trending_score INTEGER DEFAULT 0,
  has_gameplay_videos BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE youtube_trending_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "YouTube cache is viewable by everyone"
  ON youtube_trending_cache FOR SELECT
  USING (true);

CREATE POLICY "Allow YouTube cache inserts"
  ON youtube_trending_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow YouTube cache updates"
  ON youtube_trending_cache FOR UPDATE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_youtube_trending_game_id ON youtube_trending_cache(game_id);
CREATE INDEX IF NOT EXISTS idx_youtube_trending_score ON youtube_trending_cache(trending_score DESC);

-- 7. Priority Publishers table
CREATE TABLE IF NOT EXISTS priority_publishers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  publisher_name TEXT UNIQUE NOT NULL,
  publisher_slug TEXT,
  priority_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE priority_publishers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publishers are viewable by everyone"
  ON priority_publishers FOR SELECT
  USING (true);

-- Seed with known good publishers
INSERT INTO priority_publishers (publisher_name, publisher_slug, priority_score) VALUES
  ('Riot Games', 'riot-games', 100),
  ('Hypixel Studios', 'hypixel-studios', 100),
  ('Nintendo', 'nintendo', 95),
  ('Valve', 'valve', 95),
  ('Rockstar Games', 'rockstar-games', 95),
  ('FromSoftware', 'fromsoftware', 90),
  ('CD PROJEKT RED', 'cd-projekt-red', 90),
  ('Sony Interactive Entertainment', 'sony-interactive-entertainment', 90),
  ('Xbox Game Studios', 'xbox-game-studios', 90),
  ('Microsoft Studios', 'microsoft-studios', 90),
  ('Blizzard Entertainment', 'blizzard-entertainment', 85),
  ('Square Enix', 'square-enix', 85),
  ('Electronic Arts', 'electronic-arts', 85),
  ('Ubisoft', 'ubisoft', 85),
  ('Capcom', 'capcom', 85),
  ('Epic Games', 'epic-games', 85),
  ('Bethesda Softworks', 'bethesda-softworks', 85),
  ('SEGA', 'sega', 80),
  ('Activision', 'activision', 80),
  ('Take-Two Interactive', 'take-two-interactive', 80),
  ('Bandai Namco Entertainment', 'bandai-namco-entertainment', 80),
  ('Warner Bros. Games', 'warner-bros-games', 80),
  ('2K Games', '2k-games', 80),
  ('Devolver Digital', 'devolver-digital', 75),
  ('Team17', 'team17', 75)
ON CONFLICT (publisher_name) DO NOTHING;
