"use client";

import { use, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, ExternalLink, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getGameDetails, getGameScreenshots, type Screenshot } from "@/lib/rawg";
import { supabase, type RatingType } from "@/lib/supabase";
import { getRatingClass, cn } from "@/lib/utils";
import { ReviewMeter } from "@/components/review-meter";
import { CommentsSection } from "@/components/comments-section";
import { SkeletonCard } from "@/components/skeleton-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/toast";
import type { Comment } from "@/lib/supabase";

interface GamePageProps {
    params: Promise<{ id: string }>;
}

export default function GamePage({ params }: GamePageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();

    const [comments, setComments] = useState<Comment[]>([]);
    const [userRating, setUserRating] = useState<RatingType | null>(null);
    const [ratingDistribution, setRatingDistribution] = useState<{
        goat: number;
        mid: number;
        trash: number;
        total: number;
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Wishlist state
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // Check wishlist status
    useEffect(() => {
        const checkWishlist = async () => {
            if (!user) return;

            const { data } = await supabase
                .from("wishlists")
                .select("id")
                .eq("user_id", user.id)
                .eq("game_id", Number(id))
                .single();

            setIsWishlisted(!!data);
        };

        checkWishlist();
    }, [user, id]);

    // Handle wishlist toggle
    const handleWishlistToggle = async () => {
        if (!isAuthenticated || !user || wishlistLoading || !game) return;

        setWishlistLoading(true);
        try {
            if (isWishlisted) {
                await supabase
                    .from("wishlists")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("game_id", Number(id));
                setIsWishlisted(false);
                toast.success("Removed from wishlist");
            } else {
                await supabase
                    .from("wishlists")
                    .insert({
                        user_id: user.id,
                        game_id: Number(id),
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
            setWishlistLoading(false);
        }
    };

    // Fetch game details
    const { data: game, isLoading: gameLoading } = useQuery({
        queryKey: ["game", id],
        queryFn: () => getGameDetails(Number(id)),
        enabled: !!id,
    });

    // Fetch screenshots
    const { data: screenshotsData } = useQuery({
        queryKey: ["screenshots", id],
        queryFn: () => getGameScreenshots(Number(id)),
        enabled: !!id,
    });

    // Fetch comments using React Query for better caching
    const { data: commentsData, refetch: refetchComments } = useQuery({
        queryKey: ["comments", id],
        queryFn: async () => {
            try {
                // First fetch comments
                const { data: commentsOnly, error: commentsError } = await supabase
                    .from("comments")
                    .select("*")
                    .eq("game_id", Number(id))
                    .order("created_at", { ascending: false });

                if (commentsError) {
                    console.error("Error fetching comments:", commentsError.message);
                    return [];
                }

                if (!commentsOnly || commentsOnly.length === 0) {
                    return [];
                }

                // Then fetch profiles for each comment
                const userIds = [...new Set(commentsOnly.map(c => c.user_id))];
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, username, avatar_url")
                    .in("id", userIds);

                // Map profiles to comments
                const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
                const commentsWithProfiles = commentsOnly.map(comment => ({
                    ...comment,
                    profile: profileMap.get(comment.user_id) || null
                }));

                return commentsWithProfiles as Comment[];
            } catch (err) {
                console.error("Error in comments query:", err);
                return [];
            }
        },
        staleTime: 5000, // Cache for 5 seconds for faster updates
    });

    // Update local state when query data changes
    useEffect(() => {
        if (commentsData) {
            setComments(commentsData);
        }
    }, [commentsData]);

    // Subscribe to real-time comments
    useEffect(() => {
        const channel = supabase
            .channel(`comments:${id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "comments",
                    filter: `game_id=eq.${id}`,
                },
                async (payload) => {
                    // Fetch the profile for the new comment
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("username, avatar_url")
                        .eq("id", payload.new.user_id)
                        .single();

                    const newComment = {
                        ...payload.new,
                        profile,
                    } as Comment;

                    setComments((prev) => {
                        // Avoid duplicate comments
                        if (prev.some(c => c.id === newComment.id)) return prev;
                        return [newComment, ...prev];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    // Fetch user's review if logged in
    useEffect(() => {
        const fetchUserReview = async () => {
            if (!user) return;

            const { data } = await supabase
                .from("reviews")
                .select("*")
                .eq("user_id", user.id)
                .eq("game_id", Number(id))
                .single();

            if (data && data.rating) {
                setUserRating(data.rating as RatingType);
            }
        };

        fetchUserReview();
    }, [user, id]);

    // Fetch rating distribution
    useEffect(() => {
        const fetchRatingDistribution = async () => {
            const { data } = await supabase
                .from("reviews")
                .select("rating")
                .eq("game_id", Number(id));

            if (data && data.length > 0) {
                const counts = { goat: 0, mid: 0, trash: 0 };
                data.forEach((r) => {
                    if (r.rating && r.rating in counts) {
                        counts[r.rating as RatingType]++;
                    }
                });
                setRatingDistribution({
                    ...counts,
                    total: data.length,
                });
            }
        };

        fetchRatingDistribution();
    }, [id, userRating]);

    // Handle review submission
    const handleReviewSubmit = async (rating: RatingType) => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from("reviews")
                .upsert({
                    user_id: user.id,
                    game_id: Number(id),
                    rating,
                }, {
                    onConflict: "user_id,game_id",
                });

            if (!error) {
                setUserRating(rating);
                toast.success("Vote submitted!");
            } else {
                toast.error("Failed to submit vote");
            }
        } catch (err) {
            console.error("Error submitting review:", err);
            toast.error("Failed to submit vote");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle comment submission
    const handleCommentSubmit = async (content: string) => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("comments").insert({
                user_id: user.id,
                game_id: Number(id),
                content,
            });

            if (error) {
                console.error("Error submitting comment:", error);
                toast.error("Failed to post comment");
            } else {
                // Refetch comments after successful submission
                refetchComments();
                toast.success("Comment posted!");
            }
        } catch (err) {
            console.error("Error submitting comment:", err);
            toast.error("Failed to post comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (gameLoading) {
        return (
            <div className="min-h-screen p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                    <SkeletonCard variant="hero" />
                </div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Game Not Found</h1>
                    <Link href="/" className="text-blue-400 hover:underline">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <AnimatePresence>
            <motion.main
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="min-h-screen pb-12"
            >
                {/* Hero Background */}
                <div className="relative h-[50vh] md:h-[60vh]">
                    {game.background_image && (
                        <Image
                            src={game.background_image}
                            alt={game.name}
                            fill
                            priority
                            className="object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 to-transparent" />

                    {/* Back Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.back()}
                        className="absolute top-4 left-4 md:top-8 md:left-8 glass p-3 rounded-xl z-20"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </motion.button>

                    {/* Wishlist Button */}
                    <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20">
                        {isAuthenticated ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleWishlistToggle}
                                disabled={wishlistLoading}
                                className={cn(
                                    "p-3 rounded-xl transition-all flex items-center gap-2",
                                    isWishlisted
                                        ? "bg-red-500/20 border border-red-500/50 text-red-400"
                                        : "glass text-white hover:text-red-400"
                                )}
                            >
                                <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
                                <span className="font-medium hidden md:block">
                                    {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                                </span>
                            </motion.button>
                        ) : null}
                    </div>
                </div>

                {/* Content */}
                <div className="relative -mt-32 px-4 md:px-8 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Title Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card-2026 rounded-2xl p-6 md:p-8"
                            >
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                    {game.name}
                                </h1>

                                {/* Metadata */}
                                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-zinc-300">
                                    {/* Metacritic */}
                                    {game.metacritic && (
                                        <div className={cn("rating-badge", getRatingClass(game.metacritic))}>
                                            {game.metacritic}
                                        </div>
                                    )}

                                    {/* Release Date */}
                                    {game.released && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {new Date(game.released).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    )}


                                </div>

                                {/* Genres */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {game.genres?.map((genre) => (
                                        <Link
                                            key={genre.id}
                                            href={`/genre/${genre.slug}`}
                                            className="px-3 py-1.5 text-sm bg-zinc-800/80 text-zinc-300 rounded-lg hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
                                        >
                                            {genre.name}
                                        </Link>
                                    ))}
                                </div>

                                {/* Description */}
                                {game.description_raw && (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <p className="text-zinc-400 leading-relaxed">
                                            {game.description_raw.slice(0, 800)}
                                            {game.description_raw.length > 800 && "..."}
                                        </p>
                                    </div>
                                )}
                            </motion.div>

                            {/* Screenshots */}
                            {screenshotsData?.results && screenshotsData.results.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="glass-card-2026 rounded-2xl p-6"
                                >
                                    <h2 className="text-lg font-semibold text-white mb-4">Screenshots</h2>
                                    <div className="grid grid-cols-2 gap-3">
                                        {screenshotsData.results.slice(0, 4).map((screenshot: Screenshot) => (
                                            <div
                                                key={screenshot.id}
                                                className="relative aspect-video rounded-lg overflow-hidden"
                                            >
                                                <Image
                                                    src={screenshot.image}
                                                    alt="Screenshot"
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Comments Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <CommentsSection
                                    comments={comments}
                                    onSubmit={handleCommentSubmit}
                                    isAuthenticated={isAuthenticated}
                                    isLoading={isSubmitting}
                                />
                            </motion.div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Review Meter - Only show for released games */}
                            {game.released && new Date(game.released) <= new Date() && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    {isAuthenticated ? (
                                        <ReviewMeter
                                            initialRating={userRating}
                                            onSubmit={handleReviewSubmit}
                                            disabled={isSubmitting}
                                            ratingDistribution={ratingDistribution}
                                            gameName={game.name}
                                            gameId={game.id}
                                        />
                                    ) : (
                                        <>
                                            <ReviewMeter
                                                disabled={true}
                                                ratingDistribution={ratingDistribution}
                                                gameName={game.name}
                                                gameId={game.id}
                                            />
                                            <p className="text-xs text-zinc-500 text-center mt-2">
                                                <Link href="/login" className="text-blue-400 hover:underline">
                                                    Sign in
                                                </Link>{" "}
                                                to rate this game
                                            </p>
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {/* Game Info */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card-2026 rounded-xl p-5 space-y-4"
                            >
                                <h3 className="font-semibold text-white">Game Info</h3>

                                {/* Platforms */}
                                {game.platforms && game.platforms.length > 0 && (
                                    <div>
                                        <span className="text-xs text-zinc-500 block mb-2">Platforms</span>
                                        <div className="flex flex-wrap gap-2">
                                            {game.platforms.map((p) => (
                                                <span
                                                    key={p.platform.id}
                                                    className="px-2 py-1 text-xs bg-zinc-800/80 text-zinc-400 rounded"
                                                >
                                                    {p.platform.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Developers */}
                                {game.developers && game.developers.length > 0 && (
                                    <div>
                                        <span className="text-xs text-zinc-500 block mb-2">Developers</span>
                                        <div className="text-sm text-zinc-300">
                                            {game.developers.map((d) => d.name).join(", ")}
                                        </div>
                                    </div>
                                )}

                                {/* Publishers */}
                                {game.publishers && game.publishers.length > 0 && (
                                    <div>
                                        <span className="text-xs text-zinc-500 block mb-2">Publishers</span>
                                        <div className="text-sm text-zinc-300">
                                            {game.publishers.map((p) => p.name).join(", ")}
                                        </div>
                                    </div>
                                )}

                                {/* Tags */}
                                {game.tags && game.tags.length > 0 && (
                                    <div>
                                        <span className="text-xs text-zinc-500 block mb-2">Tags</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {game.tags.slice(0, 8).map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="px-2 py-0.5 text-[10px] bg-zinc-800/50 text-zinc-500 rounded"
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Stores */}
                                {game.stores && game.stores.length > 0 && (
                                    <div>
                                        <span className="text-xs text-zinc-500 block mb-2">Available On</span>
                                        <div className="flex flex-wrap gap-2">
                                            {game.stores.map((s) => (
                                                <span
                                                    key={s.store.id}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-800/80 text-zinc-400 rounded hover:text-blue-400 transition-colors cursor-pointer"
                                                >
                                                    {s.store.name}
                                                    <ExternalLink className="w-3 h-3" />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ESRB Rating */}
                                {game.esrb_rating && (
                                    <div>
                                        <span className="text-xs text-zinc-500 block mb-2">ESRB Rating</span>
                                        <span className="px-3 py-1 text-sm bg-zinc-800 text-white rounded-lg">
                                            {game.esrb_rating.name}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.main>
        </AnimatePresence>
    );
}
