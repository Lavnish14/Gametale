"use client";

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

    const items: DockItem[] = [
        { icon: <Home className="w-5 h-5" />, label: "Home", href: "/" },
        { icon: <Search className="w-5 h-5" />, label: "Search", onClick: onSearchClick },
        { icon: <Gamepad2 className="w-5 h-5" />, label: "Genres", onClick: onGenreClick },
        { icon: <Heart className="w-5 h-5" />, label: "Wishlist", href: "/wishlist" },
        {
            icon: <User className="w-5 h-5" />,
            label: "Profile",
            href: isAuthenticated ? "/profile" : "/login"
        },
    ];

    return (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-1 px-2 py-2 rounded-full bg-zinc-900/95 backdrop-blur-sm border border-zinc-800">
                {items.map((item, index) => {
                    const isActive = item.href === pathname;

                    const buttonClasses = cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                        isActive
                            ? "bg-blue-500 text-white"
                            : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                    );

                    if (item.href) {
                        return (
                            <Link key={index} href={item.href} className={buttonClasses} title={item.label}>
                                {item.icon}
                            </Link>
                        );
                    }

                    return (
                        <button key={index} onClick={item.onClick} className={buttonClasses} title={item.label}>
                            {item.icon}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

