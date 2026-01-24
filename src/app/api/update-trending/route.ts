import { NextResponse } from "next/server";
import { getTrendingGames, getUpcomingGames } from "@/lib/rawg";
import { batchCheckYouTubeTrending } from "@/lib/youtube";
import { upsertYouTubeTrendingCache } from "@/lib/supabase";

/**
 * API route to update YouTube trending cache
 * Call this periodically (e.g., every 6 hours via cron or Vercel cron)
 *
 * GET /api/update-trending?token=YOUR_SECRET
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // Verify secret token for security
    const expectedToken = process.env.CRON_SECRET;
    if (expectedToken && token !== expectedToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("[Update Trending] Starting cache update...");

        // Get recent and upcoming games to update
        const [trending, upcoming] = await Promise.all([
            getTrendingGames(1, 20),
            getUpcomingGames(1, 10),
        ]);

        const gamesToUpdate = [
            ...trending.results.map(g => ({ id: g.id, name: g.name })),
            ...upcoming.results.map(g => ({ id: g.id, name: g.name })),
        ];

        // Remove duplicates
        const uniqueGames = Array.from(
            new Map(gamesToUpdate.map(g => [g.id, g])).values()
        );

        console.log(`[Update Trending] Checking ${uniqueGames.length} games...`);

        // Batch update YouTube trending scores
        const results = await batchCheckYouTubeTrending(uniqueGames);

        // Save to cache
        let savedCount = 0;
        for (const [gameId, result] of results) {
            const { error } = await upsertYouTubeTrendingCache(gameId, result.gameName, {
                totalViews: result.totalViews,
                videoCount: result.videoCount,
                trendingScore: result.trendingScore,
                hasGameplayVideos: result.hasGameplayVideos,
            });
            if (!error) savedCount++;
        }

        console.log(`[Update Trending] Updated ${savedCount} games`);

        return NextResponse.json({
            success: true,
            checked: uniqueGames.length,
            updated: savedCount,
            games: Array.from(results.entries()).map(([id, r]) => ({
                id,
                name: r.gameName,
                score: r.trendingScore,
                hasGameplay: r.hasGameplayVideos,
            })),
        });
    } catch (error) {
        console.error("[Update Trending] Failed:", error);
        return NextResponse.json(
            { error: "Update failed", details: String(error) },
            { status: 500 }
        );
    }
}

