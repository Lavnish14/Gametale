/**
 * Gaming News API Integration
 * Uses NewsAPI for real-time gaming news
 */

const NEWS_API_KEY = process.env.NEWS_API_KEY || process.env.NEXT_PUBLIC_NEWS_API_KEY || "";
const NEWS_API_BASE = "https://newsapi.org/v2";

// Trusted gaming news sources only
const GAMING_SOURCES = [
    "ign.com",
    "kotaku.com",
    "polygon.com",
    "gamespot.com",
    "pcgamer.com",
    "eurogamer.net",
    "gamesradar.com",
    "rockpapershotgun.com",
    "destructoid.com",
    "vg247.com",
    "thegamer.com",
    "dualshockers.com",
    "pushsquare.com",
    "nintendolife.com",
    "purexbox.com",
].join(",");

// Keywords that indicate non-gaming content to filter out
const NON_GAMING_KEYWORDS = [
    "trump", "biden", "election", "congress", "senate", "politics",
    "stock market", "wall street", "cryptocurrency", "bitcoin",
    "ukraine", "russia", "israel", "gaza", "war",
    "covid", "pandemic", "vaccine",
    "climate change", "weather",
    "celebrity", "kardashian"
];

export interface NewsArticle {
    id: string;
    title: string;
    description: string;
    content: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    source: {
        id: string | null;
        name: string;
    };
    author: string | null;
}

export interface NewsResponse {
    status: string;
    totalResults: number;
    articles: NewsArticle[];
}

/**
 * Check if article is gaming-related
 */
function isGamingRelated(article: NewsArticle): boolean {
    const textToCheck = `${article.title} ${article.description || ""}`.toLowerCase();

    // Filter out non-gaming content
    for (const keyword of NON_GAMING_KEYWORDS) {
        if (textToCheck.includes(keyword.toLowerCase())) {
            return false;
        }
    }

    return true;
}

/**
 * Get gaming news from NewsAPI
 * Only from trusted gaming sources
 */
export async function getGamingNews(
    page: number = 1,
    pageSize: number = 20
): Promise<NewsResponse> {
    try {
        // Use domains parameter to limit to gaming sources
        const response = await fetch(
            `${NEWS_API_BASE}/everything?domains=${GAMING_SOURCES}&language=en&sortBy=publishedAt&page=${page}&pageSize=${Math.min(pageSize * 2, 100)}&apiKey=${NEWS_API_KEY}`,
            {
                next: { revalidate: 60 }, // Cache for 1 minute for real-time feel
            }
        );

        if (!response.ok) {
            console.error("NewsAPI error:", response.status);
            return { status: "error", totalResults: 0, articles: [] };
        }

        const data = await response.json();

        // Filter and add unique IDs to articles
        const articlesWithIds = (data.articles || [])
            .map((article: NewsArticle, index: number) => ({
                ...article,
                id: `${Date.now()}-${index}-${article.publishedAt}`,
            }))
            .filter(isGamingRelated)
            .slice(0, pageSize);

        return {
            status: data.status,
            totalResults: data.totalResults || 0,
            articles: articlesWithIds,
        };
    } catch (error) {
        console.error("Failed to fetch gaming news:", error);
        return { status: "error", totalResults: 0, articles: [] };
    }
}

/**
 * Get breaking/latest news (last hour)
 * Used for "Breaking News" badge
 */
export async function getBreakingNews(limit: number = 5): Promise<NewsArticle[]> {
    const response = await getGamingNews(1, limit);

    if (response.status !== "ok") return [];

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    return response.articles.filter(
        (article) => new Date(article.publishedAt) >= oneHourAgo
    );
}

/**
 * Search news by specific game or topic
 */
export async function searchNews(
    query: string,
    page: number = 1,
    pageSize: number = 10
): Promise<NewsResponse> {
    try {
        const response = await fetch(
            `${NEWS_API_BASE}/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&page=${page}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`,
            {
                next: { revalidate: 120 }, // Cache for 2 minutes
            }
        );

        if (!response.ok) {
            return { status: "error", totalResults: 0, articles: [] };
        }

        const data = await response.json();

        const articlesWithIds = data.articles?.map((article: NewsArticle, index: number) => ({
            ...article,
            id: `search-${Date.now()}-${index}`,
        })) || [];

        return {
            status: data.status,
            totalResults: data.totalResults || 0,
            articles: articlesWithIds,
        };
    } catch (error) {
        console.error("Failed to search news:", error);
        return { status: "error", totalResults: 0, articles: [] };
    }
}

/**
 * Get news by category
 */
export async function getNewsByCategory(
    category: "releases" | "reviews" | "esports" | "deals",
    page: number = 1,
    pageSize: number = 10
): Promise<NewsResponse> {
    const categoryQueries: Record<string, string> = {
        releases: "game release OR game launch OR new game announcement",
        reviews: "game review OR game rating",
        esports: "esports OR competitive gaming OR tournament",
        deals: "game sale OR gaming deals OR free games",
    };

    const query = categoryQueries[category] || "gaming";

    try {
        const response = await fetch(
            `${NEWS_API_BASE}/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&page=${page}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`,
            {
                next: { revalidate: 300 }, // 5 minute cache
            }
        );

        if (!response.ok) {
            return { status: "error", totalResults: 0, articles: [] };
        }

        const data = await response.json();

        const articlesWithIds = data.articles?.map((article: NewsArticle, index: number) => ({
            ...article,
            id: `${category}-${Date.now()}-${index}`,
        })) || [];

        return {
            status: data.status,
            totalResults: data.totalResults || 0,
            articles: articlesWithIds,
        };
    } catch (error) {
        console.error("Failed to fetch category news:", error);
        return { status: "error", totalResults: 0, articles: [] };
    }
}

/**
 * Check if an article is "breaking" (less than 1 hour old)
 */
export function isBreakingNews(publishedAt: string): boolean {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    return new Date(publishedAt) >= oneHourAgo;
}

/**
 * Format relative time (e.g., "5 minutes ago")
 */
export function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

