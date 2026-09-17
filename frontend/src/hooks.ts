import { useEffect, useRef, useState } from 'react';

/**
 * Reusable hook to invoke a callback when the Escape key is pressed.
 * Only triggers when the modal or drawer is active (isOpen is true).
 */
export function useEscapeKey(callback: () => void, isOpen: boolean = true) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callback, isOpen]);
}

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Reusable hook for scroll-triggered reveal animations.
 */
export function useScrollReveal({
  threshold = 0.08,
  rootMargin = '0px 0px -40px 0px',
  triggerOnce = false,
}: UseScrollRevealOptions = {}) {
  const [isRevealed, setIsRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          if (triggerOnce) {
            observer.unobserve(el);
          }
        } else if (!triggerOnce) {
          const viewportTop = entry.rootBounds ? entry.rootBounds.top : 0;
          const isAboveViewport = entry.boundingClientRect.bottom <= viewportTop + 30;

          if (!isAboveViewport) {
            setIsRevealed(false);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isRevealed };
}
