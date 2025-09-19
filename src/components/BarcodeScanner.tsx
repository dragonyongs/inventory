// src/components/BarcodeScanner.tsx
import { useEffect, useRef, useState } from "react";

type Props = { onDetect: (value: string) => void; onClose: () => void };

export function BarcodeScanner({ onDetect, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const detectorRef = useRef<any>(null);
  const rafRef = useRef<number>();
  const closedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  async function cleanup() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
      } catch {}
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
        v.playsInline = true;
        v.srcObject = stream;

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
      cleanup();
    };
  }, [onDetect, onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 grid place-items-center">
      <div className="bg-white rounded p-2 w-[90vw] max-w-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">바코드 스캔</div>
          <button
            className="border px-2 py-1"
            onClick={async () => {
              closedRef.current = true;
              await cleanup();
              onClose();
            }}
          >
            닫기
          </button>
        </div>
        {error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <video ref={videoRef} className="w-full rounded" playsInline muted />
        )}
      </div>
    </div>
  );
}
