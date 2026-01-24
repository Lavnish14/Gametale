import {
    getGameOverride,
    getGameOverrides,
    upsertGameOverride,
    getYouTubeTrendingScores,
    upsertYouTubeTrendingCache,
    getPriorityPublishers,
    type GameOverride,
} from "./supabase";
import { checkForGameplayVideos, getYouTubeTrendingScore } from "./youtube";

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

// Constants for scoring (extracted from magic numbers)
const RATINGS_THRESHOLD_HIGH = 50;
const RATINGS_THRESHOLD_LOW = 10;
const RECENCY_SCORE_30_DAYS = 400;
const RECENCY_SCORE_60_DAYS = 250;
const RECENCY_SCORE_90_DAYS = 100;
const RECENCY_SCORE_CURRENT_YEAR = 50;
const MOMENTUM_SCORE_CAP = 300;
const TRENDING_BOOST = 500;

/**
 * Filter to only include RELEASED games (not TBA, not future dates)
 */
async function filterReleasedGames(games: Game[]): Promise<Game[]> {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const gameIds = games.map((g) => g.id);
    const overrides = await getGameOverrides(gameIds);

    const results: Game[] = [];

    for (const game of games) {
        const override = overrides.get(game.id);

        if (override?.is_released === true) {
            results.push(game);
            continue;
        }

        if (override?.is_released === false) {
            continue;
        }

        if (override?.release_date && override.release_date <= todayStr) {
            results.push(game);
            continue;
        }

        if (game.tba) {
            continue;
        }

        if (!game.released) {
            continue;
        }

        if (game.released <= todayStr) {
            if (game.ratings_count >= RATINGS_THRESHOLD_LOW) {
                results.push(game);
                continue;
            }
        }

        if (game.released > todayStr) {
            continue;
        }
    }

    return results;
}

/**
 * Check if a SINGLE game is released (for game detail page)
 */
export async function isGameReleased(game: Game): Promise<boolean> {
    const todayStr = new Date().toISOString().split("T")[0];

    try {
        const override = await getGameOverride(game.id);
        if (override?.is_released === true) {
            return true;
        }
        if (override?.is_released === false) {
            return false;
        }
    } catch {
        // Ignore override errors, continue with checks
    }

    if (game.released && game.released <= todayStr) {
        return true;
    }

    if (game.tba || !game.released) {
        try {
            const youtubeCheck = await checkForGameplayVideos(game.name);
            if (youtubeCheck.hasGameplay) {
                try {
                    await upsertGameOverride(game.id, game.name, {
                        is_released: true,
                        detected_via: "youtube_gameplay",
                    });
                } catch {
                    // Ignore cache errors
                }
                return true;
            }
        } catch {
            // YouTube check failed
        }
    }

    return false;
}

/**
 * Get current date/time in IST (UTC+5:30)
 */
function getISTDate(): {
    nowIST: Date;
    dateIST: string;
    weekNumber: number;
    daysSinceEpoch: number;
} {
    const nowUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(nowUTC.getTime() + istOffset);
    const dateIST = nowIST.toISOString().split("T")[0];

    const startOfYear = new Date(nowIST.getFullYear(), 0, 1);
    const days = Math.floor(
        (nowIST.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    const weekNumber = Math.floor((days + startOfYear.getDay()) / 7);
    const daysSinceEpoch = Math.floor(nowIST.getTime() / (24 * 60 * 60 * 1000));

    return { nowIST, dateIST, weekNumber, daysSinceEpoch };
}

/**
 * Seeded shuffle - same seed produces same shuffle result
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
 * Get trending games - Based on YouTube activity + recency weighting
 */
export async function getTrendingGames(
    page = 1,
    pageSize = 12
): Promise<GamesResponse> {
    const { weekNumber } = getISTDate();
    const nowUTC = new Date();
    const todayStr = nowUTC.toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();

    // Fetch from server-side API
    const res = await fetch(
        `/api/games?action=trending&page=${page}&pageSize=${pageSize}`
    );
    if (!res.ok) {
        return { count: 0, next: null, previous: null, results: [] };
    }

    const response: GamesResponse = await res.json();

    const gameIds = response.results.map((g) => g.id);
    const overrides = await getGameOverrides(gameIds);

    const releasedGames = response.results.filter((game) => {
        const override = overrides.get(game.id);

        if (override?.is_released === true) return true;
        if (override?.is_released === false) return false;
        if (override?.release_date && override.release_date <= todayStr)
            return true;

        if (game.tba) return false;
        if (!game.released) return false;
        if (game.released > todayStr) return false;

        return true;
    });

    const youtubeCacheMap = await getYouTubeTrendingScores(
        releasedGames.map((g) => g.id)
    );

    interface TrendingGame {
        game: Game;
        youtubeTrending: number;
        overrideBoost: number;
        recencyScore: number;
        momentumScore: number;
        totalScore: number;
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    const scoredGames: TrendingGame[] = releasedGames.map((game) => {
        const override = overrides.get(game.id);
        const ytCache = youtubeCacheMap.get(game.id);

        const youtubeTrending = ytCache?.trending_score || 0;
        const overrideBoost = override?.is_trending
            ? TRENDING_BOOST
            : override?.trending_score || 0;

        const releaseDate = new Date(game.released);
        let recencyScore = 0;
        if (releaseDate >= thirtyDaysAgo) {
            recencyScore = RECENCY_SCORE_30_DAYS;
        } else if (releaseDate >= sixtyDaysAgo) {
            recencyScore = RECENCY_SCORE_60_DAYS;
        } else if (releaseDate >= ninetyDaysAgo) {
            recencyScore = RECENCY_SCORE_90_DAYS;
        } else if (new Date(game.released).getFullYear() === currentYear) {
            recencyScore = RECENCY_SCORE_CURRENT_YEAR;
        }

        const daysSinceRelease = Math.max(
            1,
            Math.floor(
                (today.getTime() - releaseDate.getTime()) / (24 * 60 * 60 * 1000)
            )
        );
        const ratingsPerDay = (game.ratings_count || 0) / daysSinceRelease;
        const momentumScore = Math.min(
            MOMENTUM_SCORE_CAP,
            Math.floor(ratingsPerDay * 10)
        );

        return {
            game,
            youtubeTrending,
            overrideBoost,
            recencyScore,
            momentumScore,
            totalScore:
                youtubeTrending + overrideBoost + recencyScore + momentumScore,
        };
    });

    scoredGames.sort((a, b) => b.totalScore - a.totalScore);

    const seed = currentYear * 100 + weekNumber;
    const topTier = scoredGames
        .slice(0, Math.ceil(pageSize * 0.4))
        .map((sg) => sg.game);
    const midTier = seededShuffle(
        scoredGames.slice(Math.ceil(pageSize * 0.4), pageSize * 2).map((sg) => sg.game),
        seed
    );

    const combined = [...topTier, ...midTier].slice(0, pageSize);

    return {
        ...response,
        results: combined,
    };
}

/**
 * Get upcoming HYPED games
 */
export async function getUpcomingGames(
    page = 1,
    pageSize = 4
): Promise<GamesResponse> {
    const { daysSinceEpoch } = getISTDate();
    const nowUTC = new Date();
    const todayStr = nowUTC.toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();

    const threeDayPeriod = Math.floor(daysSinceEpoch / 3);

    const res = await fetch(
        `/api/games?action=upcoming&page=${page}&pageSize=${pageSize}`
    );
    if (!res.ok) {
        return { count: 0, next: null, previous: null, results: [] };
    }

    const response: GamesResponse = await res.json();

    const hypedGames = response.results.filter((game) => {
        if (!game.released) return false;
        if (!game.released.startsWith(String(currentYear))) return false;
        if (game.tba) return false;
        if (game.released <= todayStr) return false;
        if (!game.background_image) return false;
        return true;
    });

    const uniqueGames = hypedGames.filter(
        (game, index, self) => index === self.findIndex((g) => g.id === game.id)
    );

    const thirtyDaysFromNow = new Date(nowUTC);
    thirtyDaysFromNow.setDate(nowUTC.getDate() + 30);
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split("T")[0];

    const sortedGames = uniqueGames.sort((a, b) => {
        const aComingSoon = a.released <= thirtyDaysStr;
        const bComingSoon = b.released <= thirtyDaysStr;

        if (aComingSoon && !bComingSoon) return -1;
        if (bComingSoon && !aComingSoon) return 1;

        if (aComingSoon && bComingSoon) {
            return a.released.localeCompare(b.released);
        }

        return (b.ratings_count || 0) - (a.ratings_count || 0);
    });

    const seed = currentYear * 1000 + threeDayPeriod;
    const candidates = sortedGames.slice(0, 12);
    const shuffled = seededShuffle(candidates, seed);

    return {
        ...response,
        results: shuffled.slice(0, pageSize),
    };
}

/**
 * Get all-time greatest games for bento layout
 */
export async function getAllTimeGreats(): Promise<GamesResponse> {
    const res = await fetch("/api/games?action=goats");
    if (!res.ok) {
        return { count: 0, next: null, previous: null, results: [] };
    }

    const { legendary, elite } = await res.json();

    const legendaryGames = await filterReleasedGames(legendary);
    const eliteGames = await filterReleasedGames(elite);

    const shuffle = <T>(array: T[]): T[] => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const shuffledLegendary = shuffle(legendaryGames);
    const shuffledElite = shuffle(eliteGames);

    const featuredGame = shuffledLegendary[0];
    const smallerGames = shuffledElite.slice(0, 5);

    const results = featuredGame
        ? [featuredGame, ...smallerGames]
        : smallerGames.slice(0, 6);

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
export async function searchGames(
    query: string,
    page = 1,
    pageSize = 20
): Promise<GamesResponse> {
    const res = await fetch(
        `/api/games?action=search&query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`
    );
    if (!res.ok) {
        return { count: 0, next: null, previous: null, results: [] };
    }
    return res.json();
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

    const params = new URLSearchParams({
        action: "genre",
        genre: genreSlug,
        page: String(page),
        pageSize: String(pageSize),
        ordering,
    });

    if (metacritic) params.set("metacritic", metacritic);
    if (year) params.set("year", year);

    const res = await fetch(`/api/games?${params}`);
    if (!res.ok) {
        return { count: 0, next: null, previous: null, results: [] };
    }
    return res.json();
}

/**
 * Get single game details
 */
export async function getGameDetails(id: number): Promise<Game> {
    const res = await fetch(`/api/games?action=details&id=${id}`);
    if (!res.ok) {
        throw new Error(`Failed to fetch game details: ${res.status}`);
    }
    return res.json();
}

/**
 * Get game screenshots
 */
export async function getGameScreenshots(
    id: number
): Promise<{ results: Screenshot[] }> {
    const res = await fetch(`/api/games?action=screenshots&id=${id}`);
    if (!res.ok) {
        return { results: [] };
    }
    return res.json();
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
export async function getGameTrailers(
    id: number
): Promise<{ results: GameTrailer[] }> {
    const res = await fetch(`/api/games?action=trailers&id=${id}`);
    if (!res.ok) {
        return { results: [] };
    }
    return res.json();
}

/**
 * Get list of genres
 */
export async function getGenres(): Promise<{ results: Genre[] }> {
    const res = await fetch("/api/games?action=genres");
    if (!res.ok) {
        return { results: [] };
    }
    return res.json();
}

/**
 * Get list of platforms
 */
export async function getPlatforms(): Promise<{ results: Platform[] }> {
    const res = await fetch("/api/games?action=platforms");
    if (!res.ok) {
        return { results: [] };
    }
    return res.json();
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
    { id: 59, name: "Co-op", slug: "massively-multiplayer" },
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
 */
export async function getTodaysPickGame(): Promise<Game | null> {
    const nowUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(nowUTC.getTime() + istOffset);
    const todayIST = nowIST.toISOString().split("T")[0];
    const todayUTC = nowUTC.toISOString().split("T")[0];
    const currentYear = nowIST.getFullYear();

    const priorityPublishers = await getPriorityPublishers();
    const publisherScores = new Map(
        priorityPublishers.map((p) => [p.publisher_name.toLowerCase(), p.priority_score])
    );

    const res = await fetch("/api/games?action=todays-pick");
    if (!res.ok) return null;

    const recentResponse: GamesResponse = await res.json();

    const gameIds = recentResponse.results.map((g) => g.id);
    const overrides = await getGameOverrides(gameIds);

    let validGames = recentResponse.results.filter((game) => {
        const override = overrides.get(game.id);

        if (override?.is_released === true) return true;
        if (override?.is_released === false) return false;
        if (override?.release_date && override.release_date <= todayUTC)
            return true;

        if (game.tba) return false;
        if (!game.released) return false;
        if (game.released > todayUTC) return false;

        return true;
    });

    if (validGames.length === 0) {
        const yearStart = `${currentYear}-01-01`;
        const yearRes = await fetch(
            `/api/games?action=search&query=&page=1&pageSize=50&ordering=-rating,-ratings_count&dates=${yearStart},${todayUTC}`
        );

        if (yearRes.ok) {
            const yearResponse: GamesResponse = await yearRes.json();
            validGames = yearResponse.results.filter((game) => {
                if (game.tba) return false;
                if (!game.released) return false;
                if (game.released > todayUTC) return false;
                if (game.ratings_count < RATINGS_THRESHOLD_LOW) return false;
                return true;
            });
        }
    }

    if (validGames.length === 0) {
        return null;
    }

    interface ScoredGame {
        game: Game;
        publisherScore: number;
        youtubeTrending: number;
        overrideBoost: number;
        totalScore: number;
    }

    const scoredGames: ScoredGame[] = [];
    const youtubeCacheMap = await getYouTubeTrendingScores(
        validGames.map((g) => g.id)
    );

    const topCandidates = validGames.slice(0, 10);
    for (const game of topCandidates) {
        if (!youtubeCacheMap.has(game.id)) {
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

    const updatedCache = await getYouTubeTrendingScores(
        validGames.map((g) => g.id)
    );

    for (const game of validGames) {
        let publisherScore = 0;
        if (game.publishers) {
            for (const pub of game.publishers) {
                const score = publisherScores.get(pub.name.toLowerCase()) || 0;
                publisherScore = Math.max(publisherScore, score);
            }
        }

        const ytCache = updatedCache.get(game.id);
        const youtubeTrending = ytCache?.trending_score || 0;

        const override = overrides.get(game.id);
        const overrideBoost = override?.is_trending
            ? TRENDING_BOOST
            : override?.trending_score || 0;

        const totalScore = publisherScore + youtubeTrending + overrideBoost;

        scoredGames.push({
            game,
            publisherScore,
            youtubeTrending,
            overrideBoost,
            totalScore,
        });
    }

    scoredGames.sort((a, b) => b.totalScore - a.totalScore);

    const topScoredGames = scoredGames.slice(0, 5).map((sg) => sg.game);

    let hash = 0;
    for (let i = 0; i < todayIST.length; i++) {
        hash = (hash << 5) - hash + todayIST.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % topScoredGames.length;

    return topScoredGames[index];
}
