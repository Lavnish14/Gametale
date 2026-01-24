"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, X, Trophy, Flame, Ghost, Calendar } from "lucide-react";
import { getAllRankings, type RankingCategory } from "@/lib/rankings";
import type { Game } from "@/lib/rawg";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    "todays-top-10": <Flame className="w-4 h-4" />,
    "top-2026": <Trophy className="w-4 h-4" />,
    "horror-2025": <Ghost className="w-4 h-4" />,
};

export function RankingsCarousel() {
    const [selectedCategory, setSelectedCategory] = useState<RankingCategory | null>(null);

    const { data: rankings, isLoading } = useQuery({
        queryKey: ["rankings"],
        queryFn: () => getAllRankings(),
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    if (isLoading) {
        return (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="flex-shrink-0 w-24 h-32 rounded-xl bg-zinc-800/50 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (!rankings || rankings.length === 0) return null;

    return (
        <>
            {/* Stories-style carousel */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                {rankings.map((category, index) => (
                    <motion.button
                        key={category.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedCategory(category)}
                        className="flex-shrink-0 group"
                    >
                        <div className="relative w-24">
                            {/* Story ring */}
                            <div className="p-0.5 rounded-xl bg-gradient-to-br from-blue-500 via-red-500 to-pink-500">
                                <div className="relative w-full aspect-[3/4] rounded-[10px] overflow-hidden bg-zinc-900">
                                    {category.games[0]?.background_image && (
                                        <Image
                                            src={category.games[0].background_image}
                                            alt={category.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                                            sizes="96px"
                                        />
                                    )}
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                    {/* Icon */}
                                    <div className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
                                        <span className="text-lg">{category.icon}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <p className="text-xs text-zinc-300 text-center mt-2 line-clamp-2">
                                {category.title}
                            </p>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Full-screen modal for selected category */}
            <AnimatePresence>
                {selectedCategory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm"
                        onClick={() => setSelectedCategory(null)}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="h-full max-w-2xl mx-auto p-4 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6 sticky top-0 bg-black/80 backdrop-blur-sm py-4 -mt-4 -mx-4 px-4 z-10">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{selectedCategory.icon}</span>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {selectedCategory.title}
                                        </h2>
                                        <p className="text-sm text-zinc-400">
                                            {selectedCategory.subtitle}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
                                >
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>

                            {/* Games list */}
                            <div className="space-y-3">
                                {selectedCategory.games.map((game, index) => (
                                    <RankingGameCard
                                        key={game.id}
                                        game={game}
                                        rank={index + 1}
                                        onClick={() => setSelectedCategory(null)}
                                    />
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="text-center text-xs text-zinc-500 mt-6 pb-8">
                                <div className="flex items-center justify-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    <span>Refreshes daily at 12:00 AM IST</span>
                                </div>
                                <p className="mt-1">Last updated: {selectedCategory.lastUpdated}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function RankingGameCard({
    game,
    rank,
    onClick,
}: {
    game: Game;
    rank: number;
    onClick: () => void;
}) {
    const getRankStyle = (rank: number) => {
        if (rank === 1) return "bg-gradient-to-br from-yellow-500 to-amber-600 text-black";
        if (rank === 2) return "bg-gradient-to-br from-zinc-300 to-zinc-400 text-black";
        if (rank === 3) return "bg-gradient-to-br from-blue-600 to-blue-700 text-white";
        return "bg-zinc-800 text-white";
    };

    return (
        <Link href={`/game/${game.id}`} onClick={onClick}>
            <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-blue-500/30 transition-all group"
            >
                {/* Rank */}
                <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${getRankStyle(rank)}`}
                >
                    {rank}
                </div>

                {/* Game image */}
                <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    {game.background_image && (
                        <Image
                            src={game.background_image}
                            alt={game.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                        />
                    )}
                </div>

                {/* Game info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                        {game.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        {game.metacritic && (
                            <span className="text-green-400">{game.metacritic}</span>
                        )}
                        {game.released && (
                            <span>{new Date(game.released).getFullYear()}</span>
                        )}
                    </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
            </motion.div>
        </Link>
    );
}

