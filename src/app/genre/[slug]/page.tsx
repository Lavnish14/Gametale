"use client";

import { use, useState, useRef, useCallback } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Filter, ChevronDown, Loader2, Trophy, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { GameCard } from "@/components/game-card";
import { SkeletonGrid } from "@/components/skeleton-card";
import { getGamesByGenre, POPULAR_GENRES, getYearOptions } from "@/lib/rawg";
import { cn, getRatingClass } from "@/lib/utils";

interface GenrePageProps {
    params: Promise<{ slug: string }>;
}

const FILTER_OPTIONS = [
    { label: "Popular", value: "-added" },
    { label: "Newest", value: "-released" },
    { label: "Top Rated", value: "-metacritic" },
    { label: "Name A-Z", value: "name" },
];

export default function GenrePage({ params }: GenrePageProps) {
    const { slug } = use(params);
    const [ordering, setOrdering] = useState("-added");
    const [year, setYear] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    // Find genre name from slug
    const genreInfo = POPULAR_GENRES.find(g => g.slug === slug);
    const genreName = genreInfo?.name || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    // Infinite Query for games
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isFetching,
    } = useInfiniteQuery({
        queryKey: ["genre", slug, ordering, year],
        queryFn: ({ pageParam = 1 }) => getGamesByGenre(slug, {
            page: pageParam,
            pageSize: 24,
            ordering,
            year: year || undefined,
        }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.next ? allPages.length + 1 : undefined;
        },
    });

    // Intersection Observer for infinite scrolling
    const observer = useRef<IntersectionObserver | null>(null);
    const lastGameElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading || isFetchingNextPage) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

    // Fetch top-rated game for hero banner
    const { data: featuredGame } = useQuery({
        queryKey: ["genreFeatured", slug],
        queryFn: async () => {
            const response = await getGamesByGenre(slug, {
                page: 1,
                pageSize: 1,
                ordering: "-metacritic",
                metacritic: "85,100",
            });
            return response.results[0] || null;
        },
    });

    const yearOptions = getYearOptions();
    const games = data?.pages.flatMap(page => page.results) || [];
    const totalCount = data?.pages[0]?.count || 0;

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
                                className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors glow-on-hover"
                            >
                                <ArrowLeft className="w-5 h-5 text-white" />
                            </motion.button>
                        </Link>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold gradient-text-2026">{genreName}</h1>
                            <p className="text-xs text-zinc-400">
                                {totalCount ? `${totalCount.toLocaleString()} games` : "Loading..."}
                            </p>
                        </div>
                    </div>

                    {/* Filter Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl transition-colors",
                            showFilters
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 glow-on-hover"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Filters</span>
                    </motion.button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="max-w-7xl mx-auto mt-4 p-4 rounded-xl glass-2026"
                    >
                        <div className="flex flex-wrap gap-4">
                            {/* Sort By */}
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-xs text-zinc-500 block mb-2">Sort By</label>
                                <div className="relative">
                                    <select
                                        value={ordering}
                                        onChange={(e) => setOrdering(e.target.value)}
                                        className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                    >
                                        {FILTER_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Year Filter */}
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-xs text-zinc-500 block mb-2">Year</label>
                                <div className="relative">
                                    <select
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">All Years</option>
                                        {yearOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {(ordering !== "-added" || year) && (
                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setOrdering("-added");
                                            setYear("");
                                        }}
                                        className="px-4 py-2.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </header>

            {/* Featured Game Hero Banner */}
            {featuredGame && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 md:px-8 max-w-7xl mx-auto mt-6"
                >
                    <Link href={`/game/${featuredGame.id}`}>
                        <div className="relative h-[200px] md:h-[280px] rounded-2xl overflow-hidden group">
                            {featuredGame.background_image && (
                                <Image
                                    src={featuredGame.background_image}
                                    alt={featuredGame.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    priority
                                />
                            )}
                            {/* Gradient Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#030305] via-[#030305]/70 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-transparent to-transparent" />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                                {/* Badge */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                                        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                                        <span className="text-xs font-bold text-yellow-400">TOP RATED {genreName.toUpperCase()}</span>
                                    </div>
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                                    {featuredGame.name}
                                </h2>

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-sm text-zinc-300">
                                    {featuredGame.metacritic && (
                                        <span className={cn("rating-badge text-sm", getRatingClass(featuredGame.metacritic))}>
                                            {featuredGame.metacritic}
                                        </span>
                                    )}
                                    {featuredGame.released && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-zinc-400" />
                                            <span>{new Date(featuredGame.released).getFullYear()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            )}

            {/* Games Grid */}
            <div className="px-4 md:px-8 max-w-7xl mx-auto mt-8">
                {isLoading ? (
                    <SkeletonGrid count={12} />
                ) : (
                    <>
                        {isFetching && !isFetchingNextPage && (
                            <div className="text-center text-sm text-zinc-400 mb-4">
                                Updating results...
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {games.map((game, index) => {
                                // Apply ref to the last element of the list
                                if (index === games.length - 1) {
                                    return (
                                        <motion.div
                                            ref={lastGameElementRef}
                                            key={`${game.id}-${index}`} // unique key combining id and index to avoid dupes if any
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index % 24 * 0.03 }} // Reset delay for new pages
                                        >
                                            <GameCard game={game} priority={index < 4} />
                                        </motion.div>
                                    );
                                }
                                return (
                                    <motion.div
                                        key={game.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index % 24 * 0.03 }}
                                    >
                                        <GameCard game={game} priority={index < 4} />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Loading More Indicator */}
                        {isFetchingNextPage && (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        )}

                        {/* No Results */}
                        {games.length === 0 && (
                            <div className="text-center py-16">
                                <p className="text-zinc-400">No games found with these filters</p>
                                <button
                                    onClick={() => {
                                        setOrdering("-added");
                                        setYear("");
                                    }}
                                    className="mt-4 text-blue-400 hover:underline"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
