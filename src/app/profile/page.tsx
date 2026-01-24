"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, MessageSquare, Star, LogOut, Edit2, Camera, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import { getGameDetails } from "@/lib/rawg";
import { useToast } from "@/components/toast";

interface UserComment {
    id: string;
    game_id: number;
    content: string;
    created_at: string;
    game_name?: string;
    game_image?: string;
}

interface UserReview {
    id: string;
    game_id: number;
    rating: string;
    created_at: string;
    game_name?: string;
    game_image?: string;
}

const INITIAL_SHOW_COUNT = 6;

export default function ProfilePage() {
    const router = useRouter();
    const toast = useToast();
    const { user, profile, isLoading, isAuthenticated } = useAuth();
    const [comments, setComments] = useState<UserComment[]>([]);
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [showAllComments, setShowAllComments] = useState(false);

    // Edit profile state
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    // Initialize edit form with current values
    useEffect(() => {
        if (profile) {
            setNewUsername(profile.username || "");
        }
    }, [profile]);

    // Fetch user's comments and reviews with game names
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;

            // Fetch comments
            const { data: commentsData } = await supabase
                .from("comments")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            // Fetch reviews
            const { data: reviewsData } = await supabase
                .from("reviews")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            // Get unique game IDs from both comments and reviews
            const allGameIds = new Set<number>();
            commentsData?.forEach(c => allGameIds.add(c.game_id));
            reviewsData?.forEach(r => allGameIds.add(r.game_id));

            // Fetch game names for all unique game IDs
            const gameData: Record<number, { name: string; image: string }> = {};
            await Promise.all(
                Array.from(allGameIds).map(async (gameId) => {
                    try {
                        const game = await getGameDetails(gameId);
                        gameData[gameId] = { name: game.name, image: game.background_image };
                    } catch {
                        gameData[gameId] = { name: `Game #${gameId}`, image: "" };
                    }
                })
            );

            // Add game names to comments
            if (commentsData) {
                setComments(commentsData.map(c => ({
                    ...c,
                    game_name: gameData[c.game_id]?.name || `Game #${c.game_id}`,
                    game_image: gameData[c.game_id]?.image || ""
                })));
            }

            // Add game names to reviews
            if (reviewsData) {
                setReviews(reviewsData.map(r => ({
                    ...r,
                    game_name: gameData[r.game_id]?.name || `Game #${r.game_id}`,
                    game_image: gameData[r.game_id]?.image || ""
                })));
            }
        };

        fetchUserData();
    }, [user]);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        await supabase.auth.signOut();
        toast.success("Signed out successfully");
        router.push("/");
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Image must be less than 2MB");
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleProfileUpdate = async () => {
        if (!user) return;

        setIsUpdating(true);

        try {
            let avatarUrl = profile?.avatar_url || null;

            // Upload avatar if changed
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(fileName, avatarFile, { upsert: true });

                if (uploadError) {
                    toast.error("Failed to upload avatar");
                    console.error(uploadError);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from("avatars")
                        .getPublicUrl(fileName);
                    avatarUrl = publicUrl;
                }
            }

            // Update profile
            const { error } = await supabase
                .from("profiles")
                .update({
                    username: newUsername.toLowerCase(),
                    avatar_url: avatarUrl,
                })
                .eq("id", user.id);

            if (error) {
                if (error.code === "23505") {
                    toast.error("Username is already taken");
                } else {
                    toast.error("Failed to update profile");
                }
            } else {
                toast.success("Profile updated!");
                setIsEditingProfile(false);
                setAvatarFile(null);
                setAvatarPreview(null);
                // Refresh the page to get updated profile
                router.refresh();
            }
        } catch (err) {
            toast.error("Something went wrong");
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    const cancelEdit = () => {
        setIsEditingProfile(false);
        setNewUsername(profile?.username || "");
        setAvatarFile(null);
        setAvatarPreview(null);
    };

    const getRatingEmoji = (rating: string) => {
        switch (rating) {
            case "goat": return "🐐";
            case "mid": return "😐";
            case "trash": return "🗑️";
            default: return "❓";
        }
    };

    const getRatingColor = (rating: string) => {
        switch (rating) {
            case "goat": return "#22c55e";
            case "mid": return "#eab308";
            case "trash": return "#ef4444";
            default: return "#888";
        }
    };

    const getRatingBg = (rating: string) => {
        switch (rating) {
            case "goat": return "from-green-500/20 to-blue-500/20 border-green-500/30";
            case "mid": return "from-yellow-500/20 to-blue-500/20 border-yellow-500/30";
            case "trash": return "from-red-500/20 to-pink-500/20 border-red-500/30";
            default: return "from-zinc-500/20 to-zinc-500/20 border-zinc-500/30";
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
                />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, INITIAL_SHOW_COUNT);
    const displayedComments = showAllComments ? comments : comments.slice(0, INITIAL_SHOW_COUNT);

    return (
        <main className="min-h-screen pb-24 relative overflow-hidden">
            {/* Decorative Background Orbs */}
            <div className="orb orb-violet w-[500px] h-[500px] -top-32 right-[-200px] opacity-40 animate-float" />
            <div className="orb orb-cyan w-[350px] h-[350px] top-1/3 -left-32 opacity-30 animate-float-delayed" />

            {/* Gradient Banner */}
            <div className="h-40 md:h-48 bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-pink-500/10 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent" />
            </div>

            {/* Back Button */}
            <Link href="/" className="absolute top-4 left-4 md:top-8 md:left-8 z-10">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-2026 p-3 rounded-xl glow-on-hover"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </motion.button>
            </Link>

            <div className="px-4 md:px-8 -mt-20 max-w-5xl mx-auto space-y-8 relative z-10">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card-2026 rounded-2xl p-6 md:p-8"
                >
                    <div className="flex items-start gap-6">
                        {/* Avatar with edit option */}
                        <div className="relative flex-shrink-0 group">
                            <div className="avatar-ring-2026">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center overflow-hidden">
                                    {avatarPreview ? (
                                        <Image
                                            src={avatarPreview}
                                            alt="Avatar preview"
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : profile?.avatar_url ? (
                                        <Image
                                            src={profile.avatar_url}
                                            alt={`${profile?.username || 'User'} avatar`}
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-10 h-10 md:w-12 md:h-12 text-white" />
                                    )}
                                </div>
                            </div>

                            {/* Camera overlay for editing */}
                            {isEditingProfile && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    <Camera className="w-6 h-6 text-white" />
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            {isEditingProfile ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                                        placeholder="Username"
                                        maxLength={20}
                                        className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-xl font-bold focus:outline-none focus:border-blue-500"
                                    />
                                    <p className="text-sm text-zinc-400">{user?.email}</p>

                                    <div className="flex gap-2 pt-2">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleProfileUpdate}
                                            disabled={isUpdating}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium"
                                        >
                                            <Check className="w-4 h-4" />
                                            {isUpdating ? "Saving..." : "Save"}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={cancelEdit}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/50 text-zinc-400 text-sm font-medium"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </motion.button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl md:text-3xl font-bold text-white truncate">
                                            {profile?.username || user?.email?.split("@")[0] || "Gamer"}
                                        </h1>
                                        <button
                                            onClick={() => setIsEditingProfile(true)}
                                            className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4 text-zinc-400" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-zinc-400 mb-4">{user?.email}</p>

                                    {/* Stats */}
                                    <div className="flex gap-6">
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-white">{reviews.length}</div>
                                            <div className="text-xs text-zinc-500">Reviews</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-white">{comments.length}</div>
                                            <div className="text-xs text-zinc-500">Comments</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sign Out Button */}
                    {!isEditingProfile && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            className="mt-6 w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                            {isSigningOut ? (
                                <span className="flex items-center justify-center gap-2">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full"
                                    />
                                    Signing out...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </span>
                            )}
                        </motion.button>
                    )}
                </motion.div>

                {/* Reviews Section - Grid Layout */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card-2026 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Star className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-semibold text-white">Your Reviews</h2>
                            <span className="text-sm text-zinc-500">({reviews.length})</span>
                        </div>
                    </div>

                    {reviews.length === 0 ? (
                        <p className="text-sm text-zinc-500 text-center py-8">
                            You haven&apos;t reviewed any games yet
                        </p>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {displayedReviews.map((review) => (
                                    <Link
                                        key={review.id}
                                        href={`/game/${review.game_id}`}
                                        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${getRatingBg(review.rating)} border p-3 hover:scale-[1.02] transition-transform`}
                                    >
                                        {/* Game Image Background */}
                                        {review.game_image && (
                                            <div className="absolute inset-0 opacity-20">
                                                <Image
                                                    src={review.game_image}
                                                    alt=""
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}

                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">{getRatingEmoji(review.rating)}</span>
                                                <span
                                                    className="text-xs font-bold uppercase"
                                                    style={{ color: getRatingColor(review.rating) }}
                                                >
                                                    {review.rating}
                                                </span>
                                            </div>
                                            <div className="text-sm text-white font-medium line-clamp-1">
                                                {review.game_name}
                                            </div>
                                            <div className="text-[10px] text-zinc-400 mt-1">
                                                {formatDate(review.created_at)}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Show More/Less Button */}
                            {reviews.length > INITIAL_SHOW_COUNT && (
                                <button
                                    onClick={() => setShowAllReviews(!showAllReviews)}
                                    className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    {showAllReviews ? (
                                        <>
                                            <ChevronUp className="w-4 h-4" />
                                            Show Less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-4 h-4" />
                                            Show All ({reviews.length})
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </motion.div>

                {/* Comments Section - Grid Layout */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card-2026 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-semibold text-white">Your Comments</h2>
                            <span className="text-sm text-zinc-500">({comments.length})</span>
                        </div>
                    </div>

                    {comments.length === 0 ? (
                        <p className="text-sm text-zinc-500 text-center py-8">
                            You haven&apos;t commented on any games yet
                        </p>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {displayedComments.map((comment) => (
                                    <Link
                                        key={comment.id}
                                        href={`/game/${comment.game_id}`}
                                        className="relative overflow-hidden rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4 hover:border-blue-500/30 hover:bg-zinc-800 transition-all"
                                    >
                                        {/* Game Image as subtle background */}
                                        {comment.game_image && (
                                            <div className="absolute inset-0 opacity-10">
                                                <Image
                                                    src={comment.game_image}
                                                    alt=""
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-white font-medium line-clamp-1">
                                                    {comment.game_name}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 flex-shrink-0 ml-2">
                                                    {formatDate(comment.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-400 line-clamp-2">{comment.content}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Show More/Less Button */}
                            {comments.length > INITIAL_SHOW_COUNT && (
                                <button
                                    onClick={() => setShowAllComments(!showAllComments)}
                                    className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    {showAllComments ? (
                                        <>
                                            <ChevronUp className="w-4 h-4" />
                                            Show Less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-4 h-4" />
                                            Show All ({comments.length})
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </main>
    );
}

