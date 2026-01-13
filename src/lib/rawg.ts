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
 * Stricter checks to ensure games are actually playable
 */
function filterReleasedGames(games: Game[]): Game[] {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    return games.filter(game => {
        // Exclude TBA games
        if (game.tba) {
            console.log(`Filtered out (TBA): ${game.name}`);
            return false;
        }

        // Must have a release date
        if (!game.released) {
            console.log(`Filtered out (no release date): ${game.name}`);
            return false;
        }

        // Release date must be BEFORE today (string comparison works for YYYY-MM-DD)
        if (game.released > todayStr) {
            console.log(`Filtered out (future release ${game.released}): ${game.name}`);
            return false;
        }

        // Must have ratings (proof people actually played it)
        if (game.ratings_count < 50) {
            console.log(`Filtered out (too few ratings: ${game.ratings_count}): ${game.name}`);
            return false;
        }

        return true;
    });
}

/**
 * Get trending games - Games people are playing RIGHT NOW (2026 focus)
 * Prioritizes games released in 2026, then recent 2025 releases
 */
export async function getTrendingGames(page = 1, pageSize = 12): Promise<GamesResponse> {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const currentYear = today.getFullYear(); // 2026

    // Get games from the last 6 months for freshness
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    // Fetch games ordered by ratings count (what people are playing)
    const response = await fetchFromRAWG<GamesResponse>("/games", {
        ordering: "-ratings_count,-rating",
        dates: `${sixMonthsAgo.toISOString().split("T")[0]},${todayStr}`,
        page: String(page),
        page_size: String(pageSize * 4), // More to filter and prioritize
    });

    // Filter to only released games with ratings
    const releasedGames = response.results.filter(game => {
        if (game.tba) return false;
        if (!game.released) return false;
        if (game.released > todayStr) return false;
        if (game.ratings_count < 20) return false; // Lower threshold for newer games
        return true;
    });

    // Prioritize 2026 games, then sort by ratings_count
    const prioritizedGames = releasedGames.sort((a, b) => {
        const aYear = new Date(a.released).getFullYear();
        const bYear = new Date(b.released).getFullYear();

        // 2026 games first
        if (aYear === currentYear && bYear !== currentYear) return -1;
        if (bYear === currentYear && aYear !== currentYear) return 1;

        // Then by ratings count (popularity)
        return b.ratings_count - a.ratings_count;
    });

    console.log(`Trending: ${prioritizedGames.length} games (prioritizing ${currentYear})`);

    return {
        ...response,
        results: prioritizedGames.slice(0, pageSize),
    };
}

/**
 * Get upcoming HYPED games - 4 most anticipated 2026 releases
 * Only games with official 2026 release dates, ordered by hype/anticipation
 */
export async function getUpcomingGames(page = 1, pageSize = 4): Promise<GamesResponse> {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const currentYear = today.getFullYear(); // 2026

    // Get games releasing in 2026 (from tomorrow to end of 2026)
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yearEnd = `${currentYear}-12-31`;

    // Fetch hyped upcoming games (ordered by how many people added them)
    const response = await fetchFromRAWG<GamesResponse>("/games", {
        ordering: "-added", // Most anticipated (most wishlisted/added)
        dates: `${tomorrow.toISOString().split("T")[0]},${yearEnd}`,
        page: String(page),
        page_size: "20", // Fetch more to filter
    });

    // Filter to only games with confirmed 2026 dates (not TBA placeholders)
    const hypedGames = response.results.filter(game => {
        // Must have a release date
        if (!game.released) return false;

        // Must be in 2026
        if (!game.released.startsWith(String(currentYear))) return false;

        // Not TBA
        if (game.tba) return false;

        // Must be after today
        if (game.released <= todayStr) return false;

        return true;
    });

    console.log(`Upcoming Hype: Found ${hypedGames.length} hyped 2026 games`);

    return {
        ...response,
        results: hypedGames.slice(0, pageSize), // Only 4 games
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
    const legendaryGames = filterReleasedGames(legendary.results);
    const eliteGames = filterReleasedGames(elite.results);

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
 * Get Today's Pick - A recently released game that gamers are enjoying
 * 
 * Requirements:
 * - Released in 2026 (current year) - fresh games only!
 * - Has ratings (people are actually playing it)
 * - Good rating
 * - Changes daily at 12:00 AM based on date hash
 */
export async function getTodaysPickGame(): Promise<Game | null> {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentYear = today.getFullYear(); // 2026

    // Start of current year
    const yearStart = `${currentYear}-01-01`;

    console.log(`[Today's Pick] Looking for ${currentYear} games (today: ${todayStr})`);

    // First try: Games released in the last 14 days (very fresh!)
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);

    const recentResponse = await fetchFromRAWG<GamesResponse>("/games", {
        ordering: "-rating,-ratings_count",
        dates: `${twoWeeksAgo.toISOString().split("T")[0]},${todayStr}`,
        page_size: "30",
    });

    let validGames = recentResponse.results.filter(game => {
        if (game.tba) return false;
        if (!game.released) return false;
        if (game.released > todayStr) return false;
        // For very recent games, accept even 30+ ratings
        if (game.ratings_count < 30) return false;
        if (game.rating < 3.5) return false;
        // Must be current year
        if (!game.released.startsWith(String(currentYear))) return false;
        return true;
    });

    console.log(`[Today's Pick] Last 14 days candidates: ${validGames.map(g => g.name).join(', ') || 'none'}`);

    // Second try: All 2026 games
    if (validGames.length === 0) {
        console.log(`[Today's Pick] Trying all ${currentYear} games...`);

        const yearResponse = await fetchFromRAWG<GamesResponse>("/games", {
            ordering: "-rating,-ratings_count",
            dates: `${yearStart},${todayStr}`,
            page_size: "50",
        });

        validGames = yearResponse.results.filter(game => {
            if (game.tba) return false;
            if (!game.released) return false;
            if (game.released > todayStr) return false;
            if (game.ratings_count < 50) return false;
            if (game.rating < 3.5) return false;
            return true;
        });

        console.log(`[Today's Pick] ${currentYear} candidates: ${validGames.map(g => `${g.name}`).join(', ') || 'none'}`);
    }

    // Third try: Lower the ratings requirement for 2026 games
    if (validGames.length === 0) {
        console.log(`[Today's Pick] Trying ${currentYear} games with lower ratings requirement...`);

        const lowReqResponse = await fetchFromRAWG<GamesResponse>("/games", {
            ordering: "-added,-rating",
            dates: `${yearStart},${todayStr}`,
            page_size: "50",
        });

        validGames = lowReqResponse.results.filter(game => {
            if (game.tba) return false;
            if (!game.released) return false;
            if (game.released > todayStr) return false;
            if (game.ratings_count < 10) return false; // Very low threshold
            if (game.rating < 3.0) return false;
            return true;
        });

        console.log(`[Today's Pick] ${currentYear} (low req): ${validGames.map(g => g.name).join(', ') || 'none'}`);
    }

    // Last resort: Popular games from recent months
    if (validGames.length === 0) {
        console.log(`[Today's Pick] No ${currentYear} games found, using popular recent games...`);

        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);

        const popularResponse = await fetchFromRAWG<GamesResponse>("/games", {
            ordering: "-ratings_count",
            dates: `${sixMonthsAgo.toISOString().split("T")[0]},${todayStr}`,
            page_size: "30",
        });

        validGames = popularResponse.results.filter(game => {
            if (game.tba) return false;
            if (!game.released) return false;
            if (game.released > todayStr) return false;
            if (game.ratings_count < 100) return false;
            return true;
        });
    }

    if (validGames.length === 0) {
        console.log(`[Today's Pick] No valid games found!`);
        return null;
    }

    // Pick one game based on today's date
    // This hash changes when the date changes (at midnight)
    // Format: YYYY-MM-DD -> different hash each day
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
        hash = ((hash << 5) - hash) + todayStr.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % validGames.length;

    const picked = validGames[index];
    console.log(`✓ Today's Pick: ${picked.name} (released: ${picked.released}, rating: ${picked.rating}, ratings: ${picked.ratings_count})`);
    console.log(`  Pick changes at midnight (next pick date: ${new Date(today.getTime() + 86400000).toISOString().split("T")[0]})`);

    return picked;
}

