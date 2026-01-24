"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Flame, Star, Clock, TrendingUp } from "lucide-react";
import { getTodaysTheme, buildTop10ApiUrl, type Top10Game, type Top10Theme } from "@/lib/top10";

const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

async function fetchTop10Games(theme: Top10Theme): Promise<Top10Game[]> {
    const url = buildTop10ApiUrl(theme);
    const response = await fetch(`${url}&key=${RAWG_API_KEY}`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
        console.error("Failed to fetch top 10:", response.status);
        return [];
    }

    const data = await response.json();
    return data.results || [];
}

// Rank badge with glow effect
function RankBadge({ rank }: { rank: number }) {
    const colors = {
        1: "from-yellow-400 to-amber-600 text-black shadow-yellow-500/50",
        2: "from-zinc-300 to-zinc-500 text-black shadow-zinc-400/50",
        3: "from-amber-600 to-orange-700 text-white shadow-orange-500/50",
    };

    const bgColor = colors[rank as keyof typeof colors] || "from-zinc-700 to-zinc-800 text-white shadow-zinc-600/30";

    return (
        <div
            className={`absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${bgColor} flex items-center justify-center font-black text-lg md:text-xl shadow-lg`}
        >
            {rank}
        </div>
    );
}

// Single Top 10 item row
function Top10Item({ game, rank }: { game: Top10Game; rank: number }) {
    return (
        <Link href={`/game/${game.slug}`}>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rank * 0.05 }}
                whileHover={{ x: 4, scale: 1.01 }}
                className="relative flex items-center gap-4 p-3 pl-8 bg-zinc-900/80 rounded-xl border border-zinc-800 hover:border-blue-500/50 transition-all group shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-blue-500/10"
            >
                <RankBadge rank={rank} />

                {/* Game Image */}
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden shrink-0 ml-4">
                    <Image
                        src={game.background_image || "/placeholder-game.jpg"}
                        alt={game.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="80px"
                    />
                </div>

                {/* Game Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1 text-sm md:text-base">
                        {game.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                        {game.released && (
                            <span>{new Date(game.released).getFullYear()}</span>
                        )}
                        {game.genres?.slice(0, 2).map(g => g.name).join(", ")}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-2">
                        {game.rating > 0 && (
                            <span className="flex items-center gap-1 text-xs">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-yellow-400 font-medium">{game.rating.toFixed(1)}</span>
                            </span>
                        )}
                        {game.metacritic && (
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                                {game.metacritic}
                            </span>
                        )}
                        {game.playtime > 0 && (
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                                <Clock className="w-3 h-3" />
                                {game.playtime}h
                            </span>
                        )}
                    </div>
                </div>

                {/* Hover indicator */}
                <div className="text-zinc-500 group-hover:text-blue-400 transition-colors">
                    <TrendingUp className="w-5 h-5" />
                </div>
            </motion.div>
        </Link>
    );
}

export function Top10Section() {
    const theme = getTodaysTheme();

    const { data: games, isLoading, error } = useQuery({
        queryKey: ["top10", theme.id],
        queryFn: () => fetchTop10Games(theme),
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    if (isLoading) {
        return (
            <section className="py-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
                        <Flame className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Today&apos;s Top 10</h2>
                        <p className="text-sm text-zinc-400">Loading...</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-24 bg-zinc-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            </section>
        );
    }

    if (error || !games || games.length === 0) {
        return null;
    }

    return (
        <section className="py-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
                    <span className="text-xl">{theme.emoji}</span>
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {theme.title}
                        <span className="text-xs font-normal text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">
                            Updated Daily
                        </span>
                    </h2>
                    <p className="text-sm text-zinc-400">{theme.description}</p>
                </div>
            </div>

            {/* Games List */}
            <div className="space-y-3">
                {games.slice(0, 10).map((game, index) => (
                    <Top10Item key={game.id} game={game} rank={index + 1} />
                ))}
            </div>

            {/* Tomorrow's preview */}
            <div className="mt-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
                <p className="text-sm text-zinc-500">
                    🕛 New Top 10 at <span className="text-blue-400 font-medium">12:00 AM IST</span>
                </p>
            </div>
        </section>
    );
}
