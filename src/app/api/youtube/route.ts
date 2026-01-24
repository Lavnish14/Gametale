import { NextRequest, NextResponse } from "next/server";

// Server-side only - API key is NOT exposed to client
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

// Types
interface YouTubeVideoStats {
    videoId: string;
    title: string;
    viewCount: number;
    publishedAt: string;
    channelTitle: string;
}

interface YouTubeSearchItem {
    id?: { videoId?: string };
    snippet?: {
        title?: string;
        publishedAt?: string;
        channelTitle?: string;
    };
}

interface YouTubeVideoItem {
    id: string;
    snippet?: {
        title?: string;
        publishedAt?: string;
        channelTitle?: string;
    };
    statistics?: {
        viewCount?: string;
    };
}

/**
 * Get ISO date string for N days ago
 */
function getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

/**
 * Normalize game name for comparison
 */
function normalizeGameName(gameName: string): string[] {
    return gameName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((word) => word.length > 2);
}

/**
 * Check if video title matches game name
 */
function isRelevantVideo(title: string, gameNameWords: string[], threshold = 0.5): boolean {
    const titleNormalized = title.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const matchingWords = gameNameWords.filter((word) => titleNormalized.includes(word));
    return matchingWords.length / gameNameWords.length >= threshold;
}

/**
 * Search YouTube for trailer
 */
async function searchTrailer(gameName: string): Promise<string | null> {
    const searchQueries = [
        `${gameName} official trailer`,
        `${gameName} gameplay trailer`,
        `${gameName} game trailer`,
        `${gameName} trailer`,
    ];

    const gameNameWords = normalizeGameName(gameName);

    for (const query of searchQueries) {
        try {
            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`,
                { next: { revalidate: 3600 } }
            );

            if (!res.ok) continue;

            const data = await res.json();
            if (!data.items?.length) continue;

            for (const item of data.items as YouTubeSearchItem[]) {
                const title = item.snippet?.title || "";
                if (isRelevantVideo(title, gameNameWords)) {
                    return item.id?.videoId || null;
                }
            }
        } catch {
            continue;
        }
    }

    return null;
}

/**
 * Search YouTube with statistics for trending analysis
 */
async function searchWithStats(
    query: string,
    gameName: string,
    maxResults: number
): Promise<YouTubeVideoStats[]> {
    try {
        const searchRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?` +
                `part=snippet&q=${encodeURIComponent(query)}&type=video&` +
                `maxResults=${maxResults}&order=viewCount&` +
                `publishedAfter=${getDateDaysAgo(30)}&` +
                `key=${YOUTUBE_API_KEY}`,
            { next: { revalidate: 1800 } }
        );

        if (!searchRes.ok) return [];

        const searchData = await searchRes.json();
        if (!searchData.items?.length) return [];

        const gameNameWords = normalizeGameName(gameName);
        const relevantVideos = (searchData.items as YouTubeSearchItem[]).filter((item) => {
            const title = item.snippet?.title || "";
            return isRelevantVideo(title, gameNameWords, 0.4);
        });

        if (!relevantVideos.length) return [];

        const videoIds = relevantVideos
            .map((v) => v.id?.videoId)
            .filter(Boolean)
            .join(",");

        const statsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?` +
                `part=statistics,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`,
            { next: { revalidate: 1800 } }
        );

        if (!statsRes.ok) return [];

        const statsData = await statsRes.json();
        if (!statsData.items) return [];

        return (statsData.items as YouTubeVideoItem[]).map((item) => ({
            videoId: item.id,
            title: item.snippet?.title || "",
            viewCount: parseInt(item.statistics?.viewCount || "0", 10),
            publishedAt: item.snippet?.publishedAt || "",
            channelTitle: item.snippet?.channelTitle || "",
        }));
    } catch {
        return [];
    }
}

/**
 * Check for gameplay videos (release detection)
 */
async function checkGameplayVideos(gameName: string) {
    const gameplayQueries = [
        `${gameName} full gameplay`,
        `${gameName} let's play part 1`,
        `${gameName} walkthrough part 1`,
        `${gameName} review gameplay`,
    ];

    const preReleaseTerms = [
        "preview",
        "demo",
        "beta",
        "alpha",
        "early access",
        "hands-on",
        "first look",
        "sneak peek",
        "announcement",
        "reveal",
        "leaked",
        "before release",
        "upcoming",
    ];

    let totalVideoCount = 0;
    let totalViews = 0;
    let confirmedReleaseVideos = 0;
    const seenIds = new Set<string>();
    const uniqueChannels = new Set<string>();

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    for (const query of gameplayQueries) {
        const videos = await searchWithStats(query, gameName, 8);
        for (const video of videos) {
            if (seenIds.has(video.videoId)) continue;
            seenIds.add(video.videoId);

            const titleLower = video.title.toLowerCase();
            const isPreRelease = preReleaseTerms.some((term) => titleLower.includes(term));
            if (isPreRelease) continue;

            const publishDate = new Date(video.publishedAt);
            if (publishDate >= fourteenDaysAgo) {
                totalVideoCount++;
                totalViews += video.viewCount;
                uniqueChannels.add(video.channelTitle);

                if (
                    titleLower.includes("part 1") ||
                    titleLower.includes("full") ||
                    titleLower.includes("complete") ||
                    titleLower.includes("100%") ||
                    titleLower.includes("ending")
                ) {
                    confirmedReleaseVideos++;
                }
            }
        }
    }

    const hasGameplay =
        (totalVideoCount >= 5 && uniqueChannels.size >= 3 && totalViews >= 50000) ||
        (confirmedReleaseVideos >= 2 && totalViews >= 20000);

    let confidence: "high" | "medium" | "low" = "low";
    if (hasGameplay && confirmedReleaseVideos >= 3 && uniqueChannels.size >= 5) {
        confidence = "high";
    } else if (hasGameplay) {
        confidence = "medium";
    }

    return {
        hasGameplay,
        videoCount: totalVideoCount,
        recentViews: totalViews,
        confidence,
    };
}

/**
 * Get trending score for a game
 */
async function getTrendingScore(gameName: string) {
    const searchQueries = [
        `${gameName} gameplay 2026`,
        `${gameName} review`,
        `${gameName} trailer`,
    ];

    const allVideos: YouTubeVideoStats[] = [];
    const seenIds = new Set<string>();

    for (const query of searchQueries) {
        const videos = await searchWithStats(query, gameName, 10);
        for (const video of videos) {
            if (!seenIds.has(video.videoId)) {
                seenIds.add(video.videoId);
                allVideos.push(video);
            }
        }
    }

    if (allVideos.length === 0) return null;

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentVideos = allVideos.filter((v) => new Date(v.publishedAt) >= fourteenDaysAgo);
    const veryRecentVideos = recentVideos.filter((v) => new Date(v.publishedAt) >= sevenDaysAgo);

    const gameplayCheck = await checkGameplayVideos(gameName);

    const totalViews = recentVideos.reduce((sum, v) => sum + v.viewCount, 0);
    const avgViews = recentVideos.length > 0 ? Math.floor(totalViews / recentVideos.length) : 0;

    const viewScore = totalViews > 0 ? Math.log10(totalViews) * 100 : 0;
    const volumeScore = Math.min(recentVideos.length * 20, 200);
    const recencyBonus = veryRecentVideos.length * 50;
    const trendingScore = Math.floor(viewScore + volumeScore + recencyBonus);

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
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const gameName = searchParams.get("gameName");

    if (!gameName) {
        return NextResponse.json({ error: "gameName is required" }, { status: 400 });
    }

    try {
        switch (action) {
            case "trailer": {
                const videoId = await searchTrailer(gameName);
                return NextResponse.json({ videoId });
            }
            case "gameplay-check": {
                const result = await checkGameplayVideos(gameName);
                return NextResponse.json(result);
            }
            case "trending": {
                const result = await getTrendingScore(gameName);
                return NextResponse.json(result);
            }
            default:
                // Default: search for any video (trailer first, then gameplay)
                const trailerId = await searchTrailer(gameName);
                if (trailerId) {
                    return NextResponse.json({ videoId: trailerId, type: "trailer" });
                }
                // Fallback to gameplay search
                const gameplayQueries = [`${gameName} gameplay`, `${gameName} gameplay 2026`];
                const gameNameWords = normalizeGameName(gameName);

                for (const query of gameplayQueries) {
                    const res = await fetch(
                        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`
                    );
                    if (!res.ok) continue;

                    const data = await res.json();
                    for (const item of (data.items || []) as YouTubeSearchItem[]) {
                        const title = item.snippet?.title || "";
                        if (isRelevantVideo(title, gameNameWords)) {
                            return NextResponse.json({
                                videoId: item.id?.videoId,
                                type: "gameplay",
                            });
                        }
                    }
                }

                return NextResponse.json({ videoId: null, type: null });
        }
    } catch (error) {
        return NextResponse.json(
            { error: "YouTube API error", details: String(error) },
            { status: 500 }
        );
    }
}
