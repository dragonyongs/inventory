// src/hooks/useRelativeTime.ts

import { useEffect, useState } from "react";

export function useRelativeTime(timestamp: string) {
  const [relativeTime, setRelativeTime] = useState("");
  const [absoluteTime, setAbsoluteTime] = useState("");
  const [isWithin24Hours, setIsWithin24Hours] = useState(true);

  useEffect(() => {
    function updateTime() {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const seconds = Math.floor(diff / 1000);
      const hours = Math.floor(seconds / 3600);
      const days = Math.floor(seconds / 86400);

      // 24시간 이내인지 체크
      const within24Hours = hours < 24;
      setIsWithin24Hours(within24Hours);

      // 상대 시간 계산
      let relative = "";
      if (seconds < 60) relative = "방금 전";
      else if (seconds < 3600) relative = `${Math.floor(seconds / 60)}분 전`;
      else if (hours < 24) relative = `${hours}시간 전`;
      else relative = `${days}일 전`;

      // 절대 시간 포맷 (24시간 이후 표시용)
      const absolute = date.toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      setRelativeTime(relative);
      setAbsoluteTime(absolute);
    }

    updateTime();
    const interval = setInterval(updateTime, 60000); // 1분마다 갱신
    return () => clearInterval(interval);
  }, [timestamp]);

  return { relativeTime, absoluteTime, isWithin24Hours };
}
