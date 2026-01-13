"use client";

import { motion } from "framer-motion";
import { Play, Heart, Calendar, Clock, Volume2, VolumeX, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { cn, getRatingClass } from "@/lib/utils";
import type { Game } from "@/lib/rawg";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface TrailerData {
    data?: {
        max?: string;
    };
    preview?: string;
}

interface HeroBannerProps {
    game: Game;
    trailer?: TrailerData;
    youtubeId?: string;
    title?: string;
}

export function HeroBanner({
    game,
    trailer,
    youtubeId,
    title = "Today's Pick",
}: HeroBannerProps) {
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const hasVideo = (trailer && trailer.data?.max) || youtubeId;

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
                // Remove from wishlist
                await supabase
                    .from("wishlists")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("game_id", game.id);
                setIsWishlisted(false);
                toast.success("Removed from wishlist");
            } else {
                // Add to wishlist
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

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
        // Note: YouTube iframe API requires postMessage to toggle mute,
        // but for simplicity with iframe embed, we might just set mute param initially.
        // Dynamic mute toggle for iframe is complex without full API.
        // For now, let's keep it simple: if youtube, it starts muted.
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative w-full h-[65vh] md:h-[75vh] overflow-hidden rounded-2xl md:rounded-3xl"
        >
            {/* Background Video or Image */}
            <div className="absolute inset-0">
                {youtubeId ? (
                    <div className="absolute inset-0 pointer-events-none scale-150">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${youtubeId}&end=30&start=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            className="w-full h-full object-cover opacity-80"
                        />
                    </div>
                ) : trailer?.data?.max ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source src={trailer.data.max} type="video/mp4" />
                    </video>
                ) : game.background_image ? (
                    <Image
                        src={game.background_image}
                        alt={game.name}
                        fill
                        priority
                        className="object-cover"
                        sizes="100vw"
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-900" />
                )}
            </div>

            {/* Floating Decorative Orbs */}
            <div className="absolute top-[15%] right-[8%] w-64 h-64 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent blur-3xl animate-float pointer-events-none" />
            <div className="absolute bottom-[25%] left-[5%] w-48 h-48 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl animate-float-delayed pointer-events-none" />
            <div className="absolute top-[40%] right-[30%] w-32 h-32 rounded-full bg-gradient-to-br from-pink-500/15 to-transparent blur-2xl animate-float pointer-events-none" />

            {/* Enhanced Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030305]/90 via-[#030305]/30 to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#030305]/60 to-transparent" />

            {/* Mute Toggle (if video) - Enhanced */}
            {hasVideo && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMute}
                    className="absolute top-4 right-4 p-3 rounded-xl glass-strong z-10 border border-white/10"
                >
                    {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                    )}
                </motion.button>
            )}

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-16">
                {/* Enhanced Tag Badge */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-500/30 w-fit mb-5"
                >
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs font-semibold text-white">{title}</span>
                    {hasVideo && (
                        <>
                            <span className="w-px h-3 bg-white/20" />
                            <span className="text-[10px] text-violet-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                Playing Trailer
                            </span>
                        </>
                    )}
                </motion.div>

                {/* Animated Gradient Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 max-w-4xl leading-[1.1] tracking-tight gradient-text-animated"
                >
                    {game.name}
                </motion.h1>

                {/* Enhanced Metadata */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap items-center gap-4 mb-6"
                >
                    {/* Metacritic - Enhanced */}
                    {game.metacritic && (
                        <div className={cn("rating-badge", getRatingClass(game.metacritic))}>
                            {game.metacritic}
                        </div>
                    )}

                    {/* Release Date */}
                    {game.released && (
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                            <Calendar className="w-4 h-4 text-zinc-500" />
                            <span>{new Date(game.released).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                        </div>
                    )}

                    {/* Playtime */}
                    {game.playtime > 0 && (
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                            <Clock className="w-4 h-4 text-zinc-500" />
                            <span>{game.playtime}h avg playtime</span>
                        </div>
                    )}
                </motion.div>

                {/* Enhanced Genres */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap gap-2 mb-8"
                >
                    {game.genres?.slice(0, 4).map((genre) => (
                        <span
                            key={genre.id}
                            className="px-4 py-1.5 text-xs font-medium bg-zinc-800/50 backdrop-blur-sm text-zinc-300 rounded-full border border-zinc-700/50 hover:border-violet-500/30 hover:text-violet-300 transition-all duration-300"
                        >
                            {genre.name}
                        </span>
                    ))}
                </motion.div>

                {/* Enhanced Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap gap-4"
                >
                    <Link href={`/game/${game.id}`}>
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="gradient-button flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm"
                        >
                            <Play className="w-4 h-4" />
                            <span>Explore Game</span>
                        </motion.button>
                    </Link>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleWishlistToggle}
                        disabled={isLoading}
                        className={cn(
                            "flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm border transition-all duration-300",
                            isWishlisted
                                ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-lg shadow-red-500/10"
                                : "glass border-zinc-700/50 text-white hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10",
                            isLoading && "opacity-50 cursor-wait"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                        {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
}
