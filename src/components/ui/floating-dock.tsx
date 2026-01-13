"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, MotionValue } from "framer-motion";
import { Home, Search, Gamepad2, Heart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface DockItem {
    icon: React.ReactNode;
    label: string;
    href?: string;
    onClick?: () => void;
}

interface FloatingDockProps {
    onSearchClick: () => void;
    onGenreClick: () => void;
}

export function FloatingDock({ onSearchClick, onGenreClick }: FloatingDockProps) {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();
    const mouseX = useMotionValue(Infinity);

    const items: DockItem[] = [
        { icon: <Home className="w-full h-full" />, label: "Home", href: "/" },
        { icon: <Search className="w-full h-full" />, label: "Search", onClick: onSearchClick },
        { icon: <Gamepad2 className="w-full h-full" />, label: "Genres", onClick: onGenreClick },
        { icon: <Heart className="w-full h-full" />, label: "Wishlist", href: "/wishlist" },
        {
            icon: <User className="w-full h-full" />,
            label: "Profile",
            href: isAuthenticated ? "/profile" : "/login"
        },
    ];

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
            <motion.div
                onMouseMove={(e) => mouseX.set(e.pageX)}
                onMouseLeave={() => mouseX.set(Infinity)}
                className="flex items-end gap-1.5 px-3 py-2.5 rounded-2xl bg-[#0a0a0f]/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/60"
                style={{
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset, 0 20px 40px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.08)"
                }}
            >
                {items.map((item, index) => (
                    <DockIcon
                        key={index}
                        item={item}
                        mouseX={mouseX}
                        isActive={item.href === pathname}
                    />
                ))}
            </motion.div>
        </motion.div>
    );
}

interface DockIconProps {
    item: DockItem;
    mouseX: MotionValue<number>;
    isActive: boolean;
}

function DockIcon({ item, mouseX, isActive }: DockIconProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Distance from mouse to center of icon
    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    // Enhanced size and magnification
    const baseSize = 40;
    const maxSize = 56;
    const magnificationRange = 150; // range for smooth effect

    // Transform distance to size with smooth falloff
    const widthSync = useTransform(distance, [-magnificationRange, 0, magnificationRange], [baseSize, maxSize, baseSize]);
    const width = useSpring(widthSync, {
        mass: 0.1,
        stiffness: 150,
        damping: 12
    });

    const content = (
        <motion.div
            ref={ref}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "relative flex items-center justify-center rounded-xl transition-all duration-300 aspect-square",
                isActive
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                    : "bg-zinc-800/40 text-zinc-500 hover:text-white hover:bg-zinc-700/60"
            )}
            style={{
                width,
                height: width,
                boxShadow: isActive
                    ? "0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)"
                    : "none"
            }}
        >
            {/* Active Indicator Glow */}
            {isActive && (
                <motion.div
                    className="absolute inset-0 rounded-xl bg-blue-500/20 blur-xl -z-10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    transition={{ duration: 0.3 }}
                />
            )}

            {/* Icon container */}
            <div className="w-1/2 h-1/2">
                {item.icon}
            </div>

            {/* Enhanced Tooltip */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[#121218] border border-white/10 shadow-xl whitespace-nowrap"
                        style={{
                            boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
                        }}
                    >
                        <span className="text-xs font-medium text-white">{item.label}</span>
                        {/* Tooltip arrow */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#121218] border-r border-b border-white/10 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    if (item.href) {
        return (
            <Link href={item.href}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={item.onClick}>
            {content}
        </button>
    );
}
