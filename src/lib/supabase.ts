import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Supabase client with STRONG session persistence
// Session survives browser close, refresh, and multi-day gaps
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'gametale-auth', // Unique key prevents conflicts
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
});

// Database Types
export interface Profile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    created_at: string;
}

export interface WishlistItem {
    id: string;
    user_id: string;
    game_id: number;
    game_name: string;
    game_image: string | null;
    created_at: string;
}

export interface Comment {
    id: string;
    user_id: string;
    game_id: number;
    content: string;
    created_at: string;
    profile?: Profile;
}

export type RatingType = 'goat' | 'mid' | 'trash';

export type VoteReason = 'story' | 'gameplay' | 'graphics' | 'multiplayer' | 'value' | 'other';

export interface Review {
    id: string;
    user_id: string;
    game_id: number;
    rating: RatingType;
    reason?: VoteReason;
    created_at: string;
}

// Game Override types
export interface GameOverride {
    id: string;
    game_id: number;
    game_name: string;
    is_released: boolean | null;
    release_date: string | null;
    is_trending: boolean;
    trending_score: number;
    detected_via: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface YouTubeTrendingCache {
    id: string;
    game_id: number;
    game_name: string;
    total_views: number;
    video_count: number;
    avg_views_per_video: number;
    trending_score: number;
    has_gameplay_videos: boolean;
    last_updated: string;
}

export interface PriorityPublisher {
    id: string;
    publisher_name: string;
    publisher_slug: string | null;
    priority_score: number;
}

// Auth helpers
export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Wishlist functions
export async function addToWishlist(userId: string, game: { id: number; name: string; background_image: string }) {
    const { data, error } = await supabase
        .from("wishlists")
        .insert({
            user_id: userId,
            game_id: game.id,
            game_name: game.name,
            game_image: game.background_image,
        })
        .select()
        .single();
    return { data, error };
}

export async function removeFromWishlist(userId: string, gameId: number) {
    const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", userId)
        .eq("game_id", gameId);
    return { error };
}

export async function getWishlist(userId: string) {
    const { data, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    return { data: data as WishlistItem[] | null, error };
}

export async function isInWishlist(userId: string, gameId: number) {
    const { data } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", gameId)
        .single();
    return !!data;
}

// Comments functions
export async function getComments(gameId: number) {
    const { data, error } = await supabase
        .from("comments")
        .select(`*, profile:profiles(*)`)
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });
    return { data: data as Comment[] | null, error };
}

export async function addComment(userId: string, gameId: number, content: string) {
    const { data, error } = await supabase
        .from("comments")
        .insert({ user_id: userId, game_id: gameId, content })
        .select()
        .single();
    return { data, error };
}

// Reviews functions
export async function getReview(userId: string, gameId: number) {
    const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", userId)
        .eq("game_id", gameId)
        .single();
    return { data: data as Review | null, error };
}

export async function upsertReview(
    userId: string,
    gameId: number,
    rating: RatingType,
    reason?: VoteReason
) {
    const { data, error } = await supabase
        .from("reviews")
        .upsert({
            user_id: userId,
            game_id: gameId,
            rating,
            reason,
        }, {
            onConflict: "user_id,game_id",
        })
        .select()
        .single();
    return { data, error };
}

export async function getRatingDistribution(gameId: number) {
    const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("game_id", gameId);

    if (error || !data?.length) return null;

    const counts = { goat: 0, mid: 0, trash: 0 };
    data.forEach((r) => {
        if (r.rating in counts) {
            counts[r.rating as RatingType]++;
        }
    });

    return {
        goat: counts.goat,
        mid: counts.mid,
        trash: counts.trash,
        total: data.length,
    };
}

// Realtime subscription for comments
export function subscribeToComments(gameId: number, callback: (comment: Comment) => void) {
    return supabase
        .channel(`comments:${gameId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "comments",
                filter: `game_id=eq.${gameId}`,
            },
            (payload) => {
                callback(payload.new as Comment);
            }
        )
        .subscribe();
}

// ============================================
// Game Overrides functions (auto-detection)
// ============================================

export async function getGameOverride(gameId: number): Promise<GameOverride | null> {
    const { data } = await supabase
        .from("game_overrides")
        .select("*")
        .eq("game_id", gameId)
        .single();
    return data;
}

export async function getGameOverrides(gameIds: number[]): Promise<Map<number, GameOverride>> {
    if (gameIds.length === 0) return new Map();

    const { data } = await supabase
        .from("game_overrides")
        .select("*")
        .in("game_id", gameIds);

    const map = new Map<number, GameOverride>();
    data?.forEach(override => map.set(override.game_id, override));
    return map;
}

export async function upsertGameOverride(
    gameId: number,
    gameName: string,
    updates: {
        is_released?: boolean;
        release_date?: string;
        is_trending?: boolean;
        trending_score?: number;
        detected_via?: string;
        notes?: string;
    }
) {
    const { data, error } = await supabase
        .from("game_overrides")
        .upsert({
            game_id: gameId,
            game_name: gameName,
            ...updates,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: "game_id",
        })
        .select()
        .single();

    return { data, error };
}

// ============================================
// YouTube Trending Cache functions
// ============================================

export async function getYouTubeTrendingCache(gameId: number): Promise<YouTubeTrendingCache | null> {
    const { data } = await supabase
        .from("youtube_trending_cache")
        .select("*")
        .eq("game_id", gameId)
        .single();
    return data;
}

export async function getYouTubeTrendingScores(gameIds: number[]): Promise<Map<number, YouTubeTrendingCache>> {
    if (gameIds.length === 0) return new Map();

    const { data } = await supabase
        .from("youtube_trending_cache")
        .select("*")
        .in("game_id", gameIds);

    const map = new Map<number, YouTubeTrendingCache>();
    data?.forEach(cache => map.set(cache.game_id, cache));
    return map;
}

export async function upsertYouTubeTrendingCache(
    gameId: number,
    gameName: string,
    stats: {
        totalViews: number;
        videoCount: number;
        trendingScore: number;
        hasGameplayVideos: boolean;
    }
) {
    const avgViews = stats.videoCount > 0 ? Math.floor(stats.totalViews / stats.videoCount) : 0;

    const { data, error } = await supabase
        .from("youtube_trending_cache")
        .upsert({
            game_id: gameId,
            game_name: gameName,
            total_views: stats.totalViews,
            video_count: stats.videoCount,
            avg_views_per_video: avgViews,
            trending_score: stats.trendingScore,
            has_gameplay_videos: stats.hasGameplayVideos,
            last_updated: new Date().toISOString(),
        }, {
            onConflict: "game_id",
        })
        .select()
        .single();

    return { data, error };
}

// ============================================
// Priority Publishers functions
// ============================================

export async function getPriorityPublishers(): Promise<PriorityPublisher[]> {
    const { data } = await supabase
        .from("priority_publishers")
        .select("*")
        .order("priority_score", { ascending: false });
    return data || [];
}

export async function getPublisherPriority(publisherName: string): Promise<number> {
    const { data } = await supabase
        .from("priority_publishers")
        .select("priority_score")
        .ilike("publisher_name", publisherName)
        .single();

    return data?.priority_score || 0;
}

// ============================================
// Reason Distribution for Votes
// ============================================

export async function getReasonDistribution(gameId: number) {
    const { data, error } = await supabase
        .from("reviews")
        .select("rating, reason")
        .eq("game_id", gameId);

    if (error || !data?.length) return null;

    const reasons: Record<VoteReason, number> = {
        story: 0,
        gameplay: 0,
        graphics: 0,
        multiplayer: 0,
        value: 0,
        other: 0
    };

    data.forEach((r) => {
        if (r.reason && r.reason in reasons) {
            reasons[r.reason as VoteReason]++;
        }
    });

    // Find top reason for GOAT votes
    const goatReasons = data.filter(r => r.rating === 'goat' && r.reason);
    let topGoatReason: { reason: string; count: number } | null = null;

    if (goatReasons.length > 0) {
        const goatReasonCounts: Record<string, number> = {};
        goatReasons.forEach(r => {
            if (r.reason) goatReasonCounts[r.reason] = (goatReasonCounts[r.reason] || 0) + 1;
        });
        const sorted = Object.entries(goatReasonCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
            topGoatReason = { reason: sorted[0][0], count: sorted[0][1] };
        }
    }

    return {
        reasons,
        total: data.length,
        topGoatReason
    };
}

// ============================================
// Vibe Tags Types & Functions
// ============================================

export type VibeTag = 'cozy' | 'sweaty' | 'story-heavy' | 'brain-off' | 'grindy' | 'chill' | 'competitive' | 'relaxing' | 'intense' | 'funny';

export interface GameVibeTag {
    id: string;
    game_id: number;
    user_id: string;
    tag: VibeTag;
    created_at: string;
}

export const VIBE_TAGS_CONFIG = {
    cozy: { label: "Cozy", emoji: "🛋️", color: "#f59e0b" },
    sweaty: { label: "Sweaty", emoji: "😤", color: "#ef4444" },
    "story-heavy": { label: "Story-heavy", emoji: "📚", color: "#8b5cf6" },
    "brain-off": { label: "Brain-off", emoji: "🍿", color: "#22c55e" },
    grindy: { label: "Grindy", emoji: "⚙️", color: "#6b7280" },
    chill: { label: "Chill", emoji: "😌", color: "#06b6d4" },
    competitive: { label: "Competitive", emoji: "🏆", color: "#f97316" },
    relaxing: { label: "Relaxing", emoji: "🧘", color: "#a855f7" },
    intense: { label: "Intense", emoji: "🔥", color: "#dc2626" },
    funny: { label: "Funny", emoji: "😂", color: "#eab308" },
} as const;

export async function getGameVibeTags(gameId: number) {
    const { data, error } = await supabase
        .from("vibe_tags")
        .select("tag")
        .eq("game_id", gameId);

    if (error || !data) return [];

    // Count occurrences
    const counts: Record<string, number> = {};
    data.forEach((item) => {
        counts[item.tag] = (counts[item.tag] || 0) + 1;
    });

    // Sort by count
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => ({ tag: tag as VibeTag, count }));
}

export async function getUserVibeTags(userId: string, gameId: number) {
    const { data } = await supabase
        .from("vibe_tags")
        .select("tag")
        .eq("user_id", userId)
        .eq("game_id", gameId);

    return data?.map((d) => d.tag as VibeTag) || [];
}

export async function toggleVibeTag(userId: string, gameId: number, tag: VibeTag) {
    // Check if exists
    const { data: existing } = await supabase
        .from("vibe_tags")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", gameId)
        .eq("tag", tag)
        .single();

    if (existing) {
        // Remove
        await supabase.from("vibe_tags").delete().eq("id", existing.id);
        return { added: false };
    } else {
        // Add
        await supabase.from("vibe_tags").insert({ user_id: userId, game_id: gameId, tag });
        return { added: true };
    }
}

// ============================================
// Collections Types & Functions
// ============================================

export interface Collection {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    item_count?: number;
    items?: CollectionItem[];
}

export interface CollectionItem {
    id: string;
    collection_id: string;
    game_id: number;
    game_name: string;
    game_image?: string;
    added_at: string;
}

export async function getUserCollections(userId: string) {
    const { data, error } = await supabase
        .from("collections")
        .select(`
            *,
            items:collection_items(count)
        `)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

    return { data: data as Collection[] | null, error };
}

export async function getCollection(collectionId: string) {
    const { data, error } = await supabase
        .from("collections")
        .select(`
            *,
            items:collection_items(*)
        `)
        .eq("id", collectionId)
        .single();

    return { data: data as Collection | null, error };
}

export async function createCollection(userId: string, name: string, description?: string) {
    const { data, error } = await supabase
        .from("collections")
        .insert({ user_id: userId, name, description })
        .select()
        .single();

    return { data, error };
}

export async function addToCollection(
    collectionId: string,
    game: { id: number; name: string; background_image?: string }
) {
    const { data, error } = await supabase
        .from("collection_items")
        .insert({
            collection_id: collectionId,
            game_id: game.id,
            game_name: game.name,
            game_image: game.background_image,
        })
        .select()
        .single();

    // Update collection timestamp
    await supabase
        .from("collections")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", collectionId);

    return { data, error };
}

export async function removeFromCollection(collectionId: string, gameId: number) {
    const { error } = await supabase
        .from("collection_items")
        .delete()
        .eq("collection_id", collectionId)
        .eq("game_id", gameId);

    return { error };
}

export async function deleteCollection(collectionId: string) {
    const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", collectionId);

    return { error };
}

export async function getPublicCollections(limit = 10) {
    const { data, error } = await supabase
        .from("collections")
        .select(`
            *,
            items:collection_items(game_id, game_name, game_image)
        `)
        .eq("is_public", true)
        .order("updated_at", { ascending: false })
        .limit(limit);

    return { data: data as Collection[] | null, error };
}

// ============================================
// Game Recommendations Types & Functions
// ============================================

export interface GameRecommendation {
    id: string;
    game_id: number;
    recommended_game_id: number;
    user_id: string;
    reason?: string;
    upvotes: number;
    created_at: string;
}

export async function getGameRecommendations(gameId: number) {
    const { data } = await supabase
        .from("game_recommendations")
        .select("*")
        .eq("game_id", gameId)
        .order("upvotes", { ascending: false })
        .limit(5);

    return data || [];
}

export async function addRecommendation(
    userId: string,
    gameId: number,
    recommendedGameId: number,
    reason?: string
) {
    const { data, error } = await supabase
        .from("game_recommendations")
        .insert({
            user_id: userId,
            game_id: gameId,
            recommended_game_id: recommendedGameId,
            reason,
        })
        .select()
        .single();

    return { data, error };
}

