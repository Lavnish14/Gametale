"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

    // 3D tilt effect state
    const cardRef = useRef<HTMLDivElement>(null);
    const [tiltStyle, setTiltStyle] = useState({
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: "transform 0.15s ease-out"
    });

    // Check if game is in wishlist
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

    // Enhanced 3D tilt handlers (12 degrees max)
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Enhanced rotation (max 12 degrees for more dramatic effect)
        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;

        setTiltStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
            transition: "transform 0.1s ease-out"
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setTiltStyle({
            transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
            transition: "transform 0.4s ease-out"
        });
    }, []);

    return (
        <div
            ref={cardRef}
            className="group relative"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                ...tiltStyle,
                transformStyle: "preserve-3d",
                willChange: "transform"
            }}
        >
            <Link href={`/game/${game.id}`}>
                <div className="glass card-hover rounded-2xl overflow-hidden">
                    {/* Image Container */}
                    <div
                        className="relative aspect-[16/10] overflow-hidden"
                        style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }}
                    >
                        {game.background_image ? (
                            <Image
                                src={game.background_image}
                                alt={game.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                priority={priority}
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                <span className="text-zinc-700 text-sm">No Image</span>
                            </div>
                        )}

                        {/* Enhanced Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />

                        {/* Hover Glow Overlay */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-violet-500/10 via-transparent to-cyan-500/5 pointer-events-none" />

                        {/* Metacritic Badge - Enhanced */}
                        {game.metacritic && (
                            <div
                                className={cn(
                                    "absolute top-3 left-3 rating-badge",
                                    getRatingClass(game.metacritic)
                                )}
                                style={{ transform: "translateZ(40px)" }}
                            >
                                {game.metacritic}
                            </div>
                        )}

                        {/* Wishlist Heart Button - Enhanced */}
                        <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleWishlistToggle}
                            disabled={isLoading}
                            className={cn(
                                "absolute top-3 right-3 p-2.5 rounded-xl backdrop-blur-md transition-all duration-300",
                                isWishlisted
                                    ? "bg-red-500/90 text-white shadow-lg shadow-red-500/30"
                                    : "bg-black/40 text-zinc-400 hover:text-red-400 hover:bg-black/60",
                                isLoading && "opacity-50 cursor-wait"
                            )}
                            style={{ transform: "translateZ(40px)" }}
                        >
                            <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                        </motion.button>

                        {/* Community GOAT Rating Badge */}
                        {communityRating && communityRating.totalVotes >= 3 && (
                            <div
                                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30"
                                style={{ transform: "translateZ(30px)" }}
                            >
                                <span className="text-xs">🐐</span>
                                <span className="text-xs font-bold text-green-400">{communityRating.goatPercent}%</span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4" style={{ transform: "translateZ(10px)" }}>
                        <h3 className="font-semibold text-white text-sm md:text-base line-clamp-1 group-hover:text-violet-400 transition-colors duration-300">
                            {game.name}
                        </h3>

                        {/* Metadata Row */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                            {game.released && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                                    <span>{new Date(game.released).getFullYear()}</span>
                                </div>
                            )}
                        </div>

                        {/* Genres - Enhanced */}
                        {game.genres && game.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {game.genres.slice(0, 2).map((genre) => (
                                    <span
                                        key={genre.id}
                                        className="px-2.5 py-1 text-[10px] font-medium bg-zinc-800/60 text-zinc-400 rounded-lg border border-zinc-700/50 hover:border-violet-500/30 hover:text-violet-400 transition-colors duration-300"
                                    >
                                        {genre.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}
