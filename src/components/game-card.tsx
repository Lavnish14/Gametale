"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn, getRatingClass } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface GameCardProps {
    game: {
        id: number;
        name: string;
        background_image: string;
        rating: number;
        metacritic: number | null;
        genres?: { id: number; name: string }[];
        released?: string;
    };
    priority?: boolean;
    communityRating?: {
        goatPercent: number;
        totalVotes: number;
    } | null;
}

export function GameCard({ game, priority = false, communityRating }: GameCardProps) {
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();
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
                await supabase
                    .from("wishlists")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("game_id", game.id);
                setIsWishlisted(false);
                toast.success("Removed from wishlist");
            } else {
                await supabase
                    .from("wishlists")
                    .insert({
                        user_id: user.id,
                        game_id: game.id,
                        game_name: game.name,
                        game_image: game.background_image,
                    });
                setIsWishlisted(true);
                toast.success("Added to wishlist!");
            }
        } catch (error) {
            console.error("Wishlist error:", error);
            toast.error("Failed to update wishlist");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Link href={`/game/${game.id}`} className="group block">
            <div className="relative bg-zinc-900/80 rounded-lg overflow-hidden border border-zinc-800 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-blue-500/20 group-hover:scale-[1.02]">
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                    {game.background_image ? (
                        <Image
                            src={game.background_image}
                            alt={game.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            priority={priority}
                        />
                    ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <span className="text-zinc-600 text-sm">No Image</span>
                        </div>
                    )}

                    {/* Simple gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

                    {/* Metacritic Badge */}
                    {game.metacritic && (
                        <div className={cn("absolute top-2.5 left-2.5 rating-badge", getRatingClass(game.metacritic))}>
                            {game.metacritic}
                        </div>
                    )}

                    {/* Wishlist Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
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
                    </motion.button>

                    {/* Community Rating */}
                    {communityRating && communityRating.totalVotes >= 3 && (
                        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 text-xs">
                            <span>🐐</span>
                            <span className="font-semibold text-green-400">{communityRating.goatPercent}%</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-3">
                    <h3 className="font-medium text-white text-sm line-clamp-1 group-hover:text-blue-400 transition-colors">
                        {game.name}
                    </h3>

                    {/* Release Year */}
                    {game.released && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-zinc-500">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(game.released).getFullYear()}</span>
                        </div>
                    )}

                    {/* Genres */}
                    {game.genres && game.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {game.genres.slice(0, 2).map((genre) => (
                                <span
                                    key={genre.id}
                                    className="px-2 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-400 rounded"
                                >
                                    {genre.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

