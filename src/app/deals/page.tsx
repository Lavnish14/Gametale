"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Tag, Loader2, Store, Flame, Clock, Percent, RefreshCw } from "lucide-react";
import Link from "next/link";

import { DealCard } from "@/components/deal-card";
import { type GameDeal } from "@/lib/deals";
import { cn } from "@/lib/utils";

const SHOPS = [
    { id: "all", label: "All Stores", icon: <Store className="w-4 h-4" /> },
    { id: "steam", label: "Steam", icon: "🎮" },
    { id: "epic", label: "Epic Games", icon: "🎯" },
    { id: "gog", label: "GOG", icon: "🌟" },
    { id: "humble", label: "Humble", icon: "🎁" },
] as const;

type ShopId = (typeof SHOPS)[number]["id"];

const SORT_OPTIONS = [
    { id: "discount", label: "Biggest Discount", icon: <Percent className="w-4 h-4" />, apiSort: "discount" },
    { id: "popular", label: "Most Popular", icon: <Flame className="w-4 h-4" />, apiSort: "popular" },
    { id: "recent", label: "Newest Deals", icon: <Clock className="w-4 h-4" />, apiSort: "recent" },
];

// Fetch deals from our API route with sort parameter
async function fetchDeals(shop: string, sort: string): Promise<GameDeal[]> {
    const response = await fetch(`/api/deals?shop=${shop}&sort=${sort}&limit=60`);
    if (!response.ok) {
        throw new Error("Failed to fetch deals");
    }
    const data = await response.json();
    return data.deals || [];
}

export default function DealsPage() {
    const [selectedShop, setSelectedShop] = useState<ShopId>("all");
    const [sortBy, setSortBy] = useState("discount");
    const queryClient = useQueryClient();

    // Find the API sort value
    const apiSort = SORT_OPTIONS.find(o => o.id === sortBy)?.apiSort || "discount";

    const { data: deals, isLoading, error, isFetching } = useQuery({
        queryKey: ["deals", selectedShop, apiSort],
        queryFn: () => fetchDeals(selectedShop, apiSort),
        staleTime: 1000 * 60 * 3, // 3 minutes
        refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
        refetchOnWindowFocus: true,
    });

    // Manual refresh function
    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ["deals"] });
    };

    // Filter valid deals
    const validDeals = deals ? deals.filter((d) => d && d.shop && d.title) : [];

    // Featured deals (75%+ off)
    const featuredDeals = validDeals.filter((d) => (d.cut || 0) >= 75).slice(0, 3);
    const regularDeals = validDeals.filter((d) => !featuredDeals.includes(d));

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
                            <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                                <Tag className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-white">Game Deals</h1>
                                <p className="text-xs text-zinc-400">
                                    {validDeals.length} deals found • Auto-updates
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Refresh button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRefresh}
                        disabled={isFetching}
                        className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-5 h-5 text-zinc-400", isFetching && "animate-spin")} />
                    </motion.button>
                </div>
            </header>

            {/* Shop Filters */}
            <div className="px-4 md:px-8 max-w-7xl mx-auto mt-6">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {SHOPS.map((shop) => (
                        <button
                            key={shop.id}
                            onClick={() => setSelectedShop(shop.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                selectedShop === shop.id
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            )}
                        >
                            {typeof shop.icon === "string" ? (
                                <span>{shop.icon}</span>
                            ) : (
                                shop.icon
                            )}
                            {shop.label}
                        </button>
                    ))}
                </div>

                {/* Sort Options */}
                <div className="flex gap-2 mt-4">
                    {SORT_OPTIONS.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setSortBy(option.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                sortBy === option.id
                                    ? "bg-zinc-700 text-white"
                                    : "bg-zinc-800/30 text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 md:px-8 max-w-7xl mx-auto mt-6">
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <Tag className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400">Failed to load deals</p>
                        <button
                            onClick={handleRefresh}
                            className="text-sm text-blue-400 mt-2 hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                ) : validDeals.length === 0 ? (
                    <div className="text-center py-16">
                        <Tag className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400">No deals found</p>
                        <p className="text-sm text-zinc-500 mt-1">Try selecting a different store</p>
                    </div>
                ) : (
                    <>
                        {/* Featured Deals (75%+ off) */}
                        {featuredDeals.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Flame className="w-5 h-5 text-red-500" />
                                    <h2 className="text-lg font-semibold text-white">Hot Deals</h2>
                                    <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                                        75%+ OFF
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {featuredDeals.map((deal, index) => (
                                        <motion.div
                                            key={deal.id || index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <DealCard deal={deal} priority variant="featured" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regular Deals Grid */}
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-4">All Deals</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {regularDeals.map((deal, index) => (
                                    <motion.div
                                        key={deal.id || index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(index * 0.02, 0.3) }}
                                    >
                                        <DealCard deal={deal} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
