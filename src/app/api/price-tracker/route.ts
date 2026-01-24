import { NextRequest, NextResponse } from "next/server";

// CheapShark API
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

// USD to INR exchange rate (updated periodically)
// Using a reasonable estimate - in production, this could be fetched from an API
const USD_TO_INR = 83.5;

// Game aliases/slang for better search
const GAME_ALIASES: Record<string, string> = {
    // Rockstar games
    "gta 5": "Grand Theft Auto V",
    "gta5": "Grand Theft Auto V",
    "gtav": "Grand Theft Auto V",
    "gta v": "Grand Theft Auto V",
    "rdr2": "Red Dead Redemption 2",
    "rdr 2": "Red Dead Redemption 2",
    "red dead 2": "Red Dead Redemption 2",
    // Popular games
    "cod": "Call of Duty",
    "cod mw": "Call of Duty Modern Warfare",
    "cod mw2": "Call of Duty Modern Warfare II",
    "cod mw3": "Call of Duty Modern Warfare III",
    "csgo": "Counter-Strike Global Offensive",
    "cs2": "Counter-Strike 2",
    "cs 2": "Counter-Strike 2",
    "pubg": "PLAYERUNKNOWN'S BATTLEGROUNDS",
    "elden ring": "ELDEN RING",
    "botw": "The Legend of Zelda Breath of the Wild",
    "totk": "The Legend of Zelda Tears of the Kingdom",
    "hogwarts": "Hogwarts Legacy",
    "bg3": "Baldur's Gate 3",
    "baldurs gate 3": "Baldur's Gate 3",
    "witcher 3": "The Witcher 3",
    "minecraft": "Minecraft",
    "fortnite": "Fortnite",
    "valorant": "VALORANT",
    "apex": "Apex Legends",
    "fc24": "EA Sports FC 24",
    "fifa 24": "EA Sports FC 24",
    "nba 2k24": "NBA 2K24",
    "cyberpunk": "Cyberpunk 2077",
    "starfield": "Starfield",
    "ac mirage": "Assassin's Creed Mirage",
    "assassins creed": "Assassin's Creed",
    "horizon": "Horizon Zero Dawn",
    "god of war": "God of War",
    "gow ragnarok": "God of War Ragnarok",
    "spider man": "Marvel's Spider-Man",
    "spiderman": "Marvel's Spider-Man",
    "re4": "Resident Evil 4",
    "resident evil 4": "Resident Evil 4",
    "armored core": "Armored Core VI",
    "lies of p": "Lies of P",
    "alan wake 2": "Alan Wake 2",
    "tekken 8": "TEKKEN 8",
    "mortal kombat": "Mortal Kombat",
    "mk1": "Mortal Kombat 1",
    "street fighter 6": "Street Fighter 6",
    "sf6": "Street Fighter 6",
    "diablo 4": "Diablo IV",
    "d4": "Diablo IV",
    "palworld": "Palworld",
    "enshrouded": "Enshrouded",
    "lethal company": "Lethal Company",
    "helldivers 2": "HELLDIVERS 2",
};

interface CheapSharkGame {
    gameID: string;
    external: string;
    internalName: string;
    thumb: string;
    cheapest: string;
}

interface CheapSharkDeal {
    storeID: string;
    dealID: string;
    price: string;
    retailPrice: string;
    savings: string;
}

interface CheapSharkGameInfo {
    info: { title: string; steamAppID: string | null; thumb: string };
    cheapestPriceEver: { price: string; date: number };
    deals: CheapSharkDeal[];
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const query = searchParams.get("query");
    const gameId = searchParams.get("gameId");

    try {
        // SEARCH for games
        if (action === "search" && query) {
            const lowerQuery = query.toLowerCase().trim();

            // Check if it's an alias/slang
            const expandedQuery = GAME_ALIASES[lowerQuery] || query;

            console.log(`Searching CheapShark for: ${expandedQuery}`);
            const response = await fetch(
                `${CHEAPSHARK_BASE}/games?title=${encodeURIComponent(expandedQuery)}&limit=15`,
                { headers: { 'User-Agent': 'GameTale/1.0' } }
            );
            console.log("CheapShark Search Response:", response.status);

            if (!response.ok) {
                return NextResponse.json({ results: [] });
            }

            const games: CheapSharkGame[] = await response.json();

            // If alias search returned results, use those
            // Otherwise try the original query as fallback
            if (games.length === 0 && expandedQuery !== query) {
                const fallbackResponse = await fetch(
                    `${CHEAPSHARK_BASE}/games?title=${encodeURIComponent(query)}&limit=15`
                );
                if (fallbackResponse.ok) {
                    const fallbackGames: CheapSharkGame[] = await fallbackResponse.json();
                    return NextResponse.json({
                        results: fallbackGames.map(g => ({
                            id: g.gameID,
                            title: g.external,
                            slug: g.internalName,
                            thumb: g.thumb,
                            cheapest: parseFloat(g.cheapest),
                        }))
                    });
                }
            }

            return NextResponse.json({
                results: games.map(g => ({
                    id: g.gameID,
                    title: g.external,
                    slug: g.internalName,
                    thumb: g.thumb,
                    cheapest: parseFloat(g.cheapest),
                }))
            });
        }

        // GET PRICES for a specific game
        if (action === "prices" && gameId) {
            const response = await fetch(`${CHEAPSHARK_BASE}/games?id=${gameId}`, {
                headers: { 'User-Agent': 'GameTale/1.0' }
            });

            if (!response.ok) {
                return NextResponse.json({ deals: [], historicalLow: null });
            }

            const gameInfo: CheapSharkGameInfo = await response.json();

            const deals = (gameInfo.deals || [])
                .filter(deal => !DEFUNCT_STORES.has(deal.storeID)) // Filter defunct stores
                .map((deal, index) => {
                    const storeId = deal.storeID;
                    const storeName = STORE_NAMES[storeId] || `Store ${storeId}`;
                    const salePrice = parseFloat(deal.price) || 0;
                    const retailPrice = parseFloat(deal.retailPrice) || 0;

                    return {
                        id: `deal-${index}`,
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
                            amount: retailPrice,
                            amountINR: Math.round(retailPrice * USD_TO_INR),
                            currency: "INR",
                        },
                        cut: Math.round(parseFloat(deal.savings) || 0),
                        url: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
                    };
                }).sort((a, b) => a.price.amountINR - b.price.amountINR); // Sort by cheapest

            const historicalLow = gameInfo.cheapestPriceEver ? {
                price: {
                    amount: parseFloat(gameInfo.cheapestPriceEver.price),
                    amountINR: Math.round(parseFloat(gameInfo.cheapestPriceEver.price) * USD_TO_INR),
                    currency: "INR",
                },
                timestamp: new Date(gameInfo.cheapestPriceEver.date * 1000).toISOString(),
                shop: { id: "various", name: "Various Stores" },
            } : null;

            return NextResponse.json({
                deals,
                historicalLow,
                gameInfo: {
                    title: gameInfo.info?.title,
                    thumb: gameInfo.info?.thumb,
                    steamAppID: gameInfo.info?.steamAppID,
                }
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Price tracker API error:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
