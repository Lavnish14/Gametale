"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, Clock, ExternalLink, Flame, Calendar } from "lucide-react";
import {
    TOP10_THEMES,
    buildTop10ApiUrl,
    getThemeFromSlug,
    getSlugFromTheme,
    getRankingReason,
    getTodaysTheme,
    type Top10Game,
    type Top10Theme
} from "@/lib/top10";

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

// Rank badge with premium styling
function RankBadge({ rank }: { rank: number }) {
    const styles: Record<number, { bg: string; text: string; glow: string }> = {
        1: {
            bg: "from-yellow-400 via-amber-500 to-yellow-600",
            text: "text-black",
            glow: "shadow-yellow-500/40 shadow-lg",
        },
        2: {
            bg: "from-slate-200 via-zinc-300 to-slate-400",
            text: "text-black",
            glow: "shadow-zinc-400/40 shadow-lg",
        },
        3: {
            bg: "from-amber-600 via-orange-600 to-amber-700",
            text: "text-white",
            glow: "shadow-orange-500/40 shadow-lg",
        },
    };

    const style = styles[rank] || {
        bg: "from-zinc-700 to-zinc-800",
        text: "text-white",
        glow: "",
    };

    const size = rank <= 3 ? "w-14 h-14 text-2xl" : "w-12 h-12 text-xl";

    return (
        <div
            className={`absolute -left-3 md:-left-4 top-1/2 -translate-y-1/2 z-20 ${size} rounded-full bg-gradient-to-br ${style.bg} ${style.text} ${style.glow} flex items-center justify-center font-black`}
        >
            {rank}
        </div>
    );
}

// Single game card in the ranking
function RankingGameCard({
    game,
    rank,
    theme
}: {
    game: Top10Game;
    rank: number;
    theme: Top10Theme;
}) {
    const isTopThree = rank <= 3;
    const reason = getRankingReason(game, rank, theme);

    return (
        <Link href={`/game/${game.slug}`}>
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rank * 0.05, duration: 0.4 }}
                whileHover={{ x: 8, scale: 1.005 }}
                className={`
                    relative flex items-center gap-4 md:gap-6
                    p-4 md:p-5 pl-10 md:pl-12
                    bg-zinc-900/80 rounded-2xl
                    border transition-all duration-300 cursor-pointer
                    ${isTopThree
                        ? "border-zinc-700 hover:border-blue-500/50 shadow-lg shadow-black/30"
                        : "border-zinc-800 hover:border-zinc-700"
                    }
                    group
                `}
            >
                <RankBadge rank={rank} />

                {/* Game Image */}
                <div className={`
                    relative rounded-xl overflow-hidden flex-shrink-0 ml-4 md:ml-6
                    ${isTopThree ? "w-24 h-24 md:w-32 md:h-32" : "w-20 h-20 md:w-24 md:h-24"}
                    shadow-lg shadow-black/30
                `}>
                    <Image
                        src={game.background_image || "/placeholder-game.jpg"}
                        alt={game.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes={isTopThree ? "128px" : "96px"}
                    />
                </div>

                {/* Game Info */}
                <div className="flex-1 min-w-0 py-1">
                    <h3 className={`
                        font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1
                        ${isTopThree ? "text-lg md:text-xl" : "text-base md:text-lg"}
                    `}>
                        {game.name}
                    </h3>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-zinc-400">
                        {game.released && (
                            <span>{new Date(game.released).getFullYear()}</span>
                        )}
                        {game.genres?.length > 0 && (
                            <>
                                <span className="text-zinc-600">|</span>
                                <span className="line-clamp-1">
                                    {game.genres.slice(0, 2).map(g => g.name).join(", ")}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Reason for ranking */}
                    <p className={`
                        mt-2 text-zinc-500 line-clamp-2
                        ${isTopThree ? "text-sm" : "text-xs"}
                    `}>
                        {reason}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-3">
                        {game.rating > 0 && (
                            <span className="flex items-center gap-1.5 text-sm">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-yellow-400 font-semibold">{game.rating.toFixed(1)}</span>
                            </span>
                        )}
                        {game.metacritic && (
                            <span className={`
                                px-2 py-0.5 rounded-md text-sm font-medium
                                ${game.metacritic >= 90
                                    ? "bg-green-500/20 text-green-400"
                                    : game.metacritic >= 75
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-zinc-700 text-zinc-300"
                                }
                            `}>
                                {game.metacritic}
                            </span>
                        )}
                        {game.playtime > 0 && (
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                                <Clock className="w-3.5 h-3.5" />
                                {game.playtime}h avg
                            </span>
                        )}
                    </div>
                </div>

                {/* Hover arrow */}
                <div className="hidden md:flex items-center text-zinc-600 group-hover:text-blue-400 transition-colors">
                    <ExternalLink className="w-5 h-5" />
                </div>
            </motion.div>
        </Link>
    );
}

export default function Top10DetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    // Get theme from slug
    const theme = getThemeFromSlug(slug) || getTodaysTheme();

    const { data: games, isLoading, error } = useQuery({
        queryKey: ["top10-detail", theme.id],
        queryFn: () => fetchTop10Games(theme),
        staleTime: 1000 * 60 * 30,
    });

    return (
        <main className="min-h-screen pb-24 bg-zinc-950">
            {/* Header */}
            <header className="sticky top-0 z-40 py-4 px-4 md:px-8 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </motion.button>
                    </Link>

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                            <span className="text-xl">{theme.emoji}</span>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg md:text-xl font-bold text-white truncate">
                                {theme.title}
                            </h1>
                            <p className="text-xs text-zinc-500">{theme.description}</p>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-400">Daily refresh</span>
                    </div>
                </div>
            </header>

            <div className="px-4 md:px-8 max-w-4xl mx-auto mt-8">
                {/* Page intro */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                        {theme.title}
                    </h2>
                    <p className="text-zinc-400 max-w-xl mx-auto">
                        {theme.description}. Ranked by critic scores, player ratings, and cultural impact.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-zinc-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Refreshes daily at 12:00 AM IST</span>
                    </div>
                </motion.div>

                {/* Loading state */}
                {isLoading && (
                    <div className="space-y-4">
                        {[...Array(10)].map((_, i) => (
                            <div
                                key={i}
                                className={`
                                    bg-zinc-800/50 rounded-2xl animate-pulse
                                    ${i < 3 ? "h-36" : "h-28"}
                                `}
                            />
                        ))}
                    </div>
                )}

                {/* Error state */}
                {(error || (!isLoading && (!games || games.length === 0))) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <Flame className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 text-lg mb-2">No games found for this category</p>
                        <p className="text-zinc-600 text-sm mb-6">Check back later or explore other rankings</p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to home
                        </Link>
                    </motion.div>
                )}

                {/* Games list */}
                {!isLoading && games && games.length > 0 && (
                    <div className="space-y-4">
                        {games.slice(0, 10).map((game, index) => (
                            <RankingGameCard
                                key={game.id}
                                game={game}
                                rank={index + 1}
                                theme={theme}
                            />
                        ))}
                    </div>
                )}



                {/* Footer note */}
                <div className="mt-12 text-center text-xs text-zinc-600">
                    <p>Rankings are calculated using critic reviews, player ratings, and cultural impact.</p>
                    <p className="mt-1">Games from any year are eligible unless the category specifies a year.</p>
                </div>
            </div>
        </main>
    );
}
