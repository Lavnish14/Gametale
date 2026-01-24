"use client";

import { useState, useEffect } from "react";
import { Heart, Calendar, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

interface UpcomingHypeCardProps {
    game: {
        id: number;
        name: string;
        background_image: string;
        released?: string;
        genres?: { id: number; name: string }[];
    };
    priority?: boolean;
    variant?: "wide" | "square";
}

export function UpcomingHypeCard({ game, priority = false }: UpcomingHypeCardProps) {
    const { user, isAuthenticated } = useAuth();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkWishlist = async () => {
            if (!user) return;
            const { data } = await supabase
                .from("wishlists")
                .select("id")
                .eq("user_id", user.id)
                .eq("game_id", game.id)
                .single();
            setIsWishlisted(!!data);
        };
        checkWishlist();
    }, [user, game.id]);

    const handleWishlistToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated || !user || isLoading) return;
        setIsLoading(true);
        try {
            if (isWishlisted) {
                await supabase.from("wishlists").delete().eq("user_id", user.id).eq("game_id", game.id);
                setIsWishlisted(false);
            } else {
                await supabase.from("wishlists").insert({
                    user_id: user.id,
                    game_id: game.id,
                    game_name: game.name,
                    game_image: game.background_image,
                });
                setIsWishlisted(true);
            }
        } catch (error) {
            console.error("Wishlist error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const releaseDate = game.released ? new Date(game.released).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }) : "TBA";

    const daysUntil = game.released
        ? Math.max(0, Math.ceil((new Date(game.released).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    return (
        <Link href={`/game/${game.id}`} className="block h-full group">
            <div className="relative h-full rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                {/* Image */}
                <div className="relative h-full w-full">
                    {game.background_image ? (
                        <Image
                            src={game.background_image}
                            alt={game.name}
                            fill
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            priority={priority}
                        />
                    ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <span className="text-zinc-600 text-sm">No Image</span>
                        </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

                    {/* Hype badge */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded bg-blue-500 text-white text-[10px] font-semibold uppercase tracking-wide">
                        Upcoming
                    </div>

                    {/* Days countdown */}
                    {daysUntil !== null && daysUntil > 0 && (
                        <div className="absolute top-2.5 right-12 px-2 py-1 rounded bg-black/60 text-white text-[10px] font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {daysUntil}d
                        </div>
                    )}

                    {/* Wishlist button */}
                    <button
                        onClick={handleWishlistToggle}
                        disabled={isLoading}
                        className={cn(
                            "absolute top-2.5 right-2.5 p-2 rounded-md transition-colors",
                            isWishlisted
                                ? "bg-red-500 text-white"
                                : "bg-black/50 text-zinc-400 hover:text-white hover:bg-black/70",
                            isLoading && "opacity-50 cursor-wait"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                    </button>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-medium text-white text-sm line-clamp-2 group-hover:text-blue-400 transition-colors mb-1.5">
                            {game.name}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Calendar className="w-3 h-3" />
                            <span>{releaseDate}</span>
                        </div>

                        {game.genres && game.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {game.genres.slice(0, 2).map((genre) => (
                                    <span
                                        key={genre.id}
                                        className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-400 rounded"
                                    >
                                        {genre.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

