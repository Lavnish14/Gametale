// Client-side YouTube utilities
// All API calls go through server-side route to protect API keys

// Types for YouTube trending analysis
export interface YouTubeVideoStats {
    videoId: string;
    title: string;
    viewCount: number;
    publishedAt: string;
    channelTitle: string;
}

export interface YouTubeTrendingResult {
    gameName: string;
    totalViews: number;
    videoCount: number;
    recentVideoCount: number;
    avgViewsPerVideo: number;
    trendingScore: number;
    hasGameplayVideos: boolean;
    videos: YouTubeVideoStats[];
}

export interface GameplayCheckResult {
    hasGameplay: boolean;
    videoCount: number;
    recentViews: number;
    confidence: "high" | "medium" | "low";
}

/**
 * Search YouTube for a game video (trailer or gameplay)
 * Uses server-side API route to protect API key
 */
export async function searchYoutubeVideo(gameName: string): Promise<string | null> {
    try {
        const res = await fetch(
            `/api/youtube?gameName=${encodeURIComponent(gameName)}`
        );
        if (!res.ok) return null;

        const data = await res.json();
        return data.videoId || null;
    } catch {
        return null;
    }
}

/**
 * Search YouTube for a game trailer specifically
 * Uses server-side API route to protect API key
 */
export async function searchYoutubeTrailer(gameName: string): Promise<string | null> {
    try {
        const res = await fetch(
            `/api/youtube?action=trailer&gameName=${encodeURIComponent(gameName)}`
        );
        if (!res.ok) return null;

        const data = await res.json();
        return data.videoId || null;
    } catch {
        return null;
    }
}

/**
 * Search YouTube for gameplay video
 * Uses server-side API route to protect API key
 */
export async function searchYoutubeGameplay(gameName: string): Promise<string | null> {
    try {
        const res = await fetch(
            `/api/youtube?gameName=${encodeURIComponent(gameName)}`
        );
        if (!res.ok) return null;

        const data = await res.json();
        // Only return if it's gameplay type
        if (data.type === "gameplay") {
            return data.videoId || null;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Check if a game has gameplay videos on YouTube (indicates it's released)
 * Uses server-side API route to protect API key
 */
export async function checkForGameplayVideos(gameName: string): Promise<GameplayCheckResult> {
    try {
        const res = await fetch(
            `/api/youtube?action=gameplay-check&gameName=${encodeURIComponent(gameName)}`
        );
        if (!res.ok) {
            return { hasGameplay: false, videoCount: 0, recentViews: 0, confidence: "low" };
        }

        return await res.json();
    } catch {
        return { hasGameplay: false, videoCount: 0, recentViews: 0, confidence: "low" };
    }
}

/**
 * Get trending score for a game based on YouTube activity
 * Uses server-side API route to protect API key
 */
export async function getYouTubeTrendingScore(
    gameName: string
): Promise<YouTubeTrendingResult | null> {
    try {
        const res = await fetch(
            `/api/youtube?action=trending&gameName=${encodeURIComponent(gameName)}`
        );
        if (!res.ok) return null;

        const data = await res.json();
        if (!data || data.error) return null;

        return data;
    } catch {
        return null;
    }
}

/**
 * Batch check trending scores for multiple games
 */
export async function batchCheckYouTubeTrending(
    games: Array<{ id: number; name: string }>
): Promise<Map<number, YouTubeTrendingResult>> {
    const results = new Map<number, YouTubeTrendingResult>();

    // Process in batches to avoid overwhelming the server
    const batchSize = 3;
    for (let i = 0; i < games.length; i += batchSize) {
        const batch = games.slice(i, i + batchSize);

        const batchResults = await Promise.all(
            batch.map(async (game) => {
                const result = await getYouTubeTrendingScore(game.name);
                return { gameId: game.id, result };
            })
        );

        for (const { gameId, result } of batchResults) {
            if (result) {
                results.set(gameId, result);
            }
        }

        // Small delay between batches
        if (i + batchSize < games.length) {
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    }

    return results;
}
