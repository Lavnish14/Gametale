import {
    getGameOverride,
    getGameOverrides,
    upsertGameOverride,
    getYouTubeTrendingCache,
    getYouTubeTrendingScores,
    upsertYouTubeTrendingCache,
    getPriorityPublishers,
    type GameOverride,
} from "./supabase";
import { checkForGameplayVideos, getYouTubeTrendingScore } from "./youtube";

const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY || "";
const BASE_URL = "https://api.rawg.io/api";

// Types
export interface Game {
    id: number;
    slug: string;
    name: string;
    released: string;
    background_image: string;
    rating: number;
    ratings_count: number;
    metacritic: number | null;
    playtime: number;
    genres: Genre[];
    platforms: PlatformWrapper[];
    stores: StoreWrapper[];
    tags: Tag[];
    short_screenshots: Screenshot[];
    description_raw?: string;
    developers?: Developer[];
    publishers?: Publisher[];
    esrb_rating?: ESRBRating;
    tba?: boolean;
}

export interface Genre {
    id: number;
    name: string;
    slug: string;
}

export interface Platform {
    id: number;
    name: string;
    slug: string;
}

export interface PlatformWrapper {
    platform: Platform;
}

export interface Store {
    id: number;
    name: string;
    slug: string;
}

export interface StoreWrapper {
    store: Store;
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
}

export interface Screenshot {
    id: number;
    image: string;
}

export interface Developer {
    id: number;
    name: string;
    slug: string;
}

export interface Publisher {
    id: number;
    name: string;
    slug: string;
}

export interface ESRBRating {
    id: number;
    name: string;
    slug: string;
}

export interface GamesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Game[];
}

// API Functions
async function fetchFromRAWG<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const searchParams = new URLSearchParams({
        key: RAWG_API_KEY,
        ...params,
    });

    const response = await fetch(`${BASE_URL}${endpoint}?${searchParams}`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
        throw new Error(`RAWG API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Filter to only include RELEASED games (not TBA, not future dates)
 * Now includes auto-detection via YouTube gameplay videos
 */
async function filterReleasedGames(games: Game[]): Promise<Game[]> {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    // Batch fetch overrides for all games
    const gameIds = games.map(g => g.id);
    const overrides = await getGameOverrides(gameIds);

    const results: Game[] = [];

    for (const game of games) {
        const override = overrides.get(game.id);

        // Check 1: Override explicitly says released
        if (override?.is_released === true) {
            console.log(`[Override] Released: ${game.name}`);
            results.push(game);
            continue;
        }

        // Check 2: Override explicitly says NOT released
        if (override?.is_released === false) {
            console.log(`[Override] Not released: ${game.name}`);
            continue;
        }

        // Check 3: Override has release date
        if (override?.release_date && override.release_date <= todayStr) {
            console.log(`[Override date] Released (${override.release_date}): ${game.name}`);
            results.push(game);
            continue;
        }

        // Check 4: RAWG says TBA - skip (unless auto-detected later)
        if (game.tba) {
            console.log(`Filtered out (TBA): ${game.name}`);
            continue;
        }

        // Check 5: No release date
        if (!game.released) {
            console.log(`Filtered out (no release date): ${game.name}`);
            continue;
        }

        // Check 6: Release date is in the past - it's released!
        if (game.released <= todayStr) {
            // Must have some ratings as proof
            if (game.ratings_count >= 50) {
                results.push(game);
                continue;
            }
            // Low ratings but date passed - still include
            if (game.ratings_count >= 10) {
                results.push(game);
                continue;
            }
        }

        // Check 7: Future release date - filter out
        if (game.released > todayStr) {
            console.log(`Filtered out (future release ${game.released}): ${game.name}`);
            continue;
        }
    }

    return results;
}

/**
 * Check if a SINGLE game is released (for game detail page)
 * Logic:
 * 1. Check override first
 * 2. If release date in past = RELEASED
 * 3. If TBA or no date = check YouTube for gameplay videos
 */
export async function isGameReleased(game: Game): Promise<boolean> {
    const todayStr = new Date().toISOString().split("T")[0];

    console.log(`[isGameReleased] Checking: ${game.name}, ID: ${game.id}, released: "${game.released}", tba: ${game.tba}, today: ${todayStr}`);

    // Check override first (for manual corrections)
    try {
        const override = await getGameOverride(game.id);
        if (override?.is_released === true) {
            console.log(`[isGameReleased] Override: ${game.name} = RELEASED`);
            return true;
        }
        if (override?.is_released === false) {
            console.log(`[isGameReleased] Override: ${game.name} = NOT RELEASED`);
            return false;
        }
    } catch (e) {
        // Ignore override errors, continue with checks
    }

    // If release date exists and is in the past = RELEASED
    if (game.released && game.released <= todayStr) {
        console.log(`[isGameReleased] Date check: ${game.name} released on ${game.released} = RELEASED`);
        return true;
    }

    // If TBA or no release date = check YouTube for gameplay videos
    // This is the AUTO-DETECTION for games like Hytale where RAWG hasn't updated
    if (game.tba || !game.released) {
        console.log(`[isGameReleased] TBA/No date - checking YouTube for: ${game.name}`);

        try {
            const youtubeCheck = await checkForGameplayVideos(game.name);
            if (youtubeCheck.hasGameplay) {
                console.log(`[isGameReleased] YouTube detected gameplay: ${game.name} = RELEASED`);
                // Cache for future so we don't check YouTube every time
                try {
                    await upsertGameOverride(game.id, game.name, {
                        is_released: true,
                        detected_via: 'youtube_gameplay',
                    });
                } catch (e) {
                    // Ignore cache errors
                }
                return true;
            }
        } catch (e) {
            console.log(`[isGameReleased] YouTube check failed for ${game.name}`);
        }
    }

    console.log(`[isGameReleased] ${game.name} = NOT RELEASED`);
    return false;
}

/**
 * Get current date/time in IST (UTC+5:30)
 * Used for all time-based logic to ensure consistency at 12 AM IST
 */
function getISTDate(): { nowIST: Date; dateIST: string; weekNumber: number; daysSinceEpoch: number } {
    const nowUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes
    const nowIST = new Date(nowUTC.getTime() + istOffset);
    const dateIST = nowIST.toISOString().split("T")[0];

    // Calculate week number in IST (for weekly changes)
    // Week starts on Monday in IST
    const startOfYear = new Date(nowIST.getFullYear(), 0, 1);
    const days = Math.floor((nowIST.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.floor((days + startOfYear.getDay()) / 7);

    // Days since epoch (for calculating periods like every 3 days)
    const daysSinceEpoch = Math.floor(nowIST.getTime() / (24 * 60 * 60 * 1000));

    return { nowIST, dateIST, weekNumber, daysSinceEpoch };
}

/**
 * Seeded shuffle - same seed produces same shuffle result
 * Used to deterministically select games for a given time period
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
 * Get trending games - Now based on YouTube activity
 * Changes every WEEK at 12:00 AM IST (Monday)
 * Prioritizes games with high YouTube trending scores
 */
export async function getTrendingGames(page = 1, pageSize = 12): Promise<GamesResponse> {
    const { nowIST, weekNumber } = getISTDate();
    const nowUTC = new Date();
    const todayStr = nowUTC.toISOString().split("T")[0];
    const currentYear = nowIST.getFullYear();

    // Get games from the last 6 months
    const sixMonthsAgo = new Date(nowUTC);
    sixMonthsAgo.setMonth(nowUTC.getMonth() - 6);

    // Fetch candidate games
    const response = await fetchFromRAWG<GamesResponse>("/games", {
        ordering: "-added,-rating",
        dates: `${sixMonthsAgo.toISOString().split("T")[0]},${todayStr}`,
        page: String(page),
        page_size: String(pageSize * 4),
    });

    // Get overrides
    const gameIds = response.results.map(g => g.id);
    const overrides = await getGameOverrides(gameIds);

    // Filter to released games
    const releasedGames = response.results.filter(game => {
        const override = overrides.get(game.id);

        if (override?.is_released === true) return true;
        if (override?.is_released === false) return false;
        if (override?.release_date && override.release_date <= todayStr) return true;

        if (game.tba) return false;
        if (!game.released) return false;
        if (game.released > todayStr) return false;

        return true;
    });

    // Get YouTube trending scores from cache
    const youtubeCacheMap = await getYouTubeTrendingScores(releasedGames.map(g => g.id));

    // Score each game
    interface TrendingGame {
        game: Game;
        youtubeTrending: number;
        overrideBoost: number;
        yearBonus: number;
        totalScore: number;
    }

    const scoredGames: TrendingGame[] = releasedGames.map(game => {
        const override = overrides.get(game.id);
        const ytCache = youtubeCacheMap.get(game.id);

        const youtubeTrending = ytCache?.trending_score || 0;
        const overrideBoost = override?.is_trending ? 500 : (override?.trending_score || 0);
        const yearBonus = new Date(game.released).getFullYear() === currentYear ? 200 : 0;

        return {
            game,
            youtubeTrending,
            overrideBoost,
            yearBonus,
            totalScore: youtubeTrending + overrideBoost + yearBonus + (game.ratings_count || 0),
        };
    });

    // Sort by total score
    scoredGames.sort((a, b) => b.totalScore - a.totalScore);

    // Use week number as seed for variety
    const seed = currentYear * 100 + weekNumber;
    const topCandidates = scoredGames.slice(0, pageSize * 2).map(sg => sg.game);
    const shuffled = seededShuffle(topCandidates, seed);

    console.log(`[Trending] Week ${weekNumber} | YouTube-based selection`);
    console.log(`[Trending] Top: ${shuffled.slice(0, 5).map(g => g.name).join(', ')}`);

    return {
        ...response,
        results: shuffled.slice(0, pageSize),
    };
}

/**
 * Get upcoming HYPED games - 4 most anticipated releases
 * Changes every 3 DAYS at 12:00 AM IST
 * Prioritizes: 
 * 1. Games closest to release date (coming soon!)
 * 2. Newly announced hyped games (lots of wishlists)
 */
export async function getUpcomingGames(page = 1, pageSize = 4): Promise<GamesResponse> {
    const { nowIST, daysSinceEpoch } = getISTDate();
    const nowUTC = new Date();
    const todayStr = nowUTC.toISOString().split("T")[0];
    const currentYear = nowIST.getFullYear();

    // Calculate 3-day period number (changes every 3 days at 12 AM IST)
    const threeDayPeriod = Math.floor(daysSinceEpoch / 3);

    // Get games releasing from tomorrow to end of year
    const tomorrow = new Date(nowUTC);
    tomorrow.setDate(nowUTC.getDate() + 1);
    const yearEnd = `${currentYear}-12-31`;

    // Fetch more games to have a good selection pool
    const response = await fetchFromRAWG<GamesResponse>("/games", {
        ordering: "-added", // Most anticipated (most wishlisted/added)
        dates: `${tomorrow.toISOString().split("T")[0]},${yearEnd}`,
        page: String(page),
        page_size: "40", // Fetch more to filter and select from
    });

    // Filter to only upcoming games with confirmed dates and images
    const hypedGames = response.results.filter(game => {
        if (!game.released) return false;
        if (!game.released.startsWith(String(currentYear))) return false;
        if (game.tba) return false;
        if (game.released <= todayStr) return false;
        if (!game.background_image) return false; // Must have an image
        return true;
    });

    // Remove duplicates by game id
    const uniqueGames = hypedGames.filter((game, index, self) =>
        index === self.findIndex((g) => g.id === game.id)
    );

    // Sort by multiple factors:
    // 1. Games releasing within 30 days get priority
    // 2. Then by anticipation (added count / wishlists)
    const thirtyDaysFromNow = new Date(nowUTC);
    thirtyDaysFromNow.setDate(nowUTC.getDate() + 30);
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split("T")[0];

    const sortedGames = uniqueGames.sort((a, b) => {
        const aComingSoon = a.released <= thirtyDaysStr;
        const bComingSoon = b.released <= thirtyDaysStr;

        // Coming soon games first
        if (aComingSoon && !bComingSoon) return -1;
        if (bComingSoon && !aComingSoon) return 1;

        // Within the same category, sort by release date (closer = higher priority)
        if (aComingSoon && bComingSoon) {
            return a.released.localeCompare(b.released);
        }

        // For non-coming-soon games, sort by hype (ratings_count as proxy)
        return (b.ratings_count || 0) - (a.ratings_count || 0);
    });

    // Use 3-day period as seed for consistent selection
    const seed = currentYear * 1000 + threeDayPeriod;

    // Take top 12 candidates and shuffle with seed, then pick 4
    const candidates = sortedGames.slice(0, 12);
    const shuffled = seededShuffle(candidates, seed);

    console.log(`[Upcoming] Period ${threeDayPeriod} | Showing: ${shuffled.slice(0, pageSize).map(g => `${g.name} (${g.released})`).join(', ')}`);
    console.log(`[Upcoming] Changes every 3 days at 12:00 AM IST`);

    return {
        ...response,
        results: shuffled.slice(0, pageSize),
    };
}

/**
 * Get all-time greatest games for bento layout (Metacritic 90+ and 95+)
 * Returns: 1 game with 95+ rating (featured) + 5 games with 90+ rating
 * Randomized on each call (per page load/user visit)
 */
export async function getAllTimeGreats(): Promise<GamesResponse> {
    // Fetch 95+ games for the featured card
    const legendary = await fetchFromRAWG<GamesResponse>("/games", {
        ordering: "-metacritic",
        metacritic: "95,100",
        page_size: "30",
    });

    // Fetch 90-94 games for the smaller cards
    const elite = await fetchFromRAWG<GamesResponse>("/games", {
        ordering: "-metacritic",
        metacritic: "90,94",
        page_size: "50",
    });

    // Filter to only released games
    const legendaryGames = await filterReleasedGames(legendary.results);
    const eliteGames = await filterReleasedGames(elite.results);

    // Shuffle function (Fisher-Yates for true randomness)
    const shuffle = <T>(array: T[]): T[] => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    // Randomly pick 1 legendary (95+) and 5 elite (90+)
    const shuffledLegendary = shuffle(legendaryGames);
    const shuffledElite = shuffle(eliteGames);

    const featuredGame = shuffledLegendary[0]; // 95+ for big card
    const smallerGames = shuffledElite.slice(0, 5); // 90+ for 5 smaller cards

    // Combine: featured first, then 5 smaller
    const results = featuredGame
        ? [featuredGame, ...smallerGames]
        : smallerGames.slice(0, 6);

    console.log(`GOATs - Featured (95+): ${featuredGame?.name || 'none'}, Smaller (90+): ${smallerGames.map(g => g.name).join(', ')}`);

    return {
        count: results.length,
        next: null,
        previous: null,
        results,
    };
}

/**
 * Search games by query
 */
export async function searchGames(query: string, page = 1, pageSize = 20): Promise<GamesResponse> {
    return fetchFromRAWG<GamesResponse>("/games", {
        search: query,
        page: String(page),
        page_size: String(pageSize),
    });
}

/**
 * Get games by genre
 */
export async function getGamesByGenre(
    genreSlug: string,
    options: {
        page?: number;
        pageSize?: number;
        ordering?: string;
        metacritic?: string;
        year?: string;
    } = {}
): Promise<GamesResponse> {
    const { page = 1, pageSize = 20, ordering = "-rating", metacritic, year } = options;

    const params: Record<string, string> = {
        genres: genreSlug,
        page: String(page),
        page_size: String(pageSize),
        ordering,
    };

    if (metacritic) {
        params.metacritic = metacritic;
    }

    if (year) {
        params.dates = `${year}-01-01,${year}-12-31`;
    }

    return fetchFromRAWG<GamesResponse>("/games", params);
}

/**
 * Get single game details
 */
export async function getGameDetails(id: number): Promise<Game> {
    return fetchFromRAWG<Game>(`/games/${id}`);
}

/**
 * Get game screenshots
 */
export async function getGameScreenshots(id: number): Promise<{ results: Screenshot[] }> {
    return fetchFromRAWG<{ results: Screenshot[] }>(`/games/${id}/screenshots`);
}

/**
 * Game trailer/video type
 */
export interface GameTrailer {
    id: number;
    name: string;
    preview: string;
    data: {
        480: string;
        max: string;
    };
}

/**
 * Get game trailers/videos
 */
export async function getGameTrailers(id: number): Promise<{ results: GameTrailer[] }> {
    return fetchFromRAWG<{ results: GameTrailer[] }>(`/games/${id}/movies`);
}

/**
 * Get list of genres
 */
export async function getGenres(): Promise<{ results: Genre[] }> {
    return fetchFromRAWG<{ results: Genre[] }>("/genres");
}

/**
 * Get list of platforms
 */
export async function getPlatforms(): Promise<{ results: Platform[] }> {
    return fetchFromRAWG<{ results: Platform[] }>("/platforms");
}

// Genre list for filtering
export const POPULAR_GENRES = [
    { id: 4, name: "Action", slug: "action" },
    { id: 3, name: "Adventure", slug: "adventure" },
    { id: 5, name: "RPG", slug: "role-playing-games-rpg" },
    { id: 10, name: "Strategy", slug: "strategy" },
    { id: 2, name: "Shooter", slug: "shooter" },
    { id: 7, name: "Puzzle", slug: "puzzle" },
    { id: 1, name: "Racing", slug: "racing" },
    { id: 15, name: "Sports", slug: "sports" },
    { id: 51, name: "Indie", slug: "indie" },
    { id: 14, name: "Simulation", slug: "simulation" },
] as const;

// Ordering options for filters
export const ORDERING_OPTIONS = [
    { label: "Popularity", value: "-added" },
    { label: "Rating", value: "-rating" },
    { label: "Metacritic", value: "-metacritic" },
    { label: "Release Date", value: "-released" },
    { label: "Name", value: "name" },
] as const;

// Metacritic filter options
export const METACRITIC_OPTIONS = [
    { label: "All Scores", value: "" },
    { label: "90+", value: "90,100" },
    { label: "80+", value: "80,100" },
    { label: "70+", value: "70,100" },
] as const;

// Year options for filtering
export const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 2000; year--) {
        years.push({ label: String(year), value: String(year) });
    }
    return years;
};

/**
 * Get Today's Pick - Uses YouTube trending + Priority Publishers
 *
 * Priority:
 * 1. Recently released games from priority publishers with YouTube buzz
 * 2. Games with high YouTube trending scores
 * 3. Fallback to RAWG ratings
 * - Changes daily at 12:00 AM IST
 */
export async function getTodaysPickGame(): Promise<Game | null> {
    const nowUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(nowUTC.getTime() + istOffset);
    const todayIST = nowIST.toISOString().split("T")[0];
    const todayUTC = nowUTC.toISOString().split("T")[0];
    const currentYear = nowIST.getFullYear();

    console.log(`[Today's Pick] Date: ${todayIST} (IST), using YouTube trending + publishers`);

    // Fetch priority publishers
    const priorityPublishers = await getPriorityPublishers();
    const publisherScores = new Map(
        priorityPublishers.map(p => [p.publisher_name.toLowerCase(), p.priority_score])
    );

    // Fetch recent games (last 30 days)
    const thirtyDaysAgo = new Date(nowUTC);
    thirtyDaysAgo.setDate(nowUTC.getDate() - 30);

    const recentResponse = await fetchFromRAWG<GamesResponse>("/games", {
        ordering: "-added,-rating",
        dates: `${thirtyDaysAgo.toISOString().split("T")[0]},${todayUTC}`,
        page_size: "50",
    });

    // Get overrides for all games
    const gameIds = recentResponse.results.map(g => g.id);
    const overrides = await getGameOverrides(gameIds);

    // Filter to released games
    let validGames = recentResponse.results.filter(game => {
        const override = overrides.get(game.id);

        if (override?.is_released === true) return true;
        if (override?.is_released === false) return false;
        if (override?.release_date && override.release_date <= todayUTC) return true;

        if (game.tba) return false;
        if (!game.released) return false;
        if (game.released > todayUTC) return false;

        return true;
    });

    console.log(`[Today's Pick] Found ${validGames.length} valid recent games`);

    // Fallback if no recent games
    if (validGames.length === 0) {
        const yearStart = `${currentYear}-01-01`;
        const yearResponse = await fetchFromRAWG<GamesResponse>("/games", {
            ordering: "-rating,-ratings_count",
            dates: `${yearStart},${todayUTC}`,
            page_size: "50",
        });

        validGames = yearResponse.results.filter(game => {
            if (game.tba) return false;
            if (!game.released) return false;
            if (game.released > todayUTC) return false;
            if (game.ratings_count < 10) return false;
            return true;
        });
    }

    if (validGames.length === 0) {
        console.log(`[Today's Pick] No valid games found!`);
        return null;
    }

    // Score each game: Publisher priority + YouTube trending + Override boost
    interface ScoredGame {
        game: Game;
        publisherScore: number;
        youtubeTrending: number;
        overrideBoost: number;
        totalScore: number;
    }

    const scoredGames: ScoredGame[] = [];

    // Get YouTube trending cache
    const youtubeCacheMap = await getYouTubeTrendingScores(validGames.map(g => g.id));

    // Check YouTube for top 10 candidates without cache
    const topCandidates = validGames.slice(0, 10);
    for (const game of topCandidates) {
        if (!youtubeCacheMap.has(game.id)) {
            // Fetch fresh from YouTube
            const result = await getYouTubeTrendingScore(game.name);
            if (result) {
                await upsertYouTubeTrendingCache(game.id, game.name, {
                    totalViews: result.totalViews,
                    videoCount: result.videoCount,
                    trendingScore: result.trendingScore,
                    hasGameplayVideos: result.hasGameplayVideos,
                });
            }
        }
    }

    // Re-fetch cache after updates
    const updatedCache = await getYouTubeTrendingScores(validGames.map(g => g.id));

    for (const game of validGames) {
        // Publisher score
        let publisherScore = 0;
        if (game.publishers) {
            for (const pub of game.publishers) {
                const score = publisherScores.get(pub.name.toLowerCase()) || 0;
                publisherScore = Math.max(publisherScore, score);
            }
        }

        // YouTube trending from cache
        const ytCache = updatedCache.get(game.id);
        const youtubeTrending = ytCache?.trending_score || 0;

        // Override boost
        const override = overrides.get(game.id);
        const overrideBoost = override?.is_trending ? 500 : (override?.trending_score || 0);

        const totalScore = publisherScore + youtubeTrending + overrideBoost;

        scoredGames.push({
            game,
            publisherScore,
            youtubeTrending,
            overrideBoost,
            totalScore,
        });
    }

    // Sort by total score
    scoredGames.sort((a, b) => b.totalScore - a.totalScore);

    console.log(`[Today's Pick] Top 5 scored games:`);
    scoredGames.slice(0, 5).forEach((sg, i) => {
        console.log(`  ${i + 1}. ${sg.game.name}: total=${sg.totalScore} (pub=${sg.publisherScore}, yt=${sg.youtubeTrending})`);
    });

    // Take top 5 and use date-based deterministic selection
    const topScoredGames = scoredGames.slice(0, 5).map(sg => sg.game);

    // Hash based on IST date
    let hash = 0;
    for (let i = 0; i < todayIST.length; i++) {
        hash = ((hash << 5) - hash) + todayIST.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % topScoredGames.length;

    const picked = topScoredGames[index];

    console.log(`✓ Today's Pick: ${picked.name} (released: ${picked.released})`);
    console.log(`  Changes at 12:00 AM IST daily`);

    return picked;
}

