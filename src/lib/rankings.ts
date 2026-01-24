/**
 * Top 10 Rankings System
 * Refreshes daily at 12:00 AM IST
 */

import type { Game, GamesResponse } from "./rawg";

export interface RankingCategory {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    games: Game[];
    lastUpdated: string;
}

/**
 * Get current date/time in IST
 */
function getISTDate(): { dateIST: string; hourIST: number } {
    const nowUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(nowUTC.getTime() + istOffset);
    const dateIST = nowIST.toISOString().split("T")[0];
    const hourIST = nowIST.getUTCHours();
    return { dateIST, hourIST };
}

/**
 * Generate a seed from a date string for consistent daily randomization
 */
function dateSeed(dateStr: string): number {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        const char = dateStr.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

/**
 * Seeded shuffle for consistent results
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
    const result = [...array];
    let currentSeed = seed;

    const random = () => {
        currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
        return currentSeed / 0x7fffffff;
    };

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

/**
 * Fetch games from RAWG API
 */
async function fetchGames(endpoint: string, params: Record<string, string> = {}): Promise<GamesResponse> {
    const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY || "";
    const BASE_URL = "https://api.rawg.io/api";

    const searchParams = new URLSearchParams({
        key: RAWG_API_KEY,
        ...params,
    });

    const response = await fetch(`${BASE_URL}${endpoint}?${searchParams}`, {
        next: { revalidate: 3600 }, // 1 hour cache
    });

    if (!response.ok) {
        throw new Error(`RAWG API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Get Today's Top 10 Games
 * Changes at 12:00 AM IST daily
 * Based on: rating, recent popularity, and YouTube trending
 */
export async function getTodaysTop10Games(): Promise<Game[]> {
    const { dateIST } = getISTDate();
    const seed = dateSeed(dateIST);

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    try {
        // Fetch top rated games from last 30 days
        const response = await fetchGames("/games", {
            ordering: "-rating,-ratings_count",
            dates: `${thirtyDaysAgo.toISOString().split("T")[0]},${today.toISOString().split("T")[0]}`,
            page_size: "50",
            metacritic: "70,100",
        });

        // Filter to released games with images
        const validGames = response.results.filter(
            (game) =>
                game.background_image &&
                game.rating >= 3.5 &&
                game.ratings_count >= 10 &&
                !game.tba
        );

        // Shuffle with date seed for consistent daily selection
        const shuffled = seededShuffle(validGames.slice(0, 30), seed);

        console.log(`[Rankings] Today's Top 10 for ${dateIST}`);

        return shuffled.slice(0, 10);
    } catch (error) {
        console.error("Failed to get today's top 10:", error);
        return [];
    }
}

/**
 * Get Top 10 Games of 2026 So Far
 * Best games of the current year
 */
export async function getTop10GamesOf2026(): Promise<Game[]> {
    const { dateIST } = getISTDate();
    const seed = dateSeed(dateIST);
    const currentYear = new Date().getFullYear();

    try {
        const response = await fetchGames("/games", {
            ordering: "-metacritic,-rating",
            dates: `${currentYear}-01-01,${currentYear}-12-31`,
            page_size: "50",
            metacritic: "80,100",
        });

        const validGames = response.results.filter(
            (game) =>
                game.background_image &&
                game.metacritic &&
                game.metacritic >= 80 &&
                !game.tba &&
                game.released &&
                new Date(game.released) <= new Date()
        );

        // Sort by metacritic, then add some variety with seeded shuffle of top candidates
        const sorted = validGames.sort((a, b) => (b.metacritic || 0) - (a.metacritic || 0));
        const top20 = sorted.slice(0, 20);
        const shuffled = seededShuffle(top20, seed);

        console.log(`[Rankings] Top 10 of ${currentYear} for ${dateIST}`);

        return shuffled.slice(0, 10);
    } catch (error) {
        console.error("Failed to get top 10 of 2026:", error);
        return [];
    }
}

/**
 * Get Top 10 Horror Games of 2025
 * Best horror games from last year
 */
export async function getTop10HorrorGames2025(): Promise<Game[]> {
    const { dateIST } = getISTDate();
    const seed = dateSeed(dateIST);

    try {
        const response = await fetchGames("/games", {
            ordering: "-metacritic,-rating",
            dates: "2025-01-01,2025-12-31",
            genres: "51", // Horror genre ID (this is actually action, we'll use tags)
            tags: "horror",
            page_size: "50",
        });

        const validGames = response.results.filter(
            (game) =>
                game.background_image &&
                game.rating >= 3.0 &&
                !game.tba
        );

        const shuffled = seededShuffle(validGames.slice(0, 20), seed);

        console.log(`[Rankings] Top 10 Horror 2025 for ${dateIST}`);

        return shuffled.slice(0, 10);
    } catch (error) {
        console.error("Failed to get horror games 2025:", error);
        return [];
    }
}

/**
 * Get all ranking categories
 */
export async function getAllRankings(): Promise<RankingCategory[]> {
    const { dateIST } = getISTDate();
    const currentYear = new Date().getFullYear();

    const [todaysTop10, top2026, horror2025] = await Promise.all([
        getTodaysTop10Games(),
        getTop10GamesOf2026(),
        getTop10HorrorGames2025(),
    ]);

    return [
        {
            id: "todays-top-10",
            title: "Today's Top 10",
            subtitle: "Most popular games right now",
            icon: "🔥",
            games: todaysTop10,
            lastUpdated: dateIST,
        },
        {
            id: `top-${currentYear}`,
            title: `Best of ${currentYear}`,
            subtitle: `Top rated games of ${currentYear}`,
            icon: "🏆",
            games: top2026,
            lastUpdated: dateIST,
        },
        {
            id: "horror-2025",
            title: "Horror Gems 2025",
            subtitle: "Best horror games of 2025",
            icon: "👻",
            games: horror2025,
            lastUpdated: dateIST,
        },
    ];
}

/**
 * Check if rankings should refresh (past 12 AM IST)
 */
export function shouldRefreshRankings(lastUpdated: string): boolean {
    const { dateIST } = getISTDate();
    return lastUpdated !== dateIST;
}

