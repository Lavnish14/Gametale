import { NextRequest, NextResponse } from "next/server";

// Server-side only - API key is NOT exposed to client
const RAWG_API_KEY = process.env.RAWG_API_KEY || process.env.NEXT_PUBLIC_RAWG_API_KEY || "";
const BASE_URL = "https://api.rawg.io/api";

// Types
interface Game {
    id: number;
    slug: string;
    name: string;
    released: string;
    background_image: string;
    rating: number;
    ratings_count: number;
    metacritic: number | null;
    playtime: number;
    genres: Array<{ id: number; name: string; slug: string }>;
    platforms: Array<{ platform: { id: number; name: string; slug: string } }>;
    stores: Array<{ store: { id: number; name: string; slug: string } }>;
    tags: Array<{ id: number; name: string; slug: string }>;
    short_screenshots: Array<{ id: number; image: string }>;
    description_raw?: string;
    developers?: Array<{ id: number; name: string; slug: string }>;
    publishers?: Array<{ id: number; name: string; slug: string }>;
    esrb_rating?: { id: number; name: string; slug: string };
    tba?: boolean;
}

interface GamesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Game[];
}

interface Screenshot {
    id: number;
    image: string;
}

interface GameTrailer {
    id: number;
    name: string;
    preview: string;
    data: {
        480: string;
        max: string;
    };
}

/**
 * Fetch from RAWG API with error handling
 */
async function fetchFromRAWG<T>(
    endpoint: string,
    params: Record<string, string> = {}
): Promise<T> {
    const searchParams = new URLSearchParams({
        key: RAWG_API_KEY,
        ...params,
    });

    const response = await fetch(`${BASE_URL}${endpoint}?${searchParams}`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
        throw new Error(`RAWG API error: ${response.status}`);
    }

    return response.json();
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    try {
        switch (action) {
            case "details": {
                const id = searchParams.get("id");
                if (!id) {
                    return NextResponse.json({ error: "id is required" }, { status: 400 });
                }
                const game = await fetchFromRAWG<Game>(`/games/${id}`);
                return NextResponse.json(game);
            }

            case "screenshots": {
                const id = searchParams.get("id");
                if (!id) {
                    return NextResponse.json({ error: "id is required" }, { status: 400 });
                }
                const screenshots = await fetchFromRAWG<{ results: Screenshot[] }>(
                    `/games/${id}/screenshots`
                );
                return NextResponse.json(screenshots);
            }

            case "trailers": {
                const id = searchParams.get("id");
                if (!id) {
                    return NextResponse.json({ error: "id is required" }, { status: 400 });
                }
                const trailers = await fetchFromRAWG<{ results: GameTrailer[] }>(
                    `/games/${id}/movies`
                );
                return NextResponse.json(trailers);
            }

            case "search": {
                const query = searchParams.get("query");
                const page = searchParams.get("page") || "1";
                const pageSize = searchParams.get("pageSize") || "20";

                if (!query) {
                    return NextResponse.json({ error: "query is required" }, { status: 400 });
                }

                const results = await fetchFromRAWG<GamesResponse>("/games", {
                    search: query,
                    page,
                    page_size: pageSize,
                });
                return NextResponse.json(results);
            }

            case "trending": {
                const page = searchParams.get("page") || "1";
                const pageSize = searchParams.get("pageSize") || "12";
                const today = new Date();
                const sixMonthsAgo = new Date(today);
                sixMonthsAgo.setMonth(today.getMonth() - 6);

                const results = await fetchFromRAWG<GamesResponse>("/games", {
                    ordering: "-added,-rating",
                    dates: `${sixMonthsAgo.toISOString().split("T")[0]},${today.toISOString().split("T")[0]}`,
                    page,
                    page_size: String(Number(pageSize) * 5),
                });
                return NextResponse.json(results);
            }

            case "upcoming": {
                const page = searchParams.get("page") || "1";
                const pageSize = searchParams.get("pageSize") || "4";
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                const yearEnd = `${today.getFullYear()}-12-31`;

                const results = await fetchFromRAWG<GamesResponse>("/games", {
                    ordering: "-added",
                    dates: `${tomorrow.toISOString().split("T")[0]},${yearEnd}`,
                    page,
                    page_size: "40",
                });
                return NextResponse.json(results);
            }

            case "goats": {
                // Fetch legendary games (95+)
                const legendary = await fetchFromRAWG<GamesResponse>("/games", {
                    ordering: "-metacritic",
                    metacritic: "95,100",
                    page_size: "30",
                });

                // Fetch elite games (90-94)
                const elite = await fetchFromRAWG<GamesResponse>("/games", {
                    ordering: "-metacritic",
                    metacritic: "90,94",
                    page_size: "50",
                });

                return NextResponse.json({
                    legendary: legendary.results,
                    elite: elite.results,
                });
            }

            case "genre": {
                const genreSlug = searchParams.get("genre");
                const page = searchParams.get("page") || "1";
                const pageSize = searchParams.get("pageSize") || "20";
                const ordering = searchParams.get("ordering") || "-rating";
                const metacritic = searchParams.get("metacritic");
                const year = searchParams.get("year");

                if (!genreSlug) {
                    return NextResponse.json({ error: "genre is required" }, { status: 400 });
                }

                const params: Record<string, string> = {
                    genres: genreSlug,
                    page,
                    page_size: pageSize,
                    ordering,
                };

                if (metacritic) params.metacritic = metacritic;
                if (year) params.dates = `${year}-01-01,${year}-12-31`;

                const results = await fetchFromRAWG<GamesResponse>("/games", params);
                return NextResponse.json(results);
            }

            case "genres": {
                const genres = await fetchFromRAWG<{
                    results: Array<{ id: number; name: string; slug: string }>;
                }>("/genres");
                return NextResponse.json(genres);
            }

            case "platforms": {
                const platforms = await fetchFromRAWG<{
                    results: Array<{ id: number; name: string; slug: string }>;
                }>("/platforms");
                return NextResponse.json(platforms);
            }

            case "todays-pick": {
                const today = new Date();
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);

                const results = await fetchFromRAWG<GamesResponse>("/games", {
                    ordering: "-added,-rating",
                    dates: `${thirtyDaysAgo.toISOString().split("T")[0]},${today.toISOString().split("T")[0]}`,
                    page_size: "50",
                });
                return NextResponse.json(results);
            }

            default:
                return NextResponse.json(
                    { error: "Invalid action. Valid actions: details, screenshots, trailers, search, trending, upcoming, goats, genre, genres, platforms, todays-pick" },
                    { status: 400 }
                );
        }
    } catch (error) {
        return NextResponse.json(
            { error: "RAWG API error", details: String(error) },
            { status: 500 }
        );
    }
}
