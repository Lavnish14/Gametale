"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Send, User, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import type { Comment } from "@/lib/supabase";

interface CommentsSectionProps {
    comments: Comment[];
    onSubmit?: (content: string) => void;
    isAuthenticated?: boolean;
    isLoading?: boolean;
}

export function CommentsSection({
    comments,
    onSubmit,
    isAuthenticated = false,
    isLoading = false
}: CommentsSectionProps) {
    const [newComment, setNewComment] = useState("");
    const [localComments, setLocalComments] = useState<Comment[]>(comments);

    // Update local comments when prop changes (for real-time)
    useEffect(() => {
        setLocalComments(comments);
    }, [comments]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !onSubmit) return;
        onSubmit(newComment);
        setNewComment("");
    };

    return (
        <div className="glass rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <MessageCircle className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white">Comments</h3>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800/80 text-xs text-zinc-400 font-medium">
                    {localComments.length}
                </span>
            </div>

            {/* Comment Input - Enhanced */}
            {isAuthenticated ? (
                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="flex gap-3">
                        {/* Avatar with gradient ring */}
                        <div className="avatar-ring-2026 flex-shrink-0">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <User className="w-5 h-5 text-zinc-400" />
                            </div>
                        </div>
                        <div className="flex-1 flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    maxLength={500}
                                    className="w-full bg-zinc-800/40 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:bg-zinc-800/60 transition-all"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">
                                    {newComment.length}/500
                                </span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={!newComment.trim() || isLoading}
                                className="gradient-button px-4 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="mb-6 p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/30 text-center">
                    <p className="text-sm text-zinc-400">
                        <a href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Sign in</a> to leave a comment
                    </p>
                </div>
            )}

            {/* Comments List - Enhanced */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                <AnimatePresence mode="popLayout">
                    {localComments.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-10"
                        >
                            <MessageCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                            <p className="text-sm text-zinc-500">No comments yet</p>
                            <p className="text-xs text-zinc-600 mt-1">Be the first to share your thoughts!</p>
                        </motion.div>
                    ) : (
                        localComments.map((comment, index) => (
                            <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: index * 0.03 }}
                                className="flex gap-3 p-3 rounded-xl hover:bg-zinc-800/30 transition-colors"
                            >
                                {/* Avatar with gradient ring */}
                                <div className="flex-shrink-0">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600/50 to-pink-600/50 p-[2px]">
                                        <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
                                            {comment.profile?.avatar_url ? (
                                                <img
                                                    src={comment.profile.avatar_url}
                                                    alt={`${comment.profile?.username || 'User'} avatar`}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-4 h-4 text-zinc-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-white">
                                            {comment.profile?.username || "Anonymous"}
                                        </span>
                                        <span className="text-xs text-zinc-600">
                                            {formatDate(comment.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-400 break-words leading-relaxed">{comment.content}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

