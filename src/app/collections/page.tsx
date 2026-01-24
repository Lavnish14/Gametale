"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Lock, Globe, Trash2 } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import {
    getUserCollections,
    createCollection,
    deleteCollection,
    type Collection
} from "@/lib/supabase";
import { useToast } from "@/components/toast";

export default function CollectionsPage() {
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");

    useEffect(() => {
        const fetch = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            const { data } = await getUserCollections(user.id);
            setCollections(data || []);
            setIsLoading(false);
        };
        fetch();
    }, [user]);

    const handleCreate = async () => {
        if (!user || !newName.trim()) return;

        const { data, error } = await createCollection(user.id, newName.trim(), newDesc.trim() || undefined);
        if (data && !error) {
            setCollections((prev) => [data as Collection, ...prev]);
            setNewName("");
            setNewDesc("");
            setShowCreate(false);
            toast.success("Collection created!");
        } else {
            toast.error("Failed to create collection");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this collection?")) return;

        const { error } = await deleteCollection(id);
        if (!error) {
            setCollections((prev) => prev.filter((c) => c.id !== id));
            toast.success("Collection deleted");
        } else {
            toast.error("Failed to delete collection");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Sign in to create collections</h1>
                    <Link href="/login" className="text-blue-400 hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white">My Collections</h1>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Collection
                </motion.button>
            </div>

            {/* Create form */}
            {showCreate && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card-2026 rounded-xl p-6 mb-6 space-y-4"
                >
                    <input
                        type="text"
                        placeholder="Collection name..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                    <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            disabled={!newName.trim()}
                            className="px-4 py-2 bg-violet-600 text-white rounded-lg disabled:opacity-50 hover:bg-violet-500 transition-colors"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setShowCreate(false)}
                            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className="text-center py-12 text-zinc-500">Loading collections...</div>
            )}

            {/* Collections list */}
            <div className="space-y-4">
                {collections.map((collection) => (
                    <motion.div
                        key={collection.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card-2026 rounded-xl p-5 flex items-center justify-between group"
                    >
                        <Link href={`/collections/${collection.id}`} className="flex-1">
                            <div className="flex items-center gap-3">
                                {collection.is_public ? (
                                    <Globe className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Lock className="w-4 h-4 text-zinc-500" />
                                )}
                                <div>
                                    <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">{collection.name}</h3>
                                    {collection.description && (
                                        <p className="text-sm text-zinc-400">{collection.description}</p>
                                    )}
                                </div>
                            </div>
                        </Link>
                        <button
                            onClick={() => handleDelete(collection.id)}
                            className="p-2 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}

                {collections.length === 0 && !isLoading && (
                    <p className="text-center text-zinc-500 py-8">
                        No collections yet. Create your first one!
                    </p>
                )}
            </div>
        </main>
    );
}

