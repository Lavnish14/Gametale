"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Heart, Calendar, Sparkles, Clock } from "lucide-react";
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

    // 3D tilt effect
    const cardRef = useRef<HTMLDivElement>(null);
    const [tiltStyle, setTiltStyle] = useState({
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: "transform 0.15s ease-out"
    });

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

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
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

    // Format release date
    const releaseDate = game.released ? new Date(game.released).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }) : "TBA";

    // Calculate days until release
    const daysUntil = game.released
        ? Math.max(0, Math.ceil((new Date(game.released).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    return (
        <div
            ref={cardRef}
            className="group relative h-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                ...tiltStyle,
                transformStyle: "preserve-3d",
                willChange: "transform"
            }}
        >
            <Link href={`/game/${game.id}`} className="block h-full">
                <div className="relative h-full rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/[0.06] group-hover:border-violet-500/30 transition-all duration-500">
                    {/* Image - fills the entire card */}
                    <div className="relative h-full w-full overflow-hidden">
                        {game.background_image ? (
                            <Image
                                src={game.background_image}
                                alt={game.name}
                                fill
                                sizes="(max-width: 640px) 50vw, 25vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                priority={priority}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-zinc-700" />
                            </div>
                        )}

                        {/* Enhanced gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/50 to-transparent opacity-90" />

                        {/* Hover glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-violet-500/10 via-transparent to-cyan-500/5 pointer-events-none" />

                        {/* Animated Hype badge */}
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-pink-500/30"
                            style={{ transform: "translateZ(30px)" }}
                        >
                            <Sparkles className="w-3 h-3" />
                            Most Hyped
                        </motion.div>

                        {/* Days countdown badge */}
                        {daysUntil !== null && daysUntil > 0 && (
                            <div
                                className="absolute top-3 right-14 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium flex items-center gap-1"
                                style={{ transform: "translateZ(30px)" }}
                            >
                                <Clock className="w-3 h-3" />
                                {daysUntil}d
                            </div>
                        )}

                        {/* Wishlist button - Enhanced */}
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
                            style={{ transform: "translateZ(30px)" }}
                        >
                            <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                        </motion.button>

                        {/* Content overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-4" style={{ transform: "translateZ(20px)" }}>
                            <h3 className="font-bold text-white text-sm md:text-base line-clamp-2 group-hover:text-violet-400 transition-colors duration-300 mb-2">
                                {game.name}
                            </h3>

                            {/* Release date */}
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                                <span>{releaseDate}</span>
                            </div>

                            {/* Genre tags - Enhanced */}
                            {game.genres && game.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {game.genres.slice(0, 2).map((genre) => (
                                        <span
                                            key={genre.id}
                                            className="px-2 py-0.5 text-[10px] font-medium bg-white/10 text-zinc-300 rounded-lg border border-white/5"
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
        </div>
    );
}
