import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
    '/',
    '/login(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/game/(.*)',
    '/genre/(.*)',
    '/news(.*)',
    '/deals(.*)',
    '/price-tracker(.*)',
    '/top-10/(.*)',
    '/top10/(.*)',
    '/api/(.*)',
    '/robots.txt',
    '/sitemap.xml',
])

export default clerkMiddleware(async (auth, req) => {
    // Protect non-public routes
    if (!isPublicRoute(req)) {
        await auth.protect()
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
