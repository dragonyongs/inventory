// src/hooks/useScrollDirection.ts

import { useState, useEffect, useRef } from "react";

type ScrollDirection = "up" | "down";

interface UseScrollDirectionOptions {
  threshold?: number;
  initialDirection?: ScrollDirection;
}

export const useScrollDirection = (
  options: UseScrollDirectionOptions = {}
): ScrollDirection => {
  const { threshold = 10, initialDirection = "up" } = options;
  const [scrollDirection, setScrollDirection] =
    useState<ScrollDirection>(initialDirection);
  const blocking = useRef(false);
  const prevScrollY = useRef(0);

  useEffect(() => {
    prevScrollY.current = window.scrollY;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;

      // 최소 임계값 이상 스크롤되었을 때만 방향 업데이트
      if (Math.abs(scrollY - prevScrollY.current) >= threshold) {
        const newScrollDirection: ScrollDirection =
          scrollY > prevScrollY.current ? "down" : "up";

        setScrollDirection(newScrollDirection);
        prevScrollY.current = scrollY > 0 ? scrollY : 0;
      }

      blocking.current = false;
    };

    const onScroll = () => {
      if (!blocking.current) {
        blocking.current = true;
        window.requestAnimationFrame(updateScrollDirection);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrollDirection;
};
