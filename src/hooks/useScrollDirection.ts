// src/hooks/useScrollDirection.ts

import { useState, useEffect, useRef } from "react";

type ScrollDirection = "up" | "down";

interface UseScrollDirectionOptions {
  threshold?: number;
  initialDirection?: ScrollDirection;
  scrollContainerSelector?: string;
  topOffset?: number; // 새로 추가
}

export const useScrollDirection = (
  options: UseScrollDirectionOptions = {}
): ScrollDirection => {
  const {
    threshold = 50, // 10 → 50으로 증가 (민감도 개선)
    initialDirection = "up",
    scrollContainerSelector,
    topOffset = 100, // 상단 100px 영역
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

    // 스크롤 위치 가져오기 (호환성 개선)
    const getScrollY = () => {
      if (scrollContainer === window) {
        // ✅ iOS Safari 호환성: scrollY와 pageYOffset 모두 지원
        return (
          window.scrollY ||
          window.pageYOffset ||
          document.documentElement.scrollTop
        );
      } else {
        return (scrollContainer as HTMLElement).scrollTop;
      }
    };

    // 초기 스크롤 위치 설정
    prevScrollY.current = getScrollY();

    const updateScrollDirection = () => {
      const scrollY = getScrollY();

      // ✅ iOS 주소창 변화로 인한 음수 값 방지
      if (scrollY < 0) {
        blocking.current = false;
        return;
      }

      // ✅ 최상단 근처에서는 항상 "up" 상태 유지
      if (scrollY <= topOffset) {
        if (scrollDirection !== "up") {
          setScrollDirection("up");
        }
        prevScrollY.current = scrollY;
        blocking.current = false;
        return;
      }

      // 스크롤 차이 계산
      const scrollDiff = scrollY - prevScrollY.current;
      const absScrollDiff = Math.abs(scrollDiff);

      // ✅ threshold 이상 스크롤되었을 때만 방향 업데이트
      if (absScrollDiff >= threshold) {
        const newScrollDirection: ScrollDirection =
          scrollDiff > 0 ? "down" : "up";

        // ✅ 실제로 방향이 변경될 때만 상태 업데이트 (불필요한 리렌더링 방지)
        if (newScrollDirection !== scrollDirection) {
          setScrollDirection(newScrollDirection);
        }

        prevScrollY.current = scrollY;
      }

      blocking.current = false;
    };

    const onScroll = () => {
      if (!blocking.current) {
        blocking.current = true;
        // ✅ requestAnimationFrame으로 성능 최적화
        window.requestAnimationFrame(updateScrollDirection);
      }
    };

    // ✅ passive: true로 스크롤 성능 개선
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", onScroll);
    };
  }, [threshold, scrollContainerSelector, topOffset, scrollDirection]);

  return scrollDirection;
};
