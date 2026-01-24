"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    type VibeTag,
    VIBE_TAGS_CONFIG,
    getGameVibeTags,
    getUserVibeTags,
    toggleVibeTag
} from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/toast";

interface VibeTagsProps {
    gameId: number;
}

export function VibeTags({ gameId }: VibeTagsProps) {
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();
    const [gameTags, setGameTags] = useState<{ tag: VibeTag; count: number }[]>([]);
    const [userTags, setUserTags] = useState<VibeTag[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchTags = async () => {
            const tags = await getGameVibeTags(gameId);
            setGameTags(tags);

            if (user) {
                const uTags = await getUserVibeTags(user.id, gameId);
                setUserTags(uTags);
            }
        };
        fetchTags();
    }, [gameId, user]);

    const handleTagToggle = async (tag: VibeTag) => {
        if (!isAuthenticated || !user || isLoading) return;

        setIsLoading(true);
        try {
            const result = await toggleVibeTag(user.id, gameId, tag);

            if (result.added) {
                setUserTags((prev) => [...prev, tag]);
                setGameTags((prev) => {
                    const existing = prev.find((t) => t.tag === tag);
                    if (existing) {
                        return prev.map((t) => t.tag === tag ? { ...t, count: t.count + 1 } : t);
                    }
                    return [...prev, { tag, count: 1 }].sort((a, b) => b.count - a.count);
                });
                toast.success(`Added ${VIBE_TAGS_CONFIG[tag].emoji} ${VIBE_TAGS_CONFIG[tag].label}`);
            } else {
                setUserTags((prev) => prev.filter((t) => t !== tag));
                setGameTags((prev) =>
                    prev.map((t) => t.tag === tag ? { ...t, count: t.count - 1 } : t)
                        .filter((t) => t.count > 0)
                );
                toast.success(`Removed ${VIBE_TAGS_CONFIG[tag].label}`);
            }
        } catch {
            toast.error("Failed to update tag");
        } finally {
            setIsLoading(false);
        }
    };

    const allTags = Object.keys(VIBE_TAGS_CONFIG) as VibeTag[];

    return (
        <div className="glass-card-2026 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Vibe Check</h3>
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs text-blue-400 hover:underline"
                >
                    {showAll ? "Show less" : "Add tags"}
                </button>
            </div>

            {/* Existing tags */}
            {gameTags.length > 0 && !showAll && (
                <div className="flex flex-wrap gap-2">
                    {gameTags.slice(0, 5).map(({ tag, count }) => {
                        const config = VIBE_TAGS_CONFIG[tag];
                        const isUserTag = userTags.includes(tag);
                        return (
                            <motion.button
                                key={tag}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTagToggle(tag)}
                                disabled={!isAuthenticated || isLoading}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all",
                                    isUserTag
                                        ? "bg-violet-500/20 border border-violet-500/50 text-violet-300"
                                        : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"
                                )}
                            >
                                <span>{config.emoji}</span>
                                <span>{config.label}</span>
                                <span className="text-xs opacity-60">({count})</span>
                            </motion.button>
                        );
                    })}
                </div>
            )}

            {/* All tags selector */}
            {showAll && (
                <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                        const config = VIBE_TAGS_CONFIG[tag];
                        const isUserTag = userTags.includes(tag);
                        const gameTag = gameTags.find((t) => t.tag === tag);
                        return (
                            <motion.button
                                key={tag}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTagToggle(tag)}
                                disabled={!isAuthenticated || isLoading}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all",
                                    isUserTag
                                        ? "bg-violet-500/20 border border-violet-500/50 text-violet-300"
                                        : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"
                                )}
                            >
                                <span>{config.emoji}</span>
                                <span>{config.label}</span>
                                {gameTag && <span className="text-xs opacity-60">({gameTag.count})</span>}
                            </motion.button>
                        );
                    })}
                </div>
            )}

            {gameTags.length === 0 && !showAll && (
                <p className="text-zinc-500 text-sm">No vibes yet. Be the first!</p>
            )}

            {!isAuthenticated && (
                <p className="text-xs text-zinc-500">Sign in to add vibes</p>
            )}
        </div>
    );
}

