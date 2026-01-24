"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, Gamepad2, Command } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchGames } from "@/lib/rawg";
import type { Game } from "@/lib/rawg";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    // Search query
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ["search", debouncedQuery],
        queryFn: () => searchGames(debouncedQuery, 1, 8),
        enabled: debouncedQuery.length >= 2,
        staleTime: 60000,
    });

    const handleResultClick = () => {
        setQuery("");
        onClose();
    };

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
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[70] px-4"
                    >
                        <div className="glass-strong rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08]"
                            style={{
                                boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset, 0 25px 50px rgba(0,0,0,0.6), 0 0 100px rgba(139,92,246,0.1)"
                            }}
                        >
                            {/* Search Input - Enhanced */}
                            <div className="flex items-center gap-4 p-5 border-b border-white/[0.06]">
                                <Search className="w-5 h-5 text-zinc-500" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search games..."
                                    className="flex-1 bg-transparent text-white placeholder:text-zinc-600 outline-none text-lg"
                                />
                                {(isLoading || isFetching) && (
                                    <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-2 hover:bg-zinc-800/80 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </motion.button>
                            </div>

                            {/* Results - Enhanced */}
                            <div className="max-h-[60vh] overflow-y-auto">
                                {debouncedQuery.length < 2 ? (
                                    <div className="p-10 text-center">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
                                            <Gamepad2 className="w-8 h-8 text-zinc-600" />
                                        </div>
                                        <p className="text-zinc-500">Start typing to search games...</p>
                                        <p className="text-zinc-600 text-sm mt-2">Try searching for &quot;GTA&quot; or &quot;Zelda&quot;</p>
                                    </div>
                                ) : data?.results?.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <p className="text-zinc-500">No games found for &quot;{debouncedQuery}&quot;</p>
                                    </div>
                                ) : (
                                    <div className="p-3">
                                        {data?.results?.map((game: Game, index: number) => (
                                            <Link
                                                key={game.id}
                                                href={`/game/${game.id}`}
                                                onClick={handleResultClick}
                                            >
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    whileHover={{ backgroundColor: "rgba(139, 92, 246, 0.1)", x: 4 }}
                                                    className="flex items-center gap-4 p-3 rounded-xl transition-all border border-transparent hover:border-violet-500/20"
                                                >
                                                    {/* Thumbnail - Enhanced */}
                                                    <div className="relative w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                                                        {game.background_image ? (
                                                            <Image
                                                                src={game.background_image}
                                                                alt={game.name}
                                                                fill
                                                                className="object-cover"
                                                                sizes="64px"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                                                <Gamepad2 className="w-4 h-4 text-zinc-600" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-white font-medium truncate">{game.name}</h3>
                                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                            {game.released && (
                                                                <span>{new Date(game.released).getFullYear()}</span>
                                                            )}
                                                            {game.genres?.slice(0, 2).map((g) => (
                                                                <span key={g.id} className="text-zinc-600">
                                                                    {g.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Rating - Enhanced */}
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/50">
                                                        <span className="text-yellow-400 text-sm">★</span>
                                                        <span className="text-zinc-300 text-sm font-medium">{game.rating.toFixed(1)}</span>
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer Hint - Enhanced */}
                            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5">
                                        <kbd className="kbd-2026">ESC</kbd>
                                        <span>to close</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <kbd className="kbd-2026">↵</kbd>
                                        <span>to select</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-zinc-600">
                                    <Command className="w-3 h-3" />
                                    <span>K</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

