"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Clock, ChevronRight } from "lucide-react";
import { getTodaysTheme, getSlugFromTheme, buildTop10ApiUrl, type Top10Game } from "@/lib/top10";

const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

async function fetchTop10Preview(): Promise<Top10Game[]> {
    const theme = getTodaysTheme();
    const url = buildTop10ApiUrl(theme);
    const response = await fetch(`${url}&key=${RAWG_API_KEY}`);

    if (!response.ok) return [];
    const data = await response.json();
    return data.results?.slice(0, 3) || [];
}

export function Top10Card() {
    const theme = getTodaysTheme();
    const slug = getSlugFromTheme(theme);

    const { data: previewGames } = useQuery({
        queryKey: ["top10-preview", theme.id],
        queryFn: fetchTop10Preview,
        staleTime: 1000 * 60 * 30,
    });

    return (
        <Link href={`/top-10/${slug}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.3 }}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 cursor-pointer"
            >
                {/* Subtle animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left side - Content */}
                        <div className="flex-1 min-w-0">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 mb-4">
                                <span className="text-lg">{theme.emoji}</span>
                                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Today's Top 10</span>
                            </div>

                            {/* Title */}
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                {theme.title}
                            </h2>

                            {/* Description */}
                            <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                                {theme.description}
                            </p>

                            {/* Update time */}
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Refreshes daily at 12:00 AM IST</span>
                            </div>
                        </div>

                        {/* Right side - Preview images */}
                        <div className="hidden sm:flex items-center gap-2">
                            {previewGames?.slice(0, 3).map((game, index) => (
                                <motion.div
                                    key={game.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative w-16 h-20 rounded-lg overflow-hidden border border-zinc-700/50 group-hover:border-zinc-600 transition-colors"
                                    style={{ zIndex: 3 - index }}
                                >
                                    {game.background_image && (
                                        <Image
                                            src={game.background_image}
                                            alt={game.name}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                        />
                                    )}
                                    {/* Rank badge */}
                                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white">#{index + 1}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-800/50">
                        <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                            View the full ranking
                        </span>
                        <motion.div
                            className="flex items-center gap-1 text-blue-400"
                            whileHover={{ x: 4 }}
                        >
                            <span className="text-sm font-medium">Explore</span>
                            <ChevronRight className="w-4 h-4" />
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
