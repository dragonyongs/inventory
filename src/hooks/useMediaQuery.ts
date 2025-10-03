// src/hooks/useMediaQuery.ts
import { useState, useEffect } from "react";

// ✅ 최적화된 useIsMobile (matchMedia 사용)
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // matchMedia를 사용하여 더 효율적으로 감지
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // 초기값 설정
    setIsMobile(window.innerWidth < breakpoint);

    // change 이벤트 리스너 (resize보다 효율적)
    mql.addEventListener("change", onChange);

    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, [breakpoint]);

  return !!isMobile;
};

// 기존 useMediaQuery도 유지
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
};

// 반응형 체크 유틸리티들
export const useIsTablet = (): boolean => {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
};

export const useIsDesktop = (): boolean => {
  return useMediaQuery("(min-width: 1024px)");
};

// ✅ 디바이스 타입 반환 (한 번에 여러 조건 체크 시 유용)
export const useDeviceType = (): "mobile" | "tablet" | "desktop" => {
  const isMobile = useIsMobile(768);
  const isTablet = useIsTablet();

  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  return "desktop";
};
