"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Clock, TrendingUp, Flame } from "lucide-react";
import { TOP10_THEMES, buildTop10ApiUrl, type Top10Game, type Top10Theme } from "@/lib/top10";
import { useParams } from "next/navigation";

const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

async function fetchTop10Games(theme: Top10Theme): Promise<Top10Game[]> {
    const url = buildTop10ApiUrl(theme);
    const response = await fetch(`${url}&key=${RAWG_API_KEY}`);

    if (!response.ok) {
        console.error("Failed to fetch top 10:", response.status);
        return [];
    }

    const data = await response.json();
    return data.results || [];
}

// Rank badge with glow effect
function RankBadge({ rank }: { rank: number }) {
    const colors: Record<number, string> = {
        1: "from-yellow-400 to-amber-600 text-black shadow-yellow-500/50",
        2: "from-zinc-300 to-zinc-500 text-black shadow-zinc-400/50",
        3: "from-amber-600 to-orange-700 text-white shadow-orange-500/50",
    };

    const bgColor = colors[rank] || "from-zinc-700 to-zinc-800 text-white shadow-zinc-600/30";

    return (
        <div
            className={`absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br ${bgColor} flex items-center justify-center font-black text-xl md:text-2xl shadow-lg`}
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
                whileHover={{ x: 8, scale: 1.01 }}
                className="relative flex items-center gap-5 p-4 pl-10 bg-zinc-900/80 rounded-2xl border border-zinc-800 hover:border-blue-500/50 transition-all group shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-blue-500/10"
            >
                <RankBadge rank={rank} />

                {/* Game Image */}
                <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-xl overflow-hidden shrink-0 ml-6 shadow-lg">
                    <Image
                        src={game.background_image || "/placeholder-game.jpg"}
                        alt={game.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="112px"
                    />
                </div>

                {/* Game Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 text-lg md:text-xl">
                        {game.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-zinc-400">
                        {game.released && (
                            <span>{new Date(game.released).getFullYear()}</span>
                        )}
                        <span className="text-zinc-600">•</span>
                        {game.genres?.slice(0, 2).map(g => g.name).join(", ")}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3">
                        {game.rating > 0 && (
                            <span className="flex items-center gap-1.5 text-sm">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-yellow-400 font-semibold">{game.rating.toFixed(1)}</span>
                            </span>
                        )}
                        {game.metacritic && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-sm font-medium rounded-lg">
                                {game.metacritic}
                            </span>
                        )}
                        {game.playtime > 0 && (
                            <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                                <Clock className="w-4 h-4" />
                                {game.playtime}h avg
                            </span>
                        )}
                    </div>
                </div>

                {/* Hover indicator */}
                <div className="text-zinc-500 group-hover:text-blue-400 transition-colors">
                    <TrendingUp className="w-6 h-6" />
                </div>
            </motion.div>
        </Link>
    );
}

export default function Top10Page() {
    const params = useParams();
    const themeId = params.theme as string;

    // Find the theme
    const theme = TOP10_THEMES.find(t => t.id === themeId) || TOP10_THEMES[0];

    const { data: games, isLoading, error } = useQuery({
        queryKey: ["top10", theme.id],
        queryFn: () => fetchTop10Games(theme),
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    return (
        <main className="min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 py-4 px-4 md:px-8 glass-strong-2026 border-b border-white/5">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
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
                        <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
                            <span className="text-xl">{theme.emoji}</span>
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                                {theme.title}
                                <span className="text-xs font-normal text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">
                                    Updated Daily
                                </span>
                            </h1>
                            <p className="text-sm text-zinc-400">{theme.description}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-4 md:px-8 max-w-4xl mx-auto mt-6">
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-28 bg-zinc-800/50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : error || !games || games.length === 0 ? (
                    <div className="text-center py-16">
                        <Flame className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400">No games found for this category</p>
                        <Link href="/" className="text-blue-400 text-sm mt-2 hover:underline">
                            Go back home
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {games.slice(0, 10).map((game, index) => (
                            <Top10Item key={game.id} game={game} rank={index + 1} />
                        ))}
                    </div>
                )}


            </div>
        </main>
    );
}
