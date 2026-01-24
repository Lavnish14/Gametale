// Re-export types from lib files for convenience
export type { Game, Genre, Platform, GamesResponse, Screenshot } from "@/lib/rawg";
export type { Profile, WishlistItem, Comment, Review } from "@/lib/supabase";

// Component prop types
export interface GameCardProps {
    game: {
        id: number;
        name: string;
        background_image: string;
        rating: number;
        metacritic: number | null;
        genres: { id: number; name: string }[];
        released: string;
    };
    isWishlisted?: boolean;
    onWishlistToggle?: () => void;
}

export interface SearchResult {
    id: number;
    name: string;
    background_image: string;
    rating: number;
}

export interface FilterState {
    genre: string;
    ordering: string;
    metacritic: string;
    year: string;
}

