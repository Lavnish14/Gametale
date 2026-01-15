const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

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

/**
 * Search YouTube for a game trailer with multiple fallback strategies
 * Priority: 
 * 1. "[GameName] official trailer" (best quality, official source)
 * 2. "[GameName] gameplay trailer" 
 * 3. "[GameName] trailer"
 * 4. null (caller will try gameplay video search or fallback to RAWG/image)
 */
export async function searchYoutubeTrailer(gameName: string): Promise<string | null> {
    // List of search queries for TRAILERS specifically
    const searchQueries = [
        `${gameName} official trailer`,
        `${gameName} gameplay trailer`,
        `${gameName} game trailer`,
        `${gameName} trailer 2026`,
        `${gameName} trailer`
    ];

    for (const query of searchQueries) {
        const videoId = await tryYoutubeSearch(query, gameName);
        if (videoId) {
            console.log(`✓ Found YouTube TRAILER for "${gameName}"`);
            return videoId;
        }
    }

    console.log(`No YouTube trailer found for: ${gameName}`);
    return null;
}

/**
 * Search YouTube for gameplay video (fallback when no trailer found)
 * Used when trailer search fails
 */
export async function searchYoutubeGameplay(gameName: string): Promise<string | null> {
    // List of search queries for GAMEPLAY specifically
    const searchQueries = [
        `${gameName} gameplay`,
        `${gameName} gameplay 2026`,
        `${gameName} game walkthrough`,
        `${gameName} let's play`
    ];

    for (const query of searchQueries) {
        const videoId = await tryYoutubeSearch(query, gameName);
        if (videoId) {
            console.log(`✓ Found YouTube GAMEPLAY for "${gameName}"`);
            return videoId;
        }
    }

    console.log(`No YouTube gameplay found for: ${gameName}`);
    return null;
}

/**
 * Legacy function - searches for any video (trailer or gameplay)
 * Kept for backwards compatibility
 */
export async function searchYoutubeVideo(gameName: string): Promise<string | null> {
    // First try trailers
    const trailerId = await searchYoutubeTrailer(gameName);
    if (trailerId) return trailerId;

    // Then try gameplay
    const gameplayId = await searchYoutubeGameplay(gameName);
    if (gameplayId) return gameplayId;

    return null;
}

/**
 * Attempt a YouTube search and validate results contain the game name
 */
async function tryYoutubeSearch(query: string, gameName: string): Promise<string | null> {
    try {
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`
        );
        const data = await res.json();

        if (!data.items || data.items.length === 0) {
            return null;
        }

        // Normalize game name for comparison (handle special chars, lowercase)
        const gameNameWords = gameName.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special chars
            .split(/\s+/)
            .filter(word => word.length > 2); // Only significant words

        // Find a video where title contains most of the game name words
        for (const item of data.items) {
            const title = item.snippet?.title?.toLowerCase() || "";
            const titleNormalized = title.replace(/[^a-z0-9\s]/g, '');

            // Check if at least 50% of game name words are in the title (relaxed from 60%)
            const matchingWords = gameNameWords.filter(word => titleNormalized.includes(word));
            const matchRatio = matchingWords.length / gameNameWords.length;

            if (matchRatio >= 0.5) {
                console.log(`  ✓ Match found: ${item.snippet?.title}`);
                return item.id?.videoId || null;
            }
        }

        return null;
    } catch (error) {
        console.warn(`YouTube search failed for query: ${query}`, error);
        return null;
    }
}

// ============================================
// YouTube Trending Score & Auto-Detection
// ============================================

/**
 * Get ISO date string for N days ago
 */
function getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

/**
 * Check if a game has gameplay videos on YouTube (indicates it's released)
 * This is the key function for AUTO-DETECTING release status
 */
export async function checkForGameplayVideos(gameName: string): Promise<{
    hasGameplay: boolean;
    videoCount: number;
    recentViews: number;
}> {
    try {
        // Search for gameplay/let's play videos (not just trailers)
        const gameplayQueries = [
            `${gameName} gameplay`,
            `${gameName} let's play`,
            `${gameName} walkthrough`,
        ];

        let totalVideoCount = 0;
        let totalViews = 0;
        const seenIds = new Set<string>();

        for (const query of gameplayQueries) {
            const result = await searchYouTubeWithStats(query, gameName, 5);
            for (const video of result) {
                if (!seenIds.has(video.videoId)) {
                    seenIds.add(video.videoId);
                    // Only count recent videos (last 30 days)
                    const publishDate = new Date(video.publishedAt);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    if (publishDate >= thirtyDaysAgo) {
                        totalVideoCount++;
                        totalViews += video.viewCount;
                    }
                }
            }
        }

        // If we found at least 3 gameplay videos with decent views, game is released
        const hasGameplay = totalVideoCount >= 3 && totalViews >= 10000;

        console.log(`[YouTube Detection] ${gameName}: ${totalVideoCount} gameplay videos, ${totalViews} views, hasGameplay: ${hasGameplay}`);

        return {
            hasGameplay,
            videoCount: totalVideoCount,
            recentViews: totalViews,
        };
    } catch (error) {
        console.error(`YouTube gameplay check failed for ${gameName}:`, error);
        return { hasGameplay: false, videoCount: 0, recentViews: 0 };
    }
}

/**
 * Get trending score for a game based on YouTube activity
 * Used for Today's Pick and Trending This Week
 */
export async function getYouTubeTrendingScore(gameName: string): Promise<YouTubeTrendingResult | null> {
    try {
        const searchQueries = [
            `${gameName} gameplay 2026`,
            `${gameName} review`,
            `${gameName} trailer`,
        ];

        const allVideos: YouTubeVideoStats[] = [];
        const seenIds = new Set<string>();

        for (const query of searchQueries) {
            const videos = await searchYouTubeWithStats(query, gameName, 10);
            for (const video of videos) {
                if (!seenIds.has(video.videoId)) {
                    seenIds.add(video.videoId);
                    allVideos.push(video);
                }
            }
        }

        if (allVideos.length === 0) {
            return null;
        }

        // Filter to recent videos (last 14 days for trending)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentVideos = allVideos.filter(v =>
            new Date(v.publishedAt) >= fourteenDaysAgo
        );

        const veryRecentVideos = recentVideos.filter(v =>
            new Date(v.publishedAt) >= sevenDaysAgo
        );

        // Check for gameplay videos specifically
        const gameplayCheck = await checkForGameplayVideos(gameName);

        // Calculate metrics
        const totalViews = recentVideos.reduce((sum, v) => sum + v.viewCount, 0);
        const avgViews = recentVideos.length > 0 ? Math.floor(totalViews / recentVideos.length) : 0;

        // Calculate trending score (0-1000 scale)
        // Formula: log10(totalViews) * 100 + videoCount * 20 + recencyBonus * 50
        const viewScore = totalViews > 0 ? Math.log10(totalViews) * 100 : 0;
        const volumeScore = Math.min(recentVideos.length * 20, 200);
        const recencyBonus = veryRecentVideos.length * 50;

        const trendingScore = Math.floor(viewScore + volumeScore + recencyBonus);

        console.log(`[YouTube Trending] ${gameName}: score=${trendingScore}, views=${totalViews}, videos=${recentVideos.length}`);

        return {
            gameName,
            totalViews,
            videoCount: recentVideos.length,
            recentVideoCount: veryRecentVideos.length,
            avgViewsPerVideo: avgViews,
            trendingScore,
            hasGameplayVideos: gameplayCheck.hasGameplay,
            videos: recentVideos.slice(0, 5),
        };
    } catch (error) {
        console.error(`YouTube trending check failed for ${gameName}:`, error);
        return null;
    }
}

/**
 * Search YouTube and get video statistics
 */
async function searchYouTubeWithStats(
    query: string,
    gameName: string,
    maxResults: number
): Promise<YouTubeVideoStats[]> {
    try {
        // Step 1: Search for videos
        const searchRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?` +
            `part=snippet&q=${encodeURIComponent(query)}&type=video&` +
            `maxResults=${maxResults}&order=viewCount&` +
            `publishedAfter=${getDateDaysAgo(30)}&` +
            `key=${YOUTUBE_API_KEY}`
        );
        const searchData = await searchRes.json();

        if (!searchData.items || searchData.items.length === 0) {
            return [];
        }

        // Filter by game name relevance
        const gameNameWords = gameName.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const relevantVideos = searchData.items.filter((item: any) => {
            const title = item.snippet?.title?.toLowerCase() || "";
            const titleNormalized = title.replace(/[^a-z0-9\s]/g, '');
            const matchingWords = gameNameWords.filter(word => titleNormalized.includes(word));
            return matchingWords.length / gameNameWords.length >= 0.4;
        });

        if (relevantVideos.length === 0) {
            return [];
        }

        // Step 2: Get video statistics
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const videoIds = relevantVideos.map((v: any) => v.id?.videoId).filter(Boolean).join(',');

        const statsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?` +
            `part=statistics,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );
        const statsData = await statsRes.json();

        if (!statsData.items) {
            return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return statsData.items.map((item: any) => ({
            videoId: item.id,
            title: item.snippet?.title || "",
            viewCount: parseInt(item.statistics?.viewCount || "0", 10),
            publishedAt: item.snippet?.publishedAt || "",
            channelTitle: item.snippet?.channelTitle || "",
        }));
    } catch (error) {
        console.warn(`YouTube stats search failed for: ${query}`, error);
        return [];
    }
}

/**
 * Batch check trending scores for multiple games
 */
export async function batchCheckYouTubeTrending(
    games: Array<{ id: number; name: string }>
): Promise<Map<number, YouTubeTrendingResult>> {
    const results = new Map<number, YouTubeTrendingResult>();

    // Process in batches to avoid rate limits
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

        // Small delay between batches to respect rate limits
        if (i + batchSize < games.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return results;
}
