/**
 * IsThereAnyDeal API Integration
 * For game deals, sales, and price tracking
 */

const ITAD_API_KEY = process.env.NEXT_PUBLIC_ISTHEREANYDEAL_API_KEY || "";
const ITAD_BASE_URL = "https://api.isthereanydeal.com";

export interface GameDeal {
    id: string;
    title: string;
    slug: string;
    shop: {
        id: string;
        name: string;
    };
    price: {
        amount: number;
        amountInt: number;
        currency: string;
    };
    regular: {
        amount: number;
        amountInt: number;
        currency: string;
    };
    cut: number; // Discount percentage
    url: string;
    drm: string[];
    platforms: string[];
    timestamp: string;
    expiry?: string;
}

export interface GamePrice {
    id: string;
    title: string;
    deals: GameDeal[];
}

export interface HistoricalLow {
    shop: {
        id: string;
        name: string;
    };
    price: {
        amount: number;
        currency: string;
    };
    regular: {
        amount: number;
        currency: string;
    };
    cut: number;
    timestamp: string;
}

export interface PriceHistoryPoint {
    timestamp: string;
    price: number;
    shop: string;
}

// Shop name mapping for display
export const SHOP_NAMES: Record<string, string> = {
    steam: "Steam",
    epic: "Epic Games",
    gog: "GOG",
    humble: "Humble Bundle",
    greenmangaming: "Green Man Gaming",
    fanatical: "Fanatical",
    gamersgate: "GamersGate",
    wingamestore: "WinGameStore",
    amazon: "Amazon",
    microsoft: "Microsoft Store",
};

// Shop logos/colors
export const SHOP_COLORS: Record<string, string> = {
    steam: "#1b2838",
    epic: "#313131",
    gog: "#86328a",
    humble: "#cc3333",
    greenmangaming: "#00a651",
    fanatical: "#f4760d",
};

/**
 * Search for a game on IsThereAnyDeal
 */
export async function searchGame(query: string): Promise<Array<{ id: string; title: string; slug: string }>> {
    if (!query || !ITAD_API_KEY) {
        return [];
    }

    try {
        const response = await fetch(
            `${ITAD_BASE_URL}/games/search/v1?key=${ITAD_API_KEY}&title=${encodeURIComponent(query)}&results=10`
        );

        if (!response.ok) {
            console.error("ITAD search error:", response.status);
            return [];
        }

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.warn("Failed to search ITAD (may be CORS issue):", error);
        return [];
    }
}

/**
 * Get current deals/prices for a game
 */
export async function getGameDeals(gameId: string): Promise<GameDeal[]> {
    if (!gameId || !ITAD_API_KEY) {
        console.warn("Missing gameId or ITAD API key");
        return [];
    }

    try {
        const response = await fetch(
            `${ITAD_BASE_URL}/games/prices/v2?key=${ITAD_API_KEY}&id=${gameId}&country=US`,
            {
                next: { revalidate: 300 }, // 5 minute cache
            }
        );

        if (!response.ok) {
            console.error("ITAD deals error:", response.status);
            return [];
        }

        const data = await response.json();
        const rawDeals = data?.[0]?.deals || [];

        // Normalize deals
        return rawDeals
            .map((deal: Record<string, unknown>, index: number) => normalizeDeal(deal, index))
            .filter((deal: GameDeal | null): deal is GameDeal => deal !== null);
    } catch (error) {
        // Silently fail on CORS/network errors - this is expected in browser
        console.warn("Failed to get game deals (may be CORS issue):", error);
        return [];
    }
}

/**
 * Normalize deal data from API to our interface
 */
function normalizeDeal(deal: Record<string, unknown>, index: number): GameDeal | null {
    // Handle various API response formats
    const shop = deal.shop as Record<string, unknown> | undefined;
    const price = deal.price as Record<string, unknown> | undefined;
    const regular = deal.regular as Record<string, unknown> | undefined;

    // Skip if missing essential data
    if (!shop || !price) return null;

    return {
        id: (deal.id as string) || `deal-${index}`,
        title: (deal.title as string) || "Unknown Game",
        slug: (deal.slug as string) || "",
        shop: {
            id: (shop.id as string) || "unknown",
            name: (shop.name as string) || "Unknown Store",
        },
        price: {
            amount: (price.amount as number) || 0,
            amountInt: (price.amountInt as number) || 0,
            currency: (price.currency as string) || "USD",
        },
        regular: regular ? {
            amount: (regular.amount as number) || (price.amount as number) || 0,
            amountInt: (regular.amountInt as number) || 0,
            currency: (regular.currency as string) || "USD",
        } : {
            amount: (price.amount as number) || 0,
            amountInt: 0,
            currency: "USD",
        },
        cut: (deal.cut as number) || 0,
        url: (deal.url as string) || "#",
        drm: (deal.drm as string[]) || [],
        platforms: (deal.platforms as string[]) || [],
        timestamp: (deal.timestamp as string) || new Date().toISOString(),
        expiry: deal.expiry as string | undefined,
    };
}

/**
 * Get current hot deals (most discounted)
 */
export async function getHotDeals(
    limit: number = 20,
    offset: number = 0
): Promise<GameDeal[]> {
    if (!ITAD_API_KEY) {
        console.warn("ITAD API key not configured");
        return [];
    }

    try {
        const response = await fetch(
            `${ITAD_BASE_URL}/deals/v2?key=${ITAD_API_KEY}&country=US&limit=${limit}&offset=${offset}&sort=-cut`,
            {
                next: { revalidate: 300 }, // 5 minute cache
            }
        );

        if (!response.ok) {
            console.error("ITAD hot deals error:", response.status);
            return [];
        }

        const data = await response.json();
        const rawDeals = data?.list || [];

        // Normalize and filter valid deals
        return rawDeals
            .map((deal: Record<string, unknown>, index: number) => normalizeDeal(deal, index))
            .filter((deal: GameDeal | null): deal is GameDeal => deal !== null);
    } catch (error) {
        console.error("Failed to get hot deals:", error);
        return [];
    }
}

/**
 * Get deals from a specific shop
 */
export async function getShopDeals(
    shop: "steam" | "epic" | "gog" | "humble",
    limit: number = 20
): Promise<GameDeal[]> {
    if (!ITAD_API_KEY) {
        console.warn("ITAD API key not configured");
        return [];
    }

    try {
        const response = await fetch(
            `${ITAD_BASE_URL}/deals/v2?key=${ITAD_API_KEY}&country=US&shops=${shop}&limit=${limit}&sort=-cut`,
            {
                next: { revalidate: 300 },
            }
        );

        if (!response.ok) {
            console.error(`ITAD ${shop} deals error:`, response.status);
            return [];
        }

        const data = await response.json();
        const rawDeals = data?.list || [];

        // Normalize and filter valid deals
        return rawDeals
            .map((deal: Record<string, unknown>, index: number) => normalizeDeal(deal, index))
            .filter((deal: GameDeal | null): deal is GameDeal => deal !== null);
    } catch (error) {
        console.error(`Failed to get ${shop} deals:`, error);
        return [];
    }
}

/**
 * Get historical low price for a game
 */
export async function getHistoricalLow(gameId: string): Promise<HistoricalLow | null> {
    if (!gameId || !ITAD_API_KEY) return null;

    try {
        const response = await fetch(
            `${ITAD_BASE_URL}/games/storelow/v2?key=${ITAD_API_KEY}&id=${gameId}&country=US`,
            {
                next: { revalidate: 3600 }, // 1 hour cache
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data?.[0] || null;
    } catch (error) {
        console.error("Failed to get historical low:", error);
        return null;
    }
}

/**
 * Format price with currency
 */
export function formatPrice(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(amount);
}

/**
 * Calculate savings
 */
export function calculateSavings(regular: number, sale: number): number {
    return regular - sale;
}

/**
 * Get discount badge color based on percentage
 */
export function getDiscountColor(cut: number): string {
    if (cut >= 75) return "text-green-400 bg-green-500/20 border-green-500/30";
    if (cut >= 50) return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    if (cut >= 25) return "text-blue-400 bg-blue-500/20 border-blue-500/30";
    return "text-zinc-400 bg-zinc-500/20 border-zinc-500/30";
}

/**
 * Check if a deal is expiring soon (within 24 hours)
 */
export function isExpiringSoon(expiry?: string): boolean {
    if (!expiry) return false;
    const expiryDate = new Date(expiry);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return expiryDate <= tomorrow;
}

/**
 * Format time remaining for deal
 */
export function formatTimeRemaining(expiry: string): string {
    const expiryDate = new Date(expiry);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) return "Expired";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;

    const minutes = Math.floor(diffMs / (1000 * 60));
    return `${minutes}m left`;
}

