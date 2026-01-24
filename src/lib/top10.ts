// Top 10 Daily Rotation System
// Rotates at 12 AM IST (UTC+5:30) each day

export interface Top10Theme {
    id: string;
    title: string;
    emoji: string;
    genre?: string;  // RAWG genre slug
    tag?: string;    // RAWG tag slug
    year?: number;   // For "Best of 2025" type themes
    ordering?: string; // RAWG ordering
    description: string;
}

// 50 Different Themes - Will cycle through these
export const TOP10_THEMES: Top10Theme[] = [
    // Horror & Dark
    { id: "horror", title: "Top 10 Horror Games", emoji: "👻", genre: "horror", ordering: "-rating", description: "Games that will keep you up at night" },
    { id: "horror-2025", title: "Top 10 Horror Games of 2025", emoji: "🎃", genre: "horror", year: 2025, ordering: "-rating", description: "This year's scariest experiences" },

    // Story & Narrative
    { id: "story", title: "Top 10 Story-Driven Games", emoji: "📖", tag: "story-rich", ordering: "-rating", description: "Games with unforgettable narratives" },
    { id: "emotional", title: "Top 10 Emotional Journeys", emoji: "😢", tag: "emotional", ordering: "-rating", description: "Games that will make you feel" },

    // Action & Adventure
    { id: "action", title: "Top 10 Action Games", emoji: "💥", genre: "action", ordering: "-rating", description: "Non-stop adrenaline rush" },
    { id: "adventure", title: "Top 10 Adventure Games", emoji: "🗺️", genre: "adventure", ordering: "-rating", description: "Epic journeys await" },
    { id: "action-2025", title: "Top 10 Action Games of 2025", emoji: "🔥", genre: "action", year: 2025, ordering: "-rating", description: "This year's best action" },

    // RPG
    { id: "rpg", title: "Top 10 RPGs", emoji: "⚔️", genre: "role-playing-games-rpg", ordering: "-rating", description: "Become the hero you want to be" },
    { id: "jrpg", title: "Top 10 JRPGs", emoji: "🎌", tag: "jrpg", ordering: "-rating", description: "Japanese RPG masterpieces" },
    { id: "rpg-2025", title: "Top 10 RPGs of 2025", emoji: "🛡️", genre: "role-playing-games-rpg", year: 2025, ordering: "-rating", description: "This year's role-playing adventures" },

    // Open World
    { id: "openworld", title: "Top 10 Open World Games", emoji: "🌍", tag: "open-world", ordering: "-rating", description: "Explore without limits" },
    { id: "sandbox", title: "Top 10 Sandbox Games", emoji: "🏗️", tag: "sandbox", ordering: "-rating", description: "Create your own adventure" },

    // Indie
    { id: "indie", title: "Top 10 Indie Gems", emoji: "💎", genre: "indie", ordering: "-rating", description: "Hidden treasures from indie devs" },
    { id: "indie-2025", title: "Top 10 Indie Games of 2025", emoji: "✨", genre: "indie", year: 2025, ordering: "-rating", description: "This year's indie highlights" },

    // Multiplayer
    { id: "multiplayer", title: "Top 10 Multiplayer Games", emoji: "👥", tag: "multiplayer", ordering: "-rating", description: "Best with friends" },
    { id: "coop", title: "Top 10 Co-op Games", emoji: "🤝", tag: "co-op", ordering: "-rating", description: "Team up for fun" },
    { id: "pvp", title: "Top 10 Competitive Games", emoji: "🏆", tag: "competitive", ordering: "-rating", description: "Prove you're the best" },

    // Genres
    { id: "puzzle", title: "Top 10 Puzzle Games", emoji: "🧩", genre: "puzzle", ordering: "-rating", description: "Challenge your mind" },
    { id: "platformer", title: "Top 10 Platformers", emoji: "🏃", genre: "platformer", ordering: "-rating", description: "Jump and run classics" },
    { id: "shooter", title: "Top 10 Shooters", emoji: "🔫", genre: "shooter", ordering: "-rating", description: "Aim for the top" },
    { id: "strategy", title: "Top 10 Strategy Games", emoji: "♟️", genre: "strategy", ordering: "-rating", description: "Outsmart your opponents" },
    { id: "simulation", title: "Top 10 Simulation Games", emoji: "🎮", genre: "simulation", ordering: "-rating", description: "Life simulators and more" },
    { id: "racing", title: "Top 10 Racing Games", emoji: "🏎️", genre: "racing", ordering: "-rating", description: "Speed demons unite" },
    { id: "sports", title: "Top 10 Sports Games", emoji: "⚽", genre: "sports", ordering: "-rating", description: "Athletic excellence" },
    { id: "fighting", title: "Top 10 Fighting Games", emoji: "🥊", genre: "fighting", ordering: "-rating", description: "Ready to rumble" },

    // Specific Tags
    { id: "roguelike", title: "Top 10 Roguelikes", emoji: "💀", tag: "roguelike", ordering: "-rating", description: "Die, learn, repeat" },
    { id: "survival", title: "Top 10 Survival Games", emoji: "🏕️", tag: "survival", ordering: "-rating", description: "Stay alive at all costs" },
    { id: "metroidvania", title: "Top 10 Metroidvanias", emoji: "🗝️", tag: "metroidvania", ordering: "-rating", description: "Explore and unlock" },
    { id: "soulslike", title: "Top 10 Souls-like Games", emoji: "🌑", tag: "souls-like", ordering: "-rating", description: "Prepare to die" },
    { id: "stealth", title: "Top 10 Stealth Games", emoji: "🥷", tag: "stealth", ordering: "-rating", description: "Silent but deadly" },
    { id: "exploration", title: "Top 10 Exploration Games", emoji: "🔭", tag: "exploration", ordering: "-rating", description: "Discover the unknown" },

    // Year-based
    { id: "best-2025", title: "Best Games of 2025", emoji: "🌟", year: 2025, ordering: "-rating", description: "This year's finest" },
    { id: "best-2024", title: "Best Games of 2024", emoji: "🏅", year: 2024, ordering: "-rating", description: "Last year's highlights" },
    { id: "best-2023", title: "Best Games of 2023", emoji: "🎖️", year: 2023, ordering: "-rating", description: "2023's greatest hits" },

    // Themes
    { id: "scifi", title: "Top 10 Sci-Fi Games", emoji: "🚀", tag: "sci-fi", ordering: "-rating", description: "Explore the future" },
    { id: "fantasy", title: "Top 10 Fantasy Games", emoji: "🧙", tag: "fantasy", ordering: "-rating", description: "Magic and wonder" },
    { id: "cyberpunk", title: "Top 10 Cyberpunk Games", emoji: "🤖", tag: "cyberpunk", ordering: "-rating", description: "High-tech dystopia" },
    { id: "postapoc", title: "Top 10 Post-Apocalyptic Games", emoji: "☢️", tag: "post-apocalyptic", ordering: "-rating", description: "Survive the end" },
    { id: "medieval", title: "Top 10 Medieval Games", emoji: "🏰", tag: "medieval", ordering: "-rating", description: "Knights and kingdoms" },
    { id: "anime", title: "Top 10 Anime-Style Games", emoji: "🎨", tag: "anime", ordering: "-rating", description: "Beautiful anime aesthetics" },

    // Playstyle
    { id: "relaxing", title: "Top 10 Relaxing Games", emoji: "🧘", tag: "relaxing", ordering: "-rating", description: "Unwind and chill" },
    { id: "difficult", title: "Top 10 Most Challenging Games", emoji: "😤", tag: "difficult", ordering: "-rating", description: "For the hardcore" },
    { id: "short", title: "Top 10 Short But Sweet Games", emoji: "⏱️", tag: "short", ordering: "-rating", description: "Quality over quantity" },
    { id: "atmospheric", title: "Top 10 Atmospheric Games", emoji: "🌌", tag: "atmospheric", ordering: "-rating", description: "Immersive worlds" },
    { id: "beautiful", title: "Top 10 Most Beautiful Games", emoji: "🎨", tag: "beautiful", ordering: "-rating", description: "Visual masterpieces" },

    // Popular franchises (use search)
    { id: "classic", title: "Top 10 Classic Games", emoji: "🕹️", tag: "classic", ordering: "-rating", description: "Timeless legends" },
    { id: "underrated", title: "Top 10 Underrated Gems", emoji: "💠", tag: "hidden-gem", ordering: "-added", description: "Overlooked masterpieces" },
    { id: "free", title: "Top 10 Free-to-Play Games", emoji: "🆓", tag: "free-to-play", ordering: "-rating", description: "No cost, all fun" },
    { id: "singleplayer", title: "Top 10 Single-Player Games", emoji: "🎯", tag: "singleplayer", ordering: "-rating", description: "Solo adventures" },
];

// Get today's theme based on IST date (12 AM IST = 6:30 PM previous day UTC)
export function getTodaysTheme(): Top10Theme {
    const now = new Date();

    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in ms
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    const istTime = new Date(utcTime + istOffset);

    // Get day of the year
    const startOfYear = new Date(istTime.getFullYear(), 0, 0);
    const diff = istTime.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Cycle through themes (50 themes)
    const themeIndex = dayOfYear % TOP10_THEMES.length;

    return TOP10_THEMES[themeIndex];
}

// Build RAWG API URL for the theme
export function buildTop10ApiUrl(theme: Top10Theme): string {
    const baseUrl = "https://api.rawg.io/api/games";
    const params = new URLSearchParams();

    params.set("page_size", "10");
    params.set("ordering", theme.ordering || "-rating");

    if (theme.genre) {
        params.set("genres", theme.genre);
    }

    if (theme.tag) {
        params.set("tags", theme.tag);
    }

    if (theme.year) {
        params.set("dates", `${theme.year}-01-01,${theme.year}-12-31`);
    }

    // Only games with metacritic score for quality
    params.set("metacritic", "1,100");

    return `${baseUrl}?${params.toString()}`;
}

export interface Top10Game {
    id: number;
    name: string;
    slug: string;
    background_image: string;
    rating: number;
    ratings_count: number;
    metacritic: number | null;
    playtime: number;
    released: string;
    genres: { id: number; name: string }[];
}

// Convert theme ID to SEO-friendly slug (e.g., "horror" -> "horror-games")
export function getSlugFromTheme(theme: Top10Theme): string {
    // Map of special slugs for better SEO
    const slugMap: Record<string, string> = {
        "horror": "horror-games",
        "horror-2025": "horror-games-2025",
        "story": "story-driven-games",
        "emotional": "emotional-games",
        "action": "action-games",
        "adventure": "adventure-games",
        "action-2025": "action-games-2025",
        "rpg": "best-rpgs",
        "jrpg": "best-jrpgs",
        "rpg-2025": "best-rpgs-2025",
        "openworld": "open-world-games",
        "sandbox": "sandbox-games",
        "indie": "indie-games",
        "indie-2025": "indie-games-2025",
        "multiplayer": "multiplayer-games",
        "coop": "co-op-games",
        "pvp": "competitive-games",
        "puzzle": "puzzle-games",
        "platformer": "platformer-games",
        "shooter": "shooter-games",
        "strategy": "strategy-games",
        "simulation": "simulation-games",
        "racing": "racing-games",
        "sports": "sports-games",
        "fighting": "fighting-games",
        "roguelike": "roguelike-games",
        "survival": "survival-games",
        "metroidvania": "metroidvania-games",
        "soulslike": "souls-like-games",
        "stealth": "stealth-games",
        "exploration": "exploration-games",
        "best-2025": "best-games-2025",
        "best-2024": "best-games-2024",
        "best-2023": "best-games-2023",
        "scifi": "sci-fi-games",
        "fantasy": "fantasy-games",
        "cyberpunk": "cyberpunk-games",
        "postapoc": "post-apocalyptic-games",
        "medieval": "medieval-games",
        "anime": "anime-games",
        "relaxing": "relaxing-games",
        "difficult": "hardest-games",
        "short": "short-games",
        "atmospheric": "atmospheric-games",
        "beautiful": "beautiful-games",
        "classic": "classic-games",
        "underrated": "underrated-gems",
        "free": "free-games",
        "singleplayer": "single-player-games",
    };

    return slugMap[theme.id] || theme.id;
}

// Get theme from SEO-friendly slug
export function getThemeFromSlug(slug: string): Top10Theme | null {
    // First try direct ID match
    const directMatch = TOP10_THEMES.find(t => t.id === slug);
    if (directMatch) return directMatch;

    // Then try slug match
    for (const theme of TOP10_THEMES) {
        if (getSlugFromTheme(theme) === slug) {
            return theme;
        }
    }

    return null;
}

// Generate a ranking reason based on game data
export function getRankingReason(game: Top10Game, rank: number, theme: Top10Theme): string {
    const reasons: string[] = [];

    // Metacritic-based reasons
    if (game.metacritic) {
        if (game.metacritic >= 95) {
            reasons.push("Universal critical acclaim");
        } else if (game.metacritic >= 90) {
            reasons.push("Outstanding reviews across the board");
        } else if (game.metacritic >= 85) {
            reasons.push("Highly praised by critics");
        } else if (game.metacritic >= 80) {
            reasons.push("Strong critical reception");
        }
    }

    // Rating-based reasons
    if (game.rating >= 4.5) {
        reasons.push("Beloved by the community");
    } else if (game.rating >= 4.0) {
        reasons.push("Fan favorite");
    }

    // Playtime-based reasons
    if (game.playtime >= 100) {
        reasons.push("Incredible depth and replayability");
    } else if (game.playtime >= 50) {
        reasons.push("Substantial content and lasting appeal");
    } else if (game.playtime >= 20) {
        reasons.push("Well-paced and engaging");
    } else if (game.playtime > 0 && game.playtime <= 10) {
        reasons.push("Tight, focused experience");
    }

    // Genre-specific reasons
    if (theme.genre === "horror" || theme.tag === "horror") {
        reasons.push("Masterful tension and atmosphere");
    }
    if (theme.tag === "story-rich" || theme.id === "story") {
        reasons.push("Unforgettable narrative");
    }
    if (theme.tag === "souls-like" || theme.id === "soulslike") {
        reasons.push("Rewarding challenge and tight combat");
    }
    if (theme.tag === "open-world" || theme.id === "openworld") {
        reasons.push("Vast world to explore");
    }
    if (theme.genre === "indie" || theme.id === "indie") {
        reasons.push("Creative vision and unique design");
    }

    // Rank-specific additions
    if (rank === 1) {
        return reasons.length > 0 ? reasons[0] + ". The definitive experience." : "The undisputed champion of the genre.";
    } else if (rank === 2) {
        return reasons.length > 0 ? reasons[0] + ". A close second." : "Nearly perfect in every way.";
    } else if (rank === 3) {
        return reasons.length > 0 ? reasons[0] + ". A true classic." : "A must-play for any fan.";
    }

    // Return a random reason or fallback
    if (reasons.length > 0) {
        return reasons[Math.min(rank - 1, reasons.length - 1) % reasons.length];
    }

    return "A standout title that earned its place.";
}
