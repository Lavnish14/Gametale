"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, Timer, Star } from "lucide-react";
import {
    type GameDeal,
    isExpiringSoon,
    formatTimeRemaining,
} from "@/lib/deals";

interface DealCardProps {
    deal: GameDeal & {
        thumb?: string;
        metacritic?: number | null;
        steamRating?: number | null;
        price: { amountINR?: number };
        regular: { amountINR?: number }
    };
    priority?: boolean;
    variant?: "default" | "compact" | "featured";
}

// Store colors
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

export function DealCard({ deal, priority = false, variant = "default" }: DealCardProps) {
    if (!deal || !deal.shop) {
        return null;
    }

    const shopId = deal.shop.id || "";
    const shopColor = STORE_COLORS[shopId] || "#374151";
    const expiringSoon = deal.expiry ? isExpiringSoon(deal.expiry) : false;

    // Get INR prices
    const priceINR = deal.price.amountINR || Math.round(deal.price.amount * 83);
    const regularINR = deal.regular.amountINR || Math.round(deal.regular.amount * 83);

    if (variant === "featured") {
        return (
            <Link href={deal.url} target="_blank" rel="noopener noreferrer">
                <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="relative h-[200px] rounded-2xl overflow-hidden group shadow-xl shadow-black/30 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300"
                >
                    {/* Background image */}
                    <div className="absolute inset-0">
                        {deal.thumb ? (
                            <Image
                                src={deal.thumb}
                                alt={deal.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                sizes="(max-width: 768px) 100vw, 33vw"
                                priority={priority}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                    </div>

                    {/* Discount badge */}
                    <div className="absolute top-3 right-3 z-10">
                        <span className="text-xl font-black text-green-400 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-green-500/30 shadow-lg">
                            -{deal.cut}%
                        </span>
                    </div>

                    {/* Rating badge */}
                    {(deal.metacritic || deal.steamRating) && (
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-medium text-white">
                                {deal.metacritic || deal.steamRating}
                            </span>
                        </div>
                    )}

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                        <span className="text-xs font-medium text-blue-400 mb-1">{deal.shop.name}</span>
                        <h2 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                            {deal.title}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-500 line-through text-sm">
                                {formatINR(regularINR)}
                            </span>
                            <span className="text-lg font-bold text-green-400">
                                {formatINR(priceINR)}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </Link>
        );
    }

    // Default card with thumbnail
    return (
        <Link href={deal.url} target="_blank" rel="noopener noreferrer">
            <motion.div
                whileHover={{ y: -6 }}
                className="h-full bg-zinc-900/90 rounded-xl overflow-hidden border border-zinc-800 hover:border-blue-500/50 transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-blue-500/10 group"
            >
                {/* Game thumbnail */}
                <div className="relative h-32 w-full overflow-hidden bg-zinc-800">
                    {deal.thumb ? (
                        <Image
                            src={deal.thumb}
                            alt={deal.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            priority={priority}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                            <span className="text-2xl opacity-50">🎮</span>
                        </div>
                    )}

                    {/* Discount badge on image */}
                    <div className="absolute top-2 right-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md border backdrop-blur-sm shadow-lg ${getDiscountColor(deal.cut)}`}>
                            -{deal.cut}%
                        </span>
                    </div>

                    {/* Rating badge */}
                    {(deal.metacritic || deal.steamRating) && (deal.metacritic || 0) > 0 && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs shadow-lg">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-white font-medium">{deal.metacritic || deal.steamRating}</span>
                        </div>
                    )}

                    {/* Gradient overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-900/90 to-transparent" />
                </div>

                {/* Header with shop info */}
                <div
                    className="px-3 py-1.5 flex items-center justify-between"
                    style={{ backgroundColor: `${shopColor}30` }}
                >
                    <span className="text-xs text-zinc-300 font-medium truncate">{deal.shop.name}</span>
                    {expiringSoon && deal.expiry && (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="p-3">
                    <h3 className="font-medium text-sm text-white line-clamp-2 group-hover:text-blue-400 transition-colors mb-2 min-h-[2.5rem]">
                        {deal.title}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-500 line-through text-xs">
                                {formatINR(regularINR)}
                            </span>
                            <span className="text-base font-bold text-green-400">
                                {formatINR(priceINR)}
                            </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
