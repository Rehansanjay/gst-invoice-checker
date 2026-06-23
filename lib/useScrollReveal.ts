'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook that triggers scroll-reveal animations using IntersectionObserver.
 * 
 * Usage:
 *   const containerRef = useScrollReveal();
 *   <div ref={containerRef}> ... elements with className="scroll-reveal" ... </div>
 * 
 * Elements with class "scroll-reveal" will get "revealed" class added when 
 * they enter the viewport (15% visible threshold).
 * Elements already in viewport on mount are revealed immediately.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setupObserver = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const elements = container.querySelectorAll('.scroll-reveal');
    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '0px 0px 150px 0px',
      }
    );

    elements.forEach((el) => observerRef.current!.observe(el));
  }, []);

  useEffect(() => {
    // Small delay to ensure DOM is painted before observing
    const timer = requestAnimationFrame(() => {
      setupObserver();
    });

    return () => {
      cancelAnimationFrame(timer);
      observerRef.current?.disconnect();
    };
  }, [setupObserver]);

  return containerRef;
}
