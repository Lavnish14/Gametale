"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { RatingType, VoteReason } from "@/lib/supabase";
import { Share2, Sparkles, Check } from "lucide-react";

interface ReviewMeterProps {
    initialRating?: RatingType | null;
    initialReason?: VoteReason | null;
    onSubmit?: (rating: RatingType, reason?: VoteReason) => void;
    disabled?: boolean;
    ratingDistribution?: {
        goat: number;
        mid: number;
        trash: number;
        total: number;
    } | null;
    gameName?: string;
    gameId?: number;
}

// Rating configs
const RATINGS = {
    goat: {
        label: "GOAT",
        emoji: "🐐",
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.15)",
        borderColor: "rgba(34, 197, 94, 0.4)",
        description: "Must play!",
    },
    mid: {
        label: "MID",
        emoji: "😐",
        color: "#eab308",
        bgColor: "rgba(234, 179, 8, 0.15)",
        borderColor: "rgba(234, 179, 8, 0.4)",
        description: "It's okay",
    },
    trash: {
        label: "TRASH",
        emoji: "🗑️",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.15)",
        borderColor: "rgba(239, 68, 68, 0.4)",
        description: "Skip it",
    },
} as const;

const REASONS = {
    story: { label: "Story", emoji: "📖" },
    gameplay: { label: "Gameplay", emoji: "🎮" },
    graphics: { label: "Graphics", emoji: "🎨" },
    multiplayer: { label: "Multiplayer", emoji: "👥" },
    value: { label: "Value", emoji: "💰" },
    other: { label: "Other", emoji: "✨" },
} as const;

// Donut Chart Component with hover interactions
function DonutChart({
    distribution,
    onHover
}: {
    distribution?: { goat: number; mid: number; trash: number; total: number } | null;
    onHover: (segment: RatingType | null, percent: number) => void;
}) {
    const [hoveredSegment, setHoveredSegment] = useState<RatingType | null>(null);

    if (!distribution || distribution.total === 0) {
        return (
            <div className="relative w-[200px] h-[200px] mx-auto flex items-center justify-center">
                {/* Empty state circle */}
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#1f1f28"
                        strokeWidth="12"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Sparkles className="w-8 h-8 text-zinc-700 mb-2" />
                    <p className="text-zinc-500 text-sm font-medium">No votes yet</p>
                    <p className="text-zinc-600 text-xs">Be the first!</p>
                </div>
            </div>
        );
    }

    const { goat, mid, trash, total } = distribution;
    const goatPercent = Math.round((goat / total) * 100);
    const midPercent = Math.round((mid / total) * 100);
    const trashPercent = Math.round((trash / total) * 100);

    // SVG circle calculations
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    // Calculate stroke dash arrays for each segment
    const goatDash = (goatPercent / 100) * circumference;
    const midDash = (midPercent / 100) * circumference;
    const trashDash = (trashPercent / 100) * circumference;

    // Calculate offsets (segments start after previous ones)
    const goatOffset = 0;
    const midOffset = goatDash;
    const trashOffset = goatDash + midDash;

    const handleSegmentHover = (segment: RatingType | null, percent: number) => {
        setHoveredSegment(segment);
        onHover(segment, percent);
    };

    return (
        <div className="relative w-[200px] h-[200px] mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="#1f1f28"
                    strokeWidth="12"
                />

                {/* GOAT segment (Green) */}
                {goatPercent > 0 && (
                    <motion.circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={RATINGS.goat.color}
                        strokeWidth={hoveredSegment === "goat" ? "14" : "12"}
                        strokeDasharray={`${goatDash} ${circumference - goatDash}`}
                        strokeDashoffset={-goatOffset}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{
                            strokeDasharray: `${goatDash} ${circumference - goatDash}`,
                            strokeWidth: hoveredSegment === "goat" ? 14 : 12,
                            opacity: hoveredSegment && hoveredSegment !== "goat" ? 0.4 : 1
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="cursor-pointer"
                        style={{ filter: hoveredSegment === "goat" ? `drop-shadow(0 0 8px ${RATINGS.goat.color})` : "none" }}
                        onMouseEnter={() => handleSegmentHover("goat", goatPercent)}
                        onMouseLeave={() => handleSegmentHover(null, 0)}
                    />
                )}

                {/* MID segment (Yellow) */}
                {midPercent > 0 && (
                    <motion.circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={RATINGS.mid.color}
                        strokeWidth={hoveredSegment === "mid" ? "14" : "12"}
                        strokeDasharray={`${midDash} ${circumference - midDash}`}
                        strokeDashoffset={-midOffset}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{
                            strokeDasharray: `${midDash} ${circumference - midDash}`,
                            strokeWidth: hoveredSegment === "mid" ? 14 : 12,
                            opacity: hoveredSegment && hoveredSegment !== "mid" ? 0.4 : 1
                        }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        className="cursor-pointer"
                        style={{ filter: hoveredSegment === "mid" ? `drop-shadow(0 0 8px ${RATINGS.mid.color})` : "none" }}
                        onMouseEnter={() => handleSegmentHover("mid", midPercent)}
                        onMouseLeave={() => handleSegmentHover(null, 0)}
                    />
                )}

                {/* TRASH segment (Red) */}
                {trashPercent > 0 && (
                    <motion.circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={RATINGS.trash.color}
                        strokeWidth={hoveredSegment === "trash" ? "14" : "12"}
                        strokeDasharray={`${trashDash} ${circumference - trashDash}`}
                        strokeDashoffset={-trashOffset}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{
                            strokeDasharray: `${trashDash} ${circumference - trashDash}`,
                            strokeWidth: hoveredSegment === "trash" ? 14 : 12,
                            opacity: hoveredSegment && hoveredSegment !== "trash" ? 0.4 : 1
                        }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="cursor-pointer"
                        style={{ filter: hoveredSegment === "trash" ? `drop-shadow(0 0 8px ${RATINGS.trash.color})` : "none" }}
                        onMouseEnter={() => handleSegmentHover("trash", trashPercent)}
                        onMouseLeave={() => handleSegmentHover(null, 0)}
                    />
                )}
            </svg>
        </div>
    );
}

export function ReviewMeter({
    initialRating,
    initialReason,
    onSubmit,
    disabled = false,
    ratingDistribution,
    gameName,
    gameId
}: ReviewMeterProps) {
    const [selectedRating, setSelectedRating] = useState<RatingType | null>(initialRating ?? null);
    const [selectedReason, setSelectedReason] = useState<VoteReason | null>(initialReason ?? null);
    const [hasChanged, setHasChanged] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);
    const [hoveredSegment, setHoveredSegment] = useState<RatingType | null>(null);
    const [hoveredPercent, setHoveredPercent] = useState(0);

    // Calculate percentages
    const total = ratingDistribution?.total || 0;
    const goatPercent = total > 0 ? Math.round(((ratingDistribution?.goat || 0) / total) * 100) : 0;
    const midPercent = total > 0 ? Math.round(((ratingDistribution?.mid || 0) / total) * 100) : 0;
    const trashPercent = total > 0 ? Math.round(((ratingDistribution?.trash || 0) / total) * 100) : 0;

    // Determine dominant rating for default display
    const dominant = goatPercent >= midPercent && goatPercent >= trashPercent
        ? { type: "goat" as RatingType, percent: goatPercent }
        : midPercent >= trashPercent
            ? { type: "mid" as RatingType, percent: midPercent }
            : { type: "trash" as RatingType, percent: trashPercent };

    // Share function
    const handleShare = async () => {
        const shareText = gameName
            ? `${gameName} has ${goatPercent}% GOAT rating on GameTale!`
            : `Check out this game on GameTale!`;

        const shareUrl = gameId
            ? `${window.location.origin}/game/${gameId}`
            : window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: gameName || "GameTale",
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    await copyToClipboard(shareUrl);
                }
            }
        } else {
            await copyToClipboard(shareUrl);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 2000);
        } catch {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 2000);
        }
    };

    const handleRatingSelect = (rating: RatingType) => {
        if (disabled) return;
        setSelectedRating(rating);
        setHasChanged(rating !== initialRating);
    };

    const handleSubmit = () => {
        if (selectedRating && onSubmit) {
            onSubmit(selectedRating, selectedReason || undefined);
            setHasChanged(false);
        }
    };

    const handleChartHover = (segment: RatingType | null, percent: number) => {
        setHoveredSegment(segment);
        setHoveredPercent(percent);
    };

    // Get display values based on hover state
    const displayPercent = hoveredSegment ? hoveredPercent : (total > 0 ? dominant.percent : 0);
    const displayType = hoveredSegment || (total > 0 ? dominant.type : null);
    const displayColor = displayType ? RATINGS[displayType].color : "#71717a";

    return (
        <div className="bg-[#0c0c12] border border-zinc-800/50 rounded-3xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                    </div>
                    <h3 className="font-bold text-white text-lg">Community Rating</h3>
                </div>
                <button
                    onClick={handleShare}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all"
                    title="Share"
                >
                    {shareSuccess ? (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-green-400 text-xs font-medium"
                        >
                            Copied!
                        </motion.span>
                    ) : (
                        <Share2 className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Donut Chart with Center Display */}
            <div className="relative">
                <DonutChart
                    distribution={ratingDistribution}
                    onHover={handleChartHover}
                />

                {/* Center content - shows hovered or dominant percentage */}
                {total > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <motion.span
                            key={displayPercent}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-4xl font-bold"
                            style={{ color: displayColor }}
                        >
                            {displayPercent}%
                        </motion.span>
                        <span className="text-zinc-500 text-sm">
                            {displayType ? RATINGS[displayType].label : ""}
                        </span>
                        <span className="text-zinc-600 text-xs mt-1">
                            {total} {total === 1 ? "vote" : "votes"}
                        </span>
                    </div>
                )}
            </div>

            {/* Legend with percentages */}
            {total > 0 && (
                <div className="flex justify-center gap-6 pt-2">
                    {(["goat", "mid", "trash"] as RatingType[]).map((type) => {
                        const percent = type === "goat" ? goatPercent : type === "mid" ? midPercent : trashPercent;
                        return (
                            <div
                                key={type}
                                className={cn(
                                    "flex items-center gap-2 transition-opacity",
                                    hoveredSegment && hoveredSegment !== type && "opacity-40"
                                )}
                            >
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: RATINGS[type].color }}
                                />
                                <span className="text-zinc-400 text-xs">{RATINGS[type].label}</span>
                                <span
                                    className="text-xs font-bold"
                                    style={{ color: RATINGS[type].color }}
                                >
                                    {percent}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="border-t border-zinc-800/50 my-4" />

            {/* Rate Section */}
            <div className="text-center">
                <p className="text-zinc-500 text-sm mb-4">Cast your vote</p>
            </div>

            {/* Rating Buttons - Clean, no neon */}
            <div className="flex justify-center gap-3">
                {(["goat", "mid", "trash"] as RatingType[]).map((key) => {
                    const config = RATINGS[key];
                    const isSelected = selectedRating === key;

                    return (
                        <motion.button
                            key={key}
                            whileHover={{ scale: disabled ? 1 : 1.03, y: disabled ? 0 : -2 }}
                            whileTap={{ scale: disabled ? 1 : 0.97 }}
                            onClick={() => handleRatingSelect(key)}
                            disabled={disabled}
                            className={cn(
                                "relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 min-w-[85px]",
                                isSelected
                                    ? "ring-2 ring-offset-2 ring-offset-[#0c0c12]"
                                    : "bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                            style={{
                                backgroundColor: isSelected ? config.bgColor : undefined,
                                borderColor: isSelected ? config.borderColor : undefined,
                                // @ts-expect-error CSS custom property
                                "--tw-ring-color": isSelected ? config.color : undefined,
                            }}
                        >
                            {/* Selected checkmark */}
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: config.color }}
                                >
                                    <Check className="w-3 h-3 text-white" />
                                </motion.div>
                            )}

                            <span className="text-2xl mb-1">{config.emoji}</span>
                            <span
                                className={cn(
                                    "text-xs font-bold uppercase tracking-wide",
                                    isSelected ? "text-white" : "text-zinc-500"
                                )}
                                style={{ color: isSelected ? config.color : undefined }}
                            >
                                {config.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Reason Selector - Show after rating is selected */}
            {selectedRating && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3"
                >
                    <p className="text-zinc-500 text-sm text-center">Why?</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {(Object.keys(REASONS) as VoteReason[]).map((key) => {
                            const config = REASONS[key];
                            const isSelected = selectedReason === key;
                            return (
                                <motion.button
                                    key={key}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setSelectedReason(key);
                                        setHasChanged(true);
                                    }}
                                    className={cn(
                                        "px-3 py-2 rounded-xl text-sm transition-all",
                                        isSelected
                                            ? "bg-violet-500/20 border border-violet-500/50 text-violet-400"
                                            : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                    )}
                                >
                                    {config.emoji} {config.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Submit Button */}
            {onSubmit && (
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleSubmit}
                    disabled={disabled || !hasChanged || !selectedRating}
                    className={cn(
                        "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200",
                        hasChanged && selectedRating && !disabled
                            ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500"
                            : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800"
                    )}
                >
                    {selectedRating && !hasChanged ? (
                        <span className="flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" />
                            Vote Submitted
                        </span>
                    ) : (
                        "Submit Vote"
                    )}
                </motion.button>
            )}
        </div>
    );
}

