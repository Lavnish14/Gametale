"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Image from "next/image";
import {
    ArrowLeft,
    Search,
    TrendingDown,
    Loader2,
    ExternalLink,
    History,
    Store,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Store colors for visual distinction
const STORE_COLORS: Record<string, string> = {
    "1": "#1b2838",  // Steam
    "3": "#00a651",  // Green Man Gaming
    "7": "#86328a",  // GOG
    "8": "#f56c2d",  // Origin
    "11": "#cc3333", // Humble
    "13": "#0070ff", // Ubisoft
    "15": "#f4760d", // Fanatical
    "23": "#ff6600", // GameBillet
    "25": "#313131", // Epic
    "27": "#ff7b00", // Gamesplanet
};

// Format price in INR
function formatINR(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Get discount badge color
function getDiscountColor(cut: number): string {
    if (cut >= 75) return "text-green-400 bg-green-500/20 border-green-500/30";
    if (cut >= 50) return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    if (cut >= 25) return "text-blue-400 bg-blue-500/20 border-blue-500/30";
    return "text-zinc-400 bg-zinc-500/20 border-zinc-500/30";
}

interface SearchResult {
    id: string;
    title: string;
    slug?: string;
    thumb?: string;
    cheapest?: number;
}

interface GameDeal {
    id: string;
    shop: { id: string; name: string };
    price: { amount: number; amountINR?: number; currency: string };
    regular: { amount: number; amountINR?: number; currency: string };
    cut: number;
    url: string;
}

interface HistoricalLow {
    price: { amount: number; amountINR?: number; currency: string };
    shop: { id: string; name: string };
    timestamp: string;
}

interface GameInfo {
    title?: string;
    thumb?: string;
    steamAppID?: string | null;
}

// Fetch search results from our API route
async function searchGameAPI(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];
    const response = await fetch(`/api/price-tracker?action=search&query=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
}

// Fetch game prices from our API route
async function getGamePricesAPI(gameId: string): Promise<{ deals: GameDeal[]; historicalLow: HistoricalLow | null; gameInfo: GameInfo | null }> {
    const response = await fetch(`/api/price-tracker?action=prices&gameId=${encodeURIComponent(gameId)}`);
    if (!response.ok) return { deals: [], historicalLow: null, gameInfo: null };
    const data = await response.json();
    return { deals: data.deals || [], historicalLow: data.historicalLow || null, gameInfo: data.gameInfo || null };
}

export default function PriceTrackerPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    const [selectedGameTitle, setSelectedGameTitle] = useState<string>("");
    const [selectedGameThumb, setSelectedGameThumb] = useState<string>("");

    // Search games using our API route
    const { data: searchResults, isLoading: searchLoading } = useQuery({
        queryKey: ["gameSearch", searchQuery],
        queryFn: () => searchGameAPI(searchQuery),
        enabled: searchQuery.length >= 2,
        staleTime: 1000 * 60 * 5,
    });

    // Get deals and historical low for selected game
    const { data: priceData, isLoading: dealsLoading } = useQuery({
        queryKey: ["gamePrices", selectedGameId],
        queryFn: () => getGamePricesAPI(selectedGameId!),
        enabled: !!selectedGameId,
    });

    const gameDeals = priceData?.deals || [];
    const historicalLow = priceData?.historicalLow;
    const gameInfo = priceData?.gameInfo;

    const handleGameSelect = (game: SearchResult) => {
        setSelectedGameId(game.id);
        setSelectedGameTitle(game.title);
        setSelectedGameThumb(game.thumb || "");
        setSearchQuery("");
    };

    return (
        <main className="min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 py-4 px-4 md:px-8 glass-strong-2026 border-b border-white/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-white" />
                            </motion.button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                                <TrendingDown className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-white">Price Tracker</h1>
                                <p className="text-xs text-zinc-400">Compare prices across all stores</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-4 md:px-8 max-w-4xl mx-auto mt-6">
                {/* Search */}
                <div className="relative mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search games (try: GTA 5, RDR2, Cyberpunk, Elden Ring...)"
                            className="w-full pl-12 pr-4 py-4 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        {searchLoading && (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
                        )}
                    </div>

                    {/* Search Results Dropdown with thumbnails */}
                    {searchResults && searchResults.length > 0 && searchQuery.length >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-50 shadow-xl max-h-80 overflow-y-auto"
                        >
                            {searchResults.map((game) => (
                                <button
                                    key={game.id}
                                    onClick={() => handleGameSelect(game)}
                                    className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors flex items-center gap-3"
                                >
                                    {game.thumb && (
                                        <Image
                                            src={game.thumb}
                                            alt={game.title}
                                            width={60}
                                            height={35}
                                            className="rounded object-cover"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <span className="text-white font-medium">{game.title}</span>
                                        {game.cheapest && (
                                            <span className="text-xs text-green-400 ml-2">
                                                from {formatINR(Math.round(game.cheapest * 83))}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* Selected Game Info */}
                {selectedGameId && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {/* Game Header with thumbnail */}
                        <div className="flex items-start gap-4 mb-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                            {(gameInfo?.thumb || selectedGameThumb) && (
                                <Image
                                    src={gameInfo?.thumb || selectedGameThumb}
                                    alt={selectedGameTitle}
                                    width={120}
                                    height={70}
                                    className="rounded-lg object-cover"
                                />
                            )}
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-white">{gameInfo?.title || selectedGameTitle}</h2>
                                <p className="text-sm text-zinc-400 mt-1">
                                    {gameDeals.length} stores compared • Prices in ₹ (INR)
                                </p>
                            </div>
                        </div>

                        {/* Historical Low */}
                        {historicalLow && (
                            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <History className="w-4 h-4 text-green-400" />
                                    <span className="text-sm font-medium text-green-400">Historical Low</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-bold text-green-400">
                                        {formatINR(historicalLow.price.amountINR || historicalLow.price.amount * 83)}
                                    </span>
                                    <span className="text-zinc-400 text-sm">
                                        ({new Date(historicalLow.timestamp).toLocaleDateString()})
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Price Comparison Table */}
                        {dealsLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : gameDeals && gameDeals.length > 0 ? (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Store className="w-5 h-5" />
                                    Price Comparison
                                </h3>

                                {/* Table Header */}
                                <div className="hidden md:grid grid-cols-4 gap-4 px-4 py-2 text-xs font-medium text-zinc-500 uppercase border-b border-zinc-800">
                                    <span>Store</span>
                                    <span className="text-right">Price</span>
                                    <span className="text-right">Original</span>
                                    <span className="text-right">Discount</span>
                                </div>

                                {/* Price Rows */}
                                <div className="space-y-2 mt-2">
                                    {gameDeals.map((deal, index) => (
                                        <PriceRow key={index} deal={deal} isBest={index === 0} />
                                    ))}
                                </div>

                                <p className="text-xs text-zinc-500 mt-4 text-center">
                                    💡 Click any row to go directly to the store&apos;s purchase page
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-zinc-400">No deals found for this game</p>
                                <p className="text-sm text-zinc-500 mt-1">This game may not be available digitally</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Empty State */}
                {!selectedGameId && (
                    <div className="text-center py-16">
                        <TrendingDown className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-400 mb-2">
                            Track Game Prices
                        </h3>
                        <p className="text-zinc-500 max-w-md mx-auto mb-4">
                            Search for any game to compare prices across Steam, Epic Games, GOG,
                            Humble Bundle, and more.
                        </p>
                        <p className="text-sm text-blue-400">
                            💡 Try searching: GTA 5, RDR2, Cyberpunk, Elden Ring
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}

function PriceRow({ deal, isBest }: { deal: GameDeal; isBest: boolean }) {
    const shopColor = STORE_COLORS[deal.shop.id] || "#374151";
    const priceINR = deal.price.amountINR || Math.round(deal.price.amount * 83);
    const regularINR = deal.regular.amountINR || Math.round(deal.regular.amount * 83);

    return (
        <motion.a
            href={deal.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ x: 4 }}
            className={cn(
                "grid grid-cols-2 md:grid-cols-4 gap-4 items-center p-4 rounded-xl border transition-all group",
                isBest
                    ? "bg-green-500/10 border-green-500/30 hover:border-green-500/50"
                    : "bg-zinc-900/80 border-zinc-800 hover:border-blue-500/30"
            )}
        >
            {/* Store Name */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${shopColor}60` }}
                >
                    <span className="font-bold text-white text-sm">
                        {deal.shop.name.charAt(0)}
                    </span>
                </div>
                <div>
                    <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors text-sm">
                        {deal.shop.name}
                    </h4>
                    {isBest && (
                        <span className="text-xs text-green-400 font-medium">Best Price 🏆</span>
                    )}
                </div>
            </div>

            {/* Current Price */}
            <div className="text-right md:text-right">
                <span className={cn(
                    "text-lg font-bold",
                    isBest ? "text-green-400" : "text-white"
                )}>
                    {formatINR(priceINR)}
                </span>
            </div>

            {/* Original Price */}
            <div className="hidden md:block text-right">
                {deal.cut > 0 && (
                    <span className="text-sm text-zinc-500 line-through">
                        {formatINR(regularINR)}
                    </span>
                )}
            </div>

            {/* Discount */}
            <div className="flex items-center justify-end gap-2">
                {deal.cut > 0 && (
                    <span className={cn(
                        "text-sm font-bold px-2.5 py-1 rounded-full border",
                        getDiscountColor(deal.cut)
                    )}>
                        −{deal.cut}%
                    </span>
                )}
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
            </div>
        </motion.a>
    );
}
