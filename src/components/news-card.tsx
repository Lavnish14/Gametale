"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, Clock, Zap } from "lucide-react";
import { isBreakingNews, formatTimeAgo, type NewsArticle } from "@/lib/news";

interface NewsCardProps {
    article: NewsArticle;
    priority?: boolean;
    variant?: "default" | "featured" | "compact";
}

// Safe image component that handles errors
function SafeImage({ src, alt, ...props }: { src: string; alt: string; fill?: boolean; priority?: boolean; className?: string; sizes?: string }) {
    const [error, setError] = useState(false);

    if (error || !src) {
        return <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-zinc-900" />;
    }

    return (
        <Image
            src={src}
            alt={alt}
            onError={() => setError(true)}
            {...props}
        />
    );
}

export function NewsCard({ article, priority = false, variant = "default" }: NewsCardProps) {
    const isBreaking = isBreakingNews(article.publishedAt);
    const sourceName = article.source?.name || "News";

    if (variant === "compact") {
        return (
            <Link href={article.url} target="_blank" rel="noopener noreferrer">
                <motion.div
                    whileHover={{ x: 4 }}
                    className="flex gap-3 p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-blue-500/30 transition-all"
                >
                    {article.urlToImage && (
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                            <SafeImage
                                src={article.urlToImage}
                                alt={article.title}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white line-clamp-2">
                            {article.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                            <span>{sourceName}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(article.publishedAt)}</span>
                        </div>
                    </div>
                </motion.div>
            </Link>
        );
    }

    if (variant === "featured") {
        return (
            <Link href={article.url} target="_blank" rel="noopener noreferrer">
                <motion.div
                    whileHover={{ y: -4 }}
                    className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden group"
                >
                    {article.urlToImage ? (
                        <SafeImage
                            src={article.urlToImage}
                            alt={article.title}
                            fill
                            priority={priority}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-zinc-900" />
                    )}

                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-3">
                            {isBreaking && (
                                <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                                    <Zap className="w-3 h-3" />
                                    Breaking
                                </span>
                            )}
                            <span className="px-2.5 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                                {sourceName}
                            </span>
                        </div>

                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-3 group-hover:text-blue-400 transition-colors">
                            {article.title}
                        </h2>

                        {article.description && (
                            <p className="text-sm text-zinc-300 line-clamp-2 mb-3">
                                {article.description}
                            </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formatTimeAgo(article.publishedAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Read more</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Link>
        );
    }

    // Default card
    return (
        <Link href={article.url} target="_blank" rel="noopener noreferrer">
            <motion.div
                whileHover={{ y: -4 }}
                className="h-full bg-zinc-900/80 rounded-xl overflow-hidden border border-zinc-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group"
            >
                {/* Image */}
                <div className="relative aspect-video overflow-hidden">
                    {article.urlToImage ? (
                        <SafeImage
                            src={article.urlToImage}
                            alt={article.title}
                            fill
                            priority={priority}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-zinc-900 flex items-center justify-center">
                            <span className="text-zinc-600 text-sm">No image</span>
                        </div>
                    )}

                    {/* Breaking badge */}
                    {isBreaking && (
                        <div className="absolute top-3 left-3">
                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded animate-pulse">
                                <Zap className="w-3 h-3" />
                                Breaking
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-blue-400 font-medium">
                            {sourceName}
                        </span>
                        <span className="text-xs text-zinc-600">•</span>
                        <span className="text-xs text-zinc-500">
                            {formatTimeAgo(article.publishedAt)}
                        </span>
                    </div>

                    <h3 className="font-medium text-white line-clamp-2 group-hover:text-blue-400 transition-colors mb-2">
                        {article.title}
                    </h3>

                    {article.description && (
                        <p className="text-sm text-zinc-400 line-clamp-2">
                            {article.description}
                        </p>
                    )}
                </div>
            </motion.div>
        </Link>
    );
}

