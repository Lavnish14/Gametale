"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Newspaper, Loader2 } from "lucide-react";
import Link from "next/link";

import { NewsCard } from "@/components/news-card";
import { getGamingNews } from "@/lib/news";

export default function NewsPage() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ["gaming-news"],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await fetch(`/api/news?page=${pageParam}&pageSize=15`);
            if (!response.ok) {
                throw new Error("Failed to fetch news");
            }
            return response.json();
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.length * 15;
            return totalFetched < lastPage.totalResults ? allPages.length + 1 : undefined;
        },
        staleTime: 1000 * 60, // 1 minute for real-time feel
    });

    const articles = data?.pages.flatMap((page) => page.articles) || [];
    const featuredArticle = articles[0];
    const remainingArticles = articles.slice(1);

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
                                <Newspaper className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-white">Gaming News</h1>
                                <p className="text-xs text-zinc-400">Latest from IGN, Kotaku, Polygon & more</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="px-4 md:px-8 max-w-7xl mx-auto mt-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="aspect-video rounded-xl bg-zinc-800/50 animate-pulse" />
                        ))}
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-16">
                        <Newspaper className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400">No news found</p>
                        <p className="text-sm text-zinc-500 mt-1">Check back later for updates</p>
                    </div>
                ) : (
                    <>
                        {/* Featured Article */}
                        {featuredArticle && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6"
                            >
                                <NewsCard article={featuredArticle} priority variant="featured" />
                            </motion.div>
                        )}

                        {/* News Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {remainingArticles.map((article, index) => (
                                <motion.div
                                    key={article.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <NewsCard article={article} priority={index < 3} />
                                </motion.div>
                            ))}
                        </div>

                        {/* Load More */}
                        {hasNextPage && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors disabled:opacity-50"
                                >
                                    {isFetchingNextPage ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load More"
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
