"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, TrendingUp, Rocket, Trophy, Newspaper, Tag, TrendingDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { FloatingDock } from "@/components/ui/floating-dock";
import { SearchModal } from "@/components/search-modal";
import { GenreModal } from "@/components/genre-modal";
import { HeroBanner } from "@/components/hero-banner";
import { GameCard } from "@/components/game-card";
import { UpcomingHypeCard } from "@/components/upcoming-hype-card";
import { SkeletonCard, SkeletonGrid } from "@/components/skeleton-card";
import { Top10Card } from "@/components/top10-card";
import { getTrendingGames, getUpcomingGames, getAllTimeGreats, getGameTrailers, getTodaysPickGame, type Game } from "@/lib/rawg";
import { searchYoutubeVideo } from "@/lib/youtube";
import { useAuth } from "@/hooks/use-auth";

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
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-zinc-800 text-blue-400">
          {icon}
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-white">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-zinc-400 hover:text-blue-400 transition-colors"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function SectionDivider() {
  return <div className="h-px w-full max-w-4xl mx-auto my-10 bg-zinc-800" />;
}

function GameGrid({ games, isLoading }: { games?: Game[]; isLoading: boolean }) {
  if (isLoading) {
    return <SkeletonGrid count={6} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {games?.slice(0, 8).map((game, index) => (
        <GameCard key={game.id} game={game} priority={index < 4} />
      ))}
    </div>
  );
}

function GOATBentoGrid({ games, isLoading }: { games?: Game[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 row-span-2 aspect-[16/9] skeleton rounded-lg" />
        <div className="col-span-1 aspect-[4/3] skeleton rounded-lg" />
        <div className="col-span-1 aspect-[4/3] skeleton rounded-lg" />
        <div className="col-span-1 aspect-[4/3] skeleton rounded-lg" />
        <div className="col-span-1 aspect-[4/3] skeleton rounded-lg" />
        <div className="col-span-1 aspect-[4/3] skeleton rounded-lg" />
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

  const [featured, ...smallerGames] = games.slice(0, 6);

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Featured card */}
      <Link href={`/game/${featured.id}`} className="col-span-2 row-span-2 group">
        <div className="relative h-full min-h-[280px] rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
          <Image
            src={featured.background_image || "/placeholder.jpg"}
            alt={featured.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            {featured.metacritic && (
              <span className="inline-block px-2 py-0.5 mb-2 text-xs font-semibold bg-green-500/20 text-green-400 rounded border border-green-500/30">
                {featured.metacritic}
              </span>
            )}
            <h3 className="text-xl md:text-2xl font-bold text-white mb-1 line-clamp-2">
              {featured.name}
            </h3>
            <p className="text-sm text-zinc-400">
              {new Date(featured.released).getFullYear()}
            </p>
          </div>
        </div>
      </Link>

      {/* Smaller cards */}
      {smallerGames.slice(0, 5).map((game) => (
        <Link key={game.id} href={`/game/${game.id}`} className="col-span-1 group">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
            <Image
              src={game.background_image || "/placeholder.jpg"}
              alt={game.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              {game.metacritic && (
                <span className="inline-block px-1.5 py-0.5 mb-1 text-[10px] font-semibold bg-green-500/20 text-green-400 rounded">
                  {game.metacritic}
                </span>
              )}
              <h4 className="text-sm font-medium text-white line-clamp-1">
                {game.name}
              </h4>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function UpcomingHypeGrid({ games, isLoading }: { games?: Game[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[500px] md:h-[550px]">
        <div className="col-span-2 row-span-1 skeleton rounded-lg" />
        <div className="col-span-1 row-span-1 skeleton rounded-lg" />
        <div className="col-span-1 row-span-1 skeleton rounded-lg" />
        <div className="col-span-2 row-span-1 skeleton rounded-lg" />
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        No upcoming games found
      </div>
    );
  }

  const gridPositions = [
    "col-span-2 row-span-1",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-2 row-span-1",
  ];

  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[500px] md:h-[550px]">
      {games.slice(0, 4).map((game, index) => (
        <div key={game.id} className={gridPositions[index]}>
          <UpcomingHypeCard
            game={game}
            priority={index < 2}
            variant={index === 0 || index === 3 ? "wide" : "square"}
          />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const { profile, isAuthenticated } = useAuth();

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

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () => getTrendingGames(1, 12),
    staleTime: 1000 * 60 * 5,
  });

  const { data: upcomingData, isLoading: upcomingLoading } = useQuery({
    queryKey: ["upcoming"],
    queryFn: () => getUpcomingGames(1, 4),
    staleTime: 1000 * 60 * 5,
  });

  const { data: goatsData, isLoading: goatsLoading } = useQuery({
    queryKey: ["goats"],
    queryFn: () => getAllTimeGreats(),
    staleTime: 1000 * 60 * 10,
  });

  const { data: heroGame, isLoading: heroLoading } = useQuery({
    queryKey: ["todaysPick"],
    queryFn: () => getTodaysPickGame(),
  });

  const todaysPick = heroGame;

  const { data: trailerData } = useQuery({
    queryKey: ["trailer", todaysPick?.id, todaysPick?.name],
    queryFn: async () => {
      if (!todaysPick) return null;

      let youtubeId = await searchYoutubeVideo(todaysPick.name);

      if (!youtubeId && todaysPick.slug && todaysPick.slug !== todaysPick.name.toLowerCase()) {
        const slugAsName = todaysPick.slug.replace(/-/g, ' ');
        youtubeId = await searchYoutubeVideo(slugAsName);
      }

      if (youtubeId) {
        return { type: 'youtube', src: youtubeId };
      }

      const rawgTrailers = await getGameTrailers(todaysPick.id);
      if (rawgTrailers.results.length > 0) {
        return { type: 'rawg', src: rawgTrailers.results[0].data.max };
      }

      return null;
    },
    enabled: !!todaysPick,
  });

  const username = profile?.username;

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 py-3 px-4 md:px-8 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg overflow-hidden">
              <Image
                src="/logo.png"
                alt="GameTale"
                width={36}
                height={36}
                className="object-cover"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-blue-500">GameTale</span>
              {isAuthenticated && username && (
                <p className="text-xs text-zinc-500">
                  welcomes you, <span className="text-zinc-300">{username}</span> 👋
                </p>
              )}
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-auto">
            <Link
              href="/news"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
            >
              <Newspaper className="w-4 h-4" />
              <span>News</span>
            </Link>
            <Link
              href="/deals"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
            >
              <Tag className="w-4 h-4" />
              <span>Deals</span>
            </Link>
            <Link
              href="/price-tracker"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
            >
              <TrendingDown className="w-4 h-4" />
              <span>Prices</span>
            </Link>
          </nav>

          {isAuthenticated && username && (
            <div className="sm:hidden text-right">
              <p className="text-xs text-zinc-500">
                Hi, <span className="text-zinc-300">{username}</span>
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Top 10 Section - Central feature */}
      <div className="px-4 md:px-8 max-w-7xl mx-auto mt-6 mb-8">
        <Top10Card />
      </div>

      <div className="px-4 md:px-8 max-w-7xl mx-auto space-y-10">
        {/* Hero */}
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

        {/* Trending */}
        <section>
          <SectionHeader
            title="Trending This Week"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <GameGrid games={trendingData?.results} isLoading={trendingLoading} />
        </section>

        <SectionDivider />

        {/* Upcoming */}
        <section>
          <SectionHeader
            title="Upcoming Hype"
            icon={<Rocket className="w-5 h-5" />}
          />
          <UpcomingHypeGrid games={upcomingData?.results} isLoading={upcomingLoading} />
        </section>

        <SectionDivider />

        {/* GOATs */}
        <section>
          <SectionHeader
            title="All-Time GOATs"
            icon={<Trophy className="w-5 h-5" />}
          />
          <GOATBentoGrid games={goatsData?.results} isLoading={goatsLoading} />
        </section>
      </div>

      <FloatingDock
        onSearchClick={() => setSearchOpen(true)}
        onGenreClick={() => setGenreOpen(true)}
      />

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <GenreModal isOpen={genreOpen} onClose={() => setGenreOpen(false)} />
    </main>
  );
}

