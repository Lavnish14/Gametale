-- GameTale Feature Migrations
-- Run this SQL in your Supabase SQL Editor
-- https://eyeywkvxdfxdjfpyyufi.supabase.co

-- ============================================
-- FEATURE 1: Reason with Vote
-- ============================================

-- Add reason column to reviews table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS reason TEXT CHECK (reason IN ('story', 'gameplay', 'graphics', 'multiplayer', 'value', 'other'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_game_reason ON reviews(game_id, reason);

-- ============================================
-- FEATURE 2: Vibe Tags
-- ============================================

-- Create vibe_tags table
CREATE TABLE IF NOT EXISTS vibe_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tag TEXT NOT NULL CHECK (tag IN ('cozy', 'sweaty', 'story-heavy', 'brain-off', 'grindy', 'chill', 'competitive', 'relaxing', 'intense', 'funny')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, user_id, tag)
);

-- Enable RLS
ALTER TABLE vibe_tags ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view vibe tags" ON vibe_tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert vibe tags" ON vibe_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own vibe tags" ON vibe_tags FOR DELETE USING (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_vibe_tags_game ON vibe_tags(game_id);

-- ============================================
-- FEATURE 3: User Collections
-- ============================================

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection items
CREATE TABLE IF NOT EXISTS collection_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL,
    game_name TEXT NOT NULL,
    game_image TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, game_id)
);

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Policies for collections
CREATE POLICY "Public collections visible to all" ON collections
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create collections" ON collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON collections
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON collections
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for collection items
CREATE POLICY "Items in public collections visible" ON collection_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections
            WHERE collections.id = collection_items.collection_id
            AND (collections.is_public = true OR collections.user_id = auth.uid())
        )
    );
CREATE POLICY "Users can add to own collections" ON collection_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM collections
            WHERE collections.id = collection_items.collection_id
            AND collections.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can remove from own collections" ON collection_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM collections
            WHERE collections.id = collection_items.collection_id
            AND collections.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);

-- ============================================
-- FEATURE 4: Similar To / Recommendations
-- ============================================

-- User recommendations
CREATE TABLE IF NOT EXISTS game_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id INTEGER NOT NULL,
    recommended_game_id INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, recommended_game_id, user_id)
);

-- Enable RLS
ALTER TABLE game_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recommendations" ON game_recommendations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create recommendations" ON game_recommendations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_recommendations_game ON game_recommendations(game_id);
