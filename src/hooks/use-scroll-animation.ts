"use client";

import { useEffect, useRef, useState, RefObject } from "react";

interface UseScrollAnimationOptions {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
}

interface UseScrollAnimationReturn<T extends HTMLElement> {
    ref: RefObject<T | null>;
    isInView: boolean;
    hasAnimated: boolean;
}

/**
 * Hook for scroll-triggered animations using IntersectionObserver
 * @param options - Configuration options
 * @returns ref to attach to element, isInView state, and hasAnimated state
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
    options: UseScrollAnimationOptions = {}
): UseScrollAnimationReturn<T> {
    const { threshold = 0.1, rootMargin = "0px", triggerOnce = true } = options;

    const ref = useRef<T>(null);
    const [isInView, setIsInView] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Skip if already animated and triggerOnce is true
        if (triggerOnce && hasAnimated) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const inView = entry.isIntersecting;
                setIsInView(inView);

                if (inView && !hasAnimated) {
                    setHasAnimated(true);
                }

                // Disconnect if triggerOnce and element is in view
                if (triggerOnce && inView) {
                    observer.disconnect();
                }
            },
            {
                threshold,
                rootMargin,
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [threshold, rootMargin, triggerOnce, hasAnimated]);

    return { ref, isInView, hasAnimated };
}

/**
 * Hook for parallax scroll effect
 * @param speed - Parallax speed multiplier (0.5 = half speed, default)
 * @returns ref and current transform value
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(
    speed: number = 0.5
): { ref: RefObject<T | null>; offset: number } {
    const ref = useRef<T>(null);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!ref.current) return;

            const rect = ref.current.getBoundingClientRect();
            const scrollProgress = -rect.top * speed;
            setOffset(scrollProgress);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial calculation

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [speed]);

    return { ref, offset };
}

