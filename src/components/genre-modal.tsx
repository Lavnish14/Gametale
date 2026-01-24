"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { POPULAR_GENRES } from "@/lib/rawg";

interface GenreModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GenreModal({ isOpen, onClose }: GenreModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60]"
                    >
                        <div className="glass-strong rounded-2xl p-5 w-[360px] max-w-[90vw] shadow-2xl border border-white/[0.08]"
                            style={{
                                boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset, 0 20px 40px rgba(0,0,0,0.5), 0 0 60px rgba(139,92,246,0.08)"
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                        <Gamepad2 className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <h3 className="text-base font-semibold text-white">Browse by Genre</h3>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-2 hover:bg-zinc-800/80 rounded-xl transition-colors"
                                >
                                    <X className="w-4 h-4 text-zinc-400" />
                                </motion.button>
                            </div>

                            {/* Genre Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {POPULAR_GENRES.map((genre, index) => (
                                    <Link
                                        key={genre.slug}
                                        href={`/genre/${genre.slug}`}
                                        onClick={onClose}
                                    >
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            whileHover={{ scale: 1.02, x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="px-4 py-3 text-sm text-zinc-300 hover:text-white
                                                bg-zinc-800/40 hover:bg-gradient-to-r hover:from-violet-600/20 hover:to-pink-600/10
                                                rounded-xl transition-all duration-300 border border-transparent hover:border-violet-500/30"
                                        >
                                            {genre.name}
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

