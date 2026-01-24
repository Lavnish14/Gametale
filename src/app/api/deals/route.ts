import { NextRequest, NextResponse } from "next/server";

// CheapShark API (free, reliable)
const CHEAPSHARK_BASE = "https://www.cheapshark.com/api/1.0";

// Complete store name mapping for ALL CheapShark store IDs
const STORE_NAMES: Record<string, string> = {
    "1": "Steam",
    "2": "GamersGate",
    "3": "Green Man Gaming",
    "4": "Amazon",
    "5": "GameStop",
    "6": "Direct2Drive",
    "7": "GOG",
    "8": "Origin",
    "9": "Get Games",
    "10": "Shiny Loot",
    "11": "Humble Bundle",
    "12": "Desura",
    "13": "Ubisoft Connect",
    "14": "IndieGameStand",
    "15": "Fanatical",
    "16": "Gamesrocket",
    "17": "Games Republic",
    "18": "SilaGames",
    "19": "Playfield",
    "20": "Imperial Games",
    "21": "WinGameStore",
    "22": "FunStock Digital",
    "23": "GameBillet",
    "24": "Voidu",
    "25": "Epic Games Store",
    "26": "Razer Game Store",
    "27": "Gamesplanet",
    "28": "Gamesload",
    "29": "2Game",
    "30": "IndieGala",
    "31": "Blizzard",
    "32": "AllYouPlay",
    "33": "DLGamer",
    "34": "Noctre",
    "35": "DreamGame",
};

// Defunct/inactive stores to filter out
const DEFUNCT_STORES = new Set([
    "6",  // Direct2Drive - defunct
    "9",  // Get Games - defunct
    "10", // Shiny Loot - defunct
    "12", // Desura - defunct since 2015
    "14", // IndieGameStand - defunct
    "16", // Gamesrocket - inactive
    "17", // Games Republic - defunct
    "18", // SilaGames - defunct
    "19", // Playfield - defunct
    "20", // Imperial Games - defunct
    "22", // FunStock Digital - defunct
    "26", // Razer Game Store - defunct
]);

// Cache for exchange rate
let cachedExchangeRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
const DEFAULT_USD_TO_INR = 83.5; // Fallback rate

/**
 * Fetch current USD to INR exchange rate
 * Uses free API with caching to avoid rate limits
 */
async function getExchangeRate(): Promise<number> {
    // Check cache first
    if (cachedExchangeRate && Date.now() - cachedExchangeRate.timestamp < CACHE_DURATION) {
        return cachedExchangeRate.rate;
    }

    try {
        // Use free exchange rate API (no API key required)
        const response = await fetch(
            "https://api.exchangerate-api.com/v4/latest/USD",
            { next: { revalidate: 21600 } } // Cache for 6 hours
        );

        if (!response.ok) {
            throw new Error(`Exchange rate API error: ${response.status}`);
        }

        const data = await response.json();
        const rate = data.rates?.INR;

        if (typeof rate === "number" && rate > 0) {
            cachedExchangeRate = { rate, timestamp: Date.now() };
            return rate;
        }

        throw new Error("Invalid exchange rate data");
    } catch {
        // Fallback to cached value if available, otherwise use default
        if (cachedExchangeRate) {
            return cachedExchangeRate.rate;
        }
        return DEFAULT_USD_TO_INR;
    }
}

interface CheapSharkDeal {
    internalName: string;
    title: string;
    dealID: string;
    storeID: string;
    gameID: string;
    salePrice: string;
    normalPrice: string;
    savings: string;
    metacriticScore: string;
    steamRatingPercent: string;
    steamRatingCount: string;
    thumb: string;
    lastChange: number;
    dealRating: string;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const storeFilter = searchParams.get("shop") || "all";
    const sortBy = searchParams.get("sort") || "discount";
    const limit = parseInt(searchParams.get("limit") || "60");

    try {
        // Get current exchange rate
        const USD_TO_INR = await getExchangeRate();

        // Map sort options to CheapShark API params
        let sortParam = "Savings";
        if (sortBy === "popular") {
            sortParam = "DealRating";
        } else if (sortBy === "recent") {
            sortParam = "Recent";
        }

        let url = `${CHEAPSHARK_BASE}/deals?pageSize=${limit}&sortBy=${sortParam}&desc=1&onSale=1`;

        // Map our shop names to CheapShark store IDs
        const storeMap: Record<string, string> = {
            steam: "1",
            epic: "25",
            gog: "7",
            humble: "11",
        };

        if (storeFilter !== "all" && storeMap[storeFilter]) {
            url += `&storeID=${storeMap[storeFilter]}`;
        }

        const response = await fetch(url, {
            next: { revalidate: 180 },
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'GameTale/1.0'
            }
        });

        if (!response.ok) {
            return NextResponse.json({ deals: [], error: "API error" });
        }

        const rawDeals: CheapSharkDeal[] = await response.json();

        if (!Array.isArray(rawDeals)) {
            return NextResponse.json({ deals: [], error: "Invalid data" });
        }

        // Transform and filter deals
        const deals = rawDeals
            .filter(deal => parseFloat(deal.savings) >= 0)
            .filter(deal => !DEFUNCT_STORES.has(deal.storeID))
            .map((deal, index) => {
                const storeId = deal.storeID;
                const storeName = STORE_NAMES[storeId] || `Store ${storeId}`;
                const salePrice = parseFloat(deal.salePrice) || 0;
                const normalPrice = parseFloat(deal.normalPrice) || 0;
                const savings = parseFloat(deal.savings) || 0;
                const metacritic = parseInt(deal.metacriticScore) || 0;
                const steamRating = parseInt(deal.steamRatingPercent) || 0;
                const dealRating = parseFloat(deal.dealRating) || 0;

                // Get higher quality thumbnail
                const thumb = deal.thumb?.replace("capsule_sm_120", "header") || deal.thumb;

                return {
                    id: deal.dealID || `deal-${index}`,
                    gameId: deal.gameID,
                    title: deal.title || "Unknown Game",
                    slug: deal.internalName || "",
                    thumb: thumb,
                    shop: {
                        id: storeId,
                        name: storeName,
                    },
                    price: {
                        amount: salePrice,
                        amountINR: Math.round(salePrice * USD_TO_INR),
                        currency: "INR",
                    },
                    regular: {
                        amount: normalPrice,
                        amountINR: Math.round(normalPrice * USD_TO_INR),
                        currency: "INR",
                    },
                    cut: Math.round(savings),
                    url: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
                    metacritic: metacritic > 0 ? metacritic : null,
                    steamRating: steamRating > 0 ? steamRating : null,
                    dealRating: dealRating,
                    timestamp: new Date(deal.lastChange * 1000).toISOString(),
                    isLive: true,
                };
            });

        return NextResponse.json({
            deals,
            count: deals.length,
            lastUpdated: new Date().toISOString(),
            exchangeRate: USD_TO_INR
        });
    } catch (error) {
        return NextResponse.json({ deals: [], error: String(error) });
    }
}
