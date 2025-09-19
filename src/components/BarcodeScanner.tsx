// src/components/BarcodeScanner.tsx
import { useEffect, useRef, useState } from "react";

type Props = { onDetect: (value: string) => void; onClose: () => void };

export function BarcodeScanner({ onDetect, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  // BarcodeDetector를 타입 안전하게 다룰 수 없으면 any로 둡니다(브라우저 전역)
  const detectorRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null); // FIX: 초기값 필수
  const closedRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  async function cleanup() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
      } catch {}
      // @ts-expect-error: HTMLVideoElement.srcObject 존재
      v.srcObject = null;
      await Promise.resolve();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    let mounted = true;
    async function start() {
      try {
        if (!("BarcodeDetector" in window)) {
          setError("BarcodeDetector를 지원하지 않는 환경입니다.");
          return;
        }
        // @ts-ignore
        detectorRef.current = new window.BarcodeDetector({
          formats: ["ean_13", "code_128", "qr_code"],
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const v = videoRef.current!;
        v.muted = true;
        // @ts-expect-error: HTMLVideoElement.srcObject 존재
        v.srcObject = stream;
        // playsInline은 iOS 사파리 속성
        // @ts-ignore
        v.playsInline = true;

        const playPromise = v.play();
        if (playPromise !== undefined) {
          try {
            await playPromise;
          } catch (e) {
            if (!closedRef.current)
              setError((e as Error)?.message ?? "카메라 재생에 실패했습니다.");
            return;
          }
        }
        loop();
      } catch (e: any) {
        setError(e?.message ?? "카메라를 시작하는 중 오류가 발생했습니다.");
      }
    }

    async function loop() {
      if (!videoRef.current || !detectorRef.current || closedRef.current)
        return;
      try {
        const codes = await detectorRef.current.detect(videoRef.current);
        if (codes?.length) {
          const raw = codes[0].rawValue as string;
          closedRef.current = true;
          await cleanup();
          onDetect(raw);
          onClose();
          return;
        }
      } catch {}
      rafRef.current = requestAnimationFrame(loop);
    }

    start();
    return () => {
      mounted = false;
      closedRef.current = true;
      void cleanup();
    };
  }, [onDetect, onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 w-[min(640px,92vw)]">
        <h2 className="text-lg font-semibold mb-3">바코드 스캔</h2>
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black rounded"
        />
        <div className="mt-3 flex gap-2 justify-end">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={async () => {
              closedRef.current = true;
              await cleanup();
              onClose();
            }}
          >
            닫기
          </button>
        </div>
        {error ? <p className="mt-2 text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
