// src/hooks/useScrollDirection.ts

import { useState, useEffect, useRef } from "react";

type ScrollDirection = "up" | "down";

interface UseScrollDirectionOptions {
  threshold?: number;
  initialDirection?: ScrollDirection;
  scrollContainerSelector?: string; // 스크롤 컨테이너 선택자 추가
}

export const useScrollDirection = (
  options: UseScrollDirectionOptions = {}
): ScrollDirection => {
  const {
    threshold = 10,
    initialDirection = "up",
    scrollContainerSelector,
  } = options;

  const [scrollDirection, setScrollDirection] =
    useState<ScrollDirection>(initialDirection);
  const blocking = useRef(false);
  const prevScrollY = useRef(0);

  useEffect(() => {
    // 스크롤 컨테이너 찾기
    const scrollContainer = scrollContainerSelector
      ? document.querySelector(scrollContainerSelector)
      : window;

    if (!scrollContainer) {
      console.warn(
        `스크롤 컨테이너를 찾을 수 없습니다: ${scrollContainerSelector}`
      );
      return;
    }

    // 초기 스크롤 위치 설정
    const getScrollY = () => {
      if (scrollContainer === window) {
        return window.scrollY;
      } else {
        return (scrollContainer as HTMLElement).scrollTop;
      }
    };

    prevScrollY.current = getScrollY();

    const updateScrollDirection = () => {
      const scrollY = getScrollY();

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

    // passive: true로 성능 최적화
    scrollContainer.addEventListener("scroll", onScroll, {
      passive: true,
    } as any);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => scrollContainer.removeEventListener("scroll", onScroll);
  }, [threshold, scrollContainerSelector]);

  return scrollDirection;
};
