const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

/**
 * Search YouTube for a game trailer with multiple fallback strategies
 * Priority: 
 * 1. "[GameName] gameplay trailer" 
 * 2. "[GameName] official trailer"
 * 3. "[GameName] trailer"
 * 4. null (will use HD image)
 */
export async function searchYoutubeVideo(gameName: string): Promise<string | null> {
    // List of search queries to try in order
    const searchQueries = [
        `${gameName} gameplay trailer`,
        `${gameName} official trailer`,
        `${gameName} game trailer`,
        `${gameName} trailer`
    ];

    for (const query of searchQueries) {
        const videoId = await tryYoutubeSearch(query, gameName);
        if (videoId) {
            return videoId;
        }
    }

    console.log(`No YouTube trailer found for: ${gameName}`);
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

            // Check if at least 60% of game name words are in the title
            const matchingWords = gameNameWords.filter(word => titleNormalized.includes(word));
            const matchRatio = matchingWords.length / gameNameWords.length;

            if (matchRatio >= 0.6) {
                console.log(`✓ Found YouTube trailer for "${gameName}": ${item.snippet?.title}`);
                return item.id?.videoId || null;
            }
        }

        return null;
    } catch (error) {
        console.warn(`YouTube search failed for query: ${query}`, error);
        return null;
    }
}
