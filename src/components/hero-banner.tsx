"use client";

import { Play, Heart, Calendar, Volume2, VolumeX } from "lucide-react";
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

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden rounded-lg">
            {/* Background */}
            <div className="absolute inset-0">
                {youtubeId ? (
                    <div className="absolute inset-0 pointer-events-none scale-150">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${youtubeId}&end=60&start=0`}
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

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />

            {/* Mute button */}
            {hasVideo && (
                <button
                    onClick={toggleMute}
                    className="absolute top-4 right-4 p-2.5 rounded-md bg-black/50 hover:bg-black/70 transition-colors z-10"
                >
                    {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                    )}
                </button>
            )}

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8 lg:p-12">
                {/* Tag */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500/20 border border-blue-500/30 w-fit mb-4">
                    <span className="text-xs font-medium text-blue-400">{title}</span>
                    {hasVideo && (
                        <>
                            <span className="w-px h-3 bg-blue-500/30" />
                            <span className="text-[10px] text-blue-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Playing
                            </span>
                        </>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 max-w-3xl leading-tight">
                    {game.name}
                </h1>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                    {game.metacritic && (
                        <div className={cn("rating-badge", getRatingClass(game.metacritic))}>
                            {game.metacritic}
                        </div>
                    )}

                    {game.released && (
                        <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(game.released).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                        </div>
                    )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {game.genres?.slice(0, 4).map((genre) => (
                        <span
                            key={genre.id}
                            className="px-3 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 rounded"
                        >
                            {genre.name}
                        </span>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                    <Link href={`/game/${game.id}`}>
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors">
                            <Play className="w-4 h-4" />
                            Explore Game
                        </button>
                    </Link>

                    <button
                        onClick={handleWishlistToggle}
                        disabled={isLoading}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-md font-medium text-sm border transition-colors",
                            isWishlisted
                                ? "bg-red-500/20 border-red-500/50 text-red-400"
                                : "bg-zinc-800/80 border-zinc-700 text-white hover:border-zinc-600",
                            isLoading && "opacity-50 cursor-wait"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                        {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                    </button>
                </div>
            </div>
        </div>
    );
}

