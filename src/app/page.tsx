"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight, TrendingUp, Rocket, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { FloatingDock } from "@/components/ui/floating-dock";
import { SearchModal } from "@/components/search-modal";
import { GenreModal } from "@/components/genre-modal";
import { HeroBanner } from "@/components/hero-banner";
import { GameCard } from "@/components/game-card";
import { UpcomingHypeCard } from "@/components/upcoming-hype-card";
import { SkeletonCard, SkeletonGrid } from "@/components/skeleton-card";
import { getTrendingGames, getUpcomingGames, getAllTimeGreats, getGameTrailers, getTodaysPickGame, type Game } from "@/lib/rawg";
import { searchYoutubeVideo } from "@/lib/youtube";
import { useAuth } from "@/hooks/use-auth";

// Section Header Component with enhanced 2026 styling
function SectionHeader({
  title,
  icon,
  href,
}: {
  title: string;
  icon: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 text-blue-400 glow-on-hover">
          {icon}
        </div>
        <h2 className="text-xl md:text-2xl font-bold gradient-text-2026">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-400 hover:text-blue-400 bg-zinc-800/30 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 rounded-lg transition-all duration-300"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

// Section Divider Component
function SectionDivider() {
  return <div className="section-divider my-12 md:my-16" />;
}

// Game Grid Component
function GameGrid({ games, isLoading }: { games?: Game[]; isLoading: boolean }) {
  if (isLoading) {
    return <SkeletonGrid count={6} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {games?.slice(0, 8).map((game, index) => (
        <motion.div
          key={game.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <GameCard game={game} priority={index < 4} />
        </motion.div>
      ))}
    </div>
  );
}

// GOAT Bento Grid Component - 6 cards: 1 large featured (95+) + 5 smaller (90+)
// Layout: Left = large card (2 cols, 3 rows), Right = 3 small cards stacked
// Bottom = 2 small cards
function GOATBentoGrid({ games, isLoading }: { games?: Game[]; isLoading: boolean }) {
  // 3D tilt effect handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {/* Row 1-2 */}
        <div className="col-span-2 row-span-2 aspect-[16/9] skeleton-2026 rounded-2xl" />
        <div className="col-span-1 aspect-[4/3] skeleton-2026 rounded-2xl" />
        <div className="col-span-1 aspect-[4/3] skeleton-2026 rounded-2xl" />
        <div className="col-span-1 aspect-[4/3] skeleton-2026 rounded-2xl" />
        {/* Row 3 */}
        <div className="col-span-1 aspect-[4/3] skeleton-2026 rounded-2xl" />
        <div className="col-span-1 aspect-[4/3] skeleton-2026 rounded-2xl" />
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        No legendary games found
      </div>
    );
  }

  // First game is 95+ (featured), rest are 90+ (smaller)
  const [featured, ...smallerGames] = games.slice(0, 6);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Featured card - Big (95+ rated) - spans 2 columns and 2 rows */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 row-span-2"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transformStyle: 'preserve-3d', transition: 'transform 0.15s ease-out' }}
      >
        <Link href={`/game/${featured.id}`} className="block h-full">
          <div className="glass-card-2026 rounded-2xl overflow-hidden h-full group relative">
            <div className="relative h-full min-h-[280px]">
              <Image
                src={featured.background_image || "/placeholder.jpg"}
                alt={featured.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {/* Rating badge */}
                <div className="rating-badge-2026 mb-3 inline-flex">
                  {featured.metacritic}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2">
                  {featured.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className="text-blue-400 font-medium">95+ Legendary</span>
                  <span>•</span>
                  <span>{new Date(featured.released).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Smaller cards (90+ rated) - 5 cards */}
      {smallerGames.slice(0, 5).map((game, index) => (
        <motion.div
          key={game.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (index + 1) * 0.1 }}
          className="col-span-1"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ transformStyle: 'preserve-3d', transition: 'transform 0.15s ease-out' }}
        >
          <Link href={`/game/${game.id}`} className="block">
            <div className="glass-card-2026 card-hover-2026 rounded-2xl overflow-hidden group relative aspect-[4/3]">
              <Image
                src={game.background_image || "/placeholder.jpg"}
                alt={game.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="rating-badge-2026 mb-2 text-sm inline-flex">
                  {game.metacritic}
                </div>
                <h4 className="text-sm font-semibold text-white line-clamp-2">
                  {game.name}
                </h4>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

// Upcoming Hype Bento Grid Component
function UpcomingHypeGrid({ games, isLoading }: { games?: Game[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-4 h-[500px] md:h-[600px]">
        <div className="col-span-2 row-span-1 skeleton rounded-2xl" />
        <div className="col-span-1 row-span-1 skeleton rounded-2xl" />
        <div className="col-span-1 row-span-1 skeleton rounded-2xl" />
        <div className="col-span-2 row-span-1 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        No hyped 2026 games found
      </div>
    );
  }

  // Bento grid layout: 3 columns, 2 rows
  // Top-left: wide (col-span-2), Top-right: small (col-span-1)
  // Bottom-left: small (col-span-1), Bottom-right: wide (col-span-2)
  const gridPositions = [
    "col-span-2 row-span-1", // Top-left - wide
    "col-span-1 row-span-1", // Top-right - small
    "col-span-1 row-span-1", // Bottom-left - small
    "col-span-2 row-span-1", // Bottom-right - wide
  ];

  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-4 h-[500px] md:h-[600px]">
      {games.slice(0, 4).map((game, index) => (
        <motion.div
          key={game.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={gridPositions[index]}
        >
          <UpcomingHypeCard
            game={game}
            priority={index < 2}
            variant={index === 0 || index === 3 ? "wide" : "square"}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const { profile, isAuthenticated } = useAuth();

  // Global keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch trending games
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () => getTrendingGames(1, 12),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch upcoming games (4 most hyped)
  const { data: upcomingData, isLoading: upcomingLoading } = useQuery({
    queryKey: ["upcoming"],
    queryFn: () => getUpcomingGames(1, 4),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch all-time greats
  const { data: goatsData, isLoading: goatsLoading } = useQuery({
    queryKey: ["goats"],
    queryFn: () => getAllTimeGreats(),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  // Fetch Today's "Hot Pick"
  const { data: heroGame, isLoading: heroLoading } = useQuery({
    queryKey: ["todaysPick"],
    queryFn: () => getTodaysPickGame(),
  });

  const todaysPick = heroGame;

  // Fetch trailer with priority: YouTube Trailer → YouTube Gameplay → RAWG → HD Image
  const { data: trailerData } = useQuery({
    queryKey: ["trailer", todaysPick?.id, todaysPick?.name],
    queryFn: async () => {
      if (!todaysPick) return null;

      // 1. Try YouTube TRAILER first (official trailers are best for hero)
      console.log(`[Video Search] Looking for trailer for: ${todaysPick.name}`);
      let youtubeId = await searchYoutubeVideo(todaysPick.name);

      // Also try with slug if name didn't work
      if (!youtubeId && todaysPick.slug && todaysPick.slug !== todaysPick.name.toLowerCase()) {
        const slugAsName = todaysPick.slug.replace(/-/g, ' ');
        youtubeId = await searchYoutubeVideo(slugAsName);
      }

      if (youtubeId) {
        console.log(`✓ Using YouTube video for: ${todaysPick.name}`);
        return { type: 'youtube', src: youtubeId };
      }

      // 2. Try RAWG trailers as last resort (sometimes they have exclusive footage)
      const rawgTrailers = await getGameTrailers(todaysPick.id);
      if (rawgTrailers.results.length > 0) {
        console.log(`✓ Using RAWG trailer for: ${todaysPick.name}`);
        return { type: 'rawg', src: rawgTrailers.results[0].data.max };
      }

      // 3. No video found - will show HD background image
      console.log(`No trailer found for: ${todaysPick.name}, using HD image`);
      return null;
    },
    enabled: !!todaysPick,
  });

  // Get username for welcome message
  const username = profile?.username;

  return (
    <main className="min-h-screen pb-24 relative overflow-hidden">
      {/* Decorative Background Orbs */}
      <div className="orb orb-violet w-[600px] h-[600px] -top-64 -right-64 opacity-40 animate-float" />
      <div className="orb orb-cyan w-[400px] h-[400px] top-[40%] -left-48 opacity-30 animate-float-delayed" />
      <div className="orb orb-pink w-[500px] h-[500px] bottom-32 right-[-200px] opacity-25 animate-float" />

      {/* Sticky Header with Scroll Blur Effect */}
      <header className="sticky top-0 z-40 py-4 px-4 md:px-8 glass-strong-2026 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/25">
                <Image
                  src="/logo.png"
                  alt="GameTale"
                  width={40}
                  height={40}
                  className="object-cover"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold gradient-text-animated">GameTale</span>
                {isAuthenticated && username && (
                  <p className="text-xs text-zinc-400">
                    welcomes you, <span className="text-blue-400 font-medium">{username}</span> 👋
                  </p>
                )}
              </div>
            </motion.div>
          </Link>

          {/* Mobile welcome message */}
          {isAuthenticated && username && (
            <div className="sm:hidden text-right">
              <p className="text-xs text-zinc-400">
                Welcome, <span className="text-blue-400 font-medium">{username}</span> 👋
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 md:px-8 max-w-7xl mx-auto space-y-12 md:space-y-16">
        {/* Hero Banner - Today's Pick */}
        <section>
          {heroLoading || !todaysPick ? (
            <SkeletonCard variant="hero" />
          ) : (
            <HeroBanner
              game={todaysPick}
              trailer={trailerData?.type === 'rawg' ? { data: { max: trailerData.src }, preview: "" } : undefined}
              youtubeId={trailerData?.type === 'youtube' ? trailerData.src : undefined}
              title="Today's Pick"
            />
          )}
        </section>

        <SectionDivider />

        {/* Trending This Week */}
        <section>
          <SectionHeader
            title="Trending This Week"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <GameGrid games={trendingData?.results} isLoading={trendingLoading} />
        </section>

        <SectionDivider />

        {/* Upcoming Hype */}
        <section>
          <SectionHeader
            title="Upcoming Hype"
            icon={<Rocket className="w-5 h-5" />}
          />
          <UpcomingHypeGrid games={upcomingData?.results} isLoading={upcomingLoading} />
        </section>

        <SectionDivider />

        {/* All-Time GOATs */}
        <section>
          <SectionHeader
            title="All-Time GOATs"
            icon={<Trophy className="w-5 h-5" />}
          />
          <GOATBentoGrid games={goatsData?.results} isLoading={goatsLoading} />
        </section>
      </div>

      {/* Floating Navigation Dock */}
      <FloatingDock
        onSearchClick={() => setSearchOpen(true)}
        onGenreClick={() => setGenreOpen(true)}
      />

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Genre Modal */}
      <GenreModal isOpen={genreOpen} onClose={() => setGenreOpen(false)} />
    </main>
  );
}


