"use client";

import { motion } from "framer-motion";
import { Heart, ArrowLeft, Trash2, Gamepad2, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";
interface WishlistItem {
    id: string;
    game_id: number;
    game_name: string;
    game_image: string | null;
}

export default function WishlistPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const toast = useToast();
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            if (!user) {
                setLoadingItems(false);
                return;
            }

            const { data } = await supabase
                .from("wishlists")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (data) {
                setWishlistItems(data);
            }
            setLoadingItems(false);
        };

        if (!authLoading) {
            fetchWishlist();
        }
    }, [user, authLoading]);

    const removeFromWishlist = async (gameId: number) => {
        if (!user) return;

        // Optimistic update
        setWishlistItems(prev => prev.filter(item => item.game_id !== gameId));

        try {
            await supabase
                .from("wishlists")
                .delete()
                .eq("user_id", user.id)
                .eq("game_id", gameId);
            toast.success("Removed from wishlist");
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove");
        }
    };

    if (authLoading || loadingItems) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-8 text-center max-w-md w-full"
                >
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center">
                        <Heart className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Your Wishlist</h1>
                    <p className="text-zinc-400 mb-6">
                        Sign in to save your favorite games and access them anytime.
                    </p>
                    <Link href="/login">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="gradient-button w-full py-3 rounded-xl font-semibold"
                        >
                            Sign In to Continue
                        </motion.button>
                    </Link>
                    <Link href="/" className="block mt-4 text-sm text-zinc-500 hover:text-blue-400 transition-colors">
                        ← Back to Home
                    </Link>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pb-24 relative overflow-hidden">
            {/* Decorative Background Orbs */}
            <div className="orb orb-pink w-[500px] h-[500px] -top-48 right-[-200px] opacity-35 animate-float" />
            <div className="orb orb-violet w-[400px] h-[400px] bottom-32 -left-48 opacity-30 animate-float-delayed" />

            {/* Header */}
            <header className="sticky top-0 z-40 py-4 px-4 md:px-8 glass-strong-2026 border-b border-white/5">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <Link href="/">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-xl hover:bg-zinc-800 transition-colors glow-on-hover"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </motion.button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Heart className="w-6 h-6 text-blue-400" />
                        <h1 className="text-xl font-bold gradient-text-2026">My Wishlist</h1>
                        <span className="text-sm text-zinc-400 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                            {wishlistItems.length}
                        </span>
                    </div>
                </div>
            </header>

            <div className="px-4 md:px-8 max-w-7xl mx-auto mt-8">
                {wishlistItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800/50 flex items-center justify-center">
                            <Gamepad2 className="w-10 h-10 text-zinc-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">No games yet</h2>
                        <p className="text-zinc-400 mb-6">
                            Start exploring and add games to your wishlist!
                        </p>
                        <Link href="/">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="gradient-button px-6 py-3 rounded-xl font-semibold"
                            >
                                Explore Games
                            </motion.button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {wishlistItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card-2026 card-hover-2026 rounded-xl overflow-hidden group relative"
                            >
                                <Link href={`/game/${item.game_id}`}>
                                    <div className="relative aspect-[16/10]">
                                        {item.game_image ? (
                                            <Image
                                                src={item.game_image}
                                                alt={item.game_name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                                <Gamepad2 className="w-8 h-8 text-zinc-600" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </div>
                                </Link>

                                <div className="p-4 flex items-center justify-between">
                                    <Link href={`/game/${item.game_id}`}>
                                        <h3 className="font-medium text-white hover:text-blue-400 transition-colors line-clamp-1">
                                            {item.game_name}
                                        </h3>
                                    </Link>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => removeFromWishlist(item.game_id)}
                                        className="p-2 rounded-lg bg-zinc-800/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}


