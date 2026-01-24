"use client";

import { motion } from "framer-motion";

interface SkeletonCardProps {
    variant?: "default" | "hero";
}

export function SkeletonCard({ variant = "default" }: SkeletonCardProps) {
    if (variant === "hero") {
        return (
            <div className="relative w-full h-[65vh] md:h-[75vh] overflow-hidden rounded-2xl md:rounded-3xl">
                <div className="skeleton absolute inset-0" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-16">
                    <div className="skeleton w-32 h-8 rounded-full mb-5" />
                    <div className="skeleton w-3/4 h-14 md:h-20 rounded-xl mb-4" />
                    <div className="flex gap-4 mb-6">
                        <div className="skeleton w-16 h-6 rounded-lg" />
                        <div className="skeleton w-24 h-6 rounded-lg" />
                        <div className="skeleton w-28 h-6 rounded-lg" />
                    </div>
                    <div className="flex gap-2 mb-8">
                        <div className="skeleton w-20 h-8 rounded-full" />
                        <div className="skeleton w-24 h-8 rounded-full" />
                        <div className="skeleton w-16 h-8 rounded-full" />
                    </div>
                    <div className="flex gap-4">
                        <div className="skeleton w-40 h-14 rounded-xl" />
                        <div className="skeleton w-44 h-14 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl overflow-hidden"
        >
            {/* Image skeleton */}
            <div className="skeleton aspect-[16/10]" />

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
                <div className="skeleton h-5 w-4/5 rounded-lg" />
                <div className="flex gap-3">
                    <div className="skeleton h-4 w-14 rounded-lg" />
                    <div className="skeleton h-4 w-10 rounded-lg" />
                </div>
                <div className="flex gap-2">
                    <div className="skeleton h-6 w-16 rounded-lg" />
                    <div className="skeleton h-6 w-18 rounded-lg" />
                </div>
            </div>
        </motion.div>
    );
}

interface SkeletonGridProps {
    count?: number;
}

export function SkeletonGrid({ count = 6 }: SkeletonGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <SkeletonCard />
                </motion.div>
            ))}
        </div>
    );
}

