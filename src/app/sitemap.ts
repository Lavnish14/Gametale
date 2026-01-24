import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://gametale.games'

    // Static pages
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/wishlist`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        },
    ]

    // Popular genre pages
    const genres = [
        'action',
        'adventure',
        'role-playing-games-rpg',
        'strategy',
        'shooter',
        'puzzle',
        'racing',
        'sports',
        'indie',
        'simulation',
    ]

    const genrePages = genres.map((genre) => ({
        url: `${baseUrl}/genre/${genre}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    return [...staticPages, ...genrePages]
}
