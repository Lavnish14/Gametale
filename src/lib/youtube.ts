const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

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
