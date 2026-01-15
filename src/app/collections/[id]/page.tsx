"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import {
    getCollection,
    removeFromCollection,
    type Collection
} from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface CollectionPageProps {
    params: Promise<{ id: string }>;
}

export default function CollectionDetailPage({ params }: CollectionPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const toast = useToast();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCollection = async () => {
            const { data } = await getCollection(id);
            setCollection(data);
            setIsLoading(false);
        };
        fetchCollection();
    }, [id]);

    const handleRemoveGame = async (gameId: number) => {
        if (!collection) return;

        const { error } = await removeFromCollection(collection.id, gameId);
        if (!error) {
            setCollection((prev) => {
                if (!prev || !prev.items) return prev;
                return {
                    ...prev,
                    items: prev.items.filter((item) => item.game_id !== gameId)
                };
            });
            toast.success("Game removed from collection");
        } else {
            toast.error("Failed to remove game");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-zinc-500">Loading collection...</div>
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Collection Not Found</h1>
                    <Link href="/collections" className="text-blue-400 hover:underline">
                        Back to Collections
                    </Link>
                </div>
            </div>
        );
    }

    const isOwner = user?.id === collection.user_id;

    return (
        <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.back()}
                    className="p-2 glass rounded-lg"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </motion.button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{collection.name}</h1>
                    {collection.description && (
                        <p className="text-zinc-400">{collection.description}</p>
                    )}
                </div>
            </div>

            {/* Games Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {collection.items?.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card-2026 rounded-xl overflow-hidden group relative"
                    >
                        <Link href={`/game/${item.game_id}`}>
                            <div className="relative aspect-[4/3]">
                                {item.game_image ? (
                                    <Image
                                        src={item.game_image}
                                        alt={item.game_name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                        <span className="text-zinc-600 text-sm">No Image</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            </div>
                            <div className="p-3">
                                <h3 className="text-sm font-semibold text-white line-clamp-2">
                                    {item.game_name}
                                </h3>
                            </div>
                        </Link>

                        {/* Remove button (only for owner) */}
                        {isOwner && (
                            <button
                                onClick={() => handleRemoveGame(item.game_id)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Empty state */}
            {(!collection.items || collection.items.length === 0) && (
                <div className="text-center py-12">
                    <p className="text-zinc-500 mb-4">No games in this collection yet.</p>
                    <Link href="/" className="text-blue-400 hover:underline">
                        Browse games to add
                    </Link>
                </div>
            )}
        </main>
    );
}
