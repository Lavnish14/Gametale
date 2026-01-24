/**
 * Affiliate Links Configuration
 *
 * Replace the placeholder URLs with your actual affiliate links.
 * Sign up for affiliate programs at:
 * - Humble Bundle: humblebundle.com/partner
 * - Green Man Gaming: greenmangaming.com/affiliates
 * - Fanatical: fanatical.com/en/affiliates
 * - GOG: gog.com/partner
 *
 * For stores without affiliate programs (Steam, Epic, PlayStation, Xbox),
 * the links will go directly to the store.
 */

export interface StoreAffiliateConfig {
    name: string;
    affiliateUrl: string | null; // null means no affiliate program, use direct link
    searchUrl: string; // URL pattern to search for a game
    hasAffiliate: boolean;
}

// Store configurations with affiliate links
// Replace "YOUR_AFFILIATE_ID" with your actual affiliate IDs
export const STORE_AFFILIATE_CONFIG: Record<string, StoreAffiliateConfig> = {
    // Stores WITH affiliate programs
    "gog": {
        name: "GOG",
        affiliateUrl: null, // Add your GOG affiliate URL pattern here
        searchUrl: "https://www.gog.com/games?search=",
        hasAffiliate: true, // Set to true once you have affiliate link
    },
    "humble-store": {
        name: "Humble Store",
        affiliateUrl: null, // Add: https://www.humblebundle.com/store/search?search=GAME&partner=YOUR_ID
        searchUrl: "https://www.humblebundle.com/store/search?search=",
        hasAffiliate: true,
    },

    // Stores WITHOUT affiliate programs (direct links)
    "steam": {
        name: "Steam",
        affiliateUrl: null,
        searchUrl: "https://store.steampowered.com/search/?term=",
        hasAffiliate: false,
    },
    "playstation-store": {
        name: "PlayStation Store",
        affiliateUrl: null,
        searchUrl: "https://store.playstation.com/search/",
        hasAffiliate: false,
    },
    "xbox-store": {
        name: "Xbox Store",
        affiliateUrl: null,
        searchUrl: "https://www.xbox.com/games/search?q=",
        hasAffiliate: false,
    },
    "xbox360": {
        name: "Xbox 360",
        affiliateUrl: null,
        searchUrl: "https://www.xbox.com/games/search?q=",
        hasAffiliate: false,
    },
    "nintendo": {
        name: "Nintendo Store",
        affiliateUrl: null,
        searchUrl: "https://www.nintendo.com/search/#q=",
        hasAffiliate: false,
    },
    "epic-games": {
        name: "Epic Games",
        affiliateUrl: null,
        searchUrl: "https://store.epicgames.com/browse?q=",
        hasAffiliate: false,
    },
    "itch": {
        name: "itch.io",
        affiliateUrl: null,
        searchUrl: "https://itch.io/search?q=",
        hasAffiliate: false,
    },
    "google-play": {
        name: "Google Play",
        affiliateUrl: null,
        searchUrl: "https://play.google.com/store/search?q=",
        hasAffiliate: false,
    },
    "apple-appstore": {
        name: "App Store",
        affiliateUrl: null,
        searchUrl: "https://apps.apple.com/search?term=",
        hasAffiliate: false,
    },
};

/**
 * Get the buy link for a specific store and game
 * @param storeSlug - The store's slug (e.g., "steam", "gog")
 * @param gameName - The name of the game to search for
 * @returns The URL to buy/find the game
 */
export function getStoreLink(storeSlug: string, gameName: string): string {
    const config = STORE_AFFILIATE_CONFIG[storeSlug];

    if (!config) {
        // Fallback to Google search if store not configured
        return `https://www.google.com/search?q=${encodeURIComponent(gameName + " buy")}`;
    }

    // If affiliate URL is set, use it
    if (config.affiliateUrl) {
        return config.affiliateUrl.replace("{GAME}", encodeURIComponent(gameName));
    }

    // Otherwise use the search URL
    return config.searchUrl + encodeURIComponent(gameName);
}

/**
 * Check if a store has an affiliate program
 */
export function hasAffiliateProgram(storeSlug: string): boolean {
    return STORE_AFFILIATE_CONFIG[storeSlug]?.hasAffiliate ?? false;
}

