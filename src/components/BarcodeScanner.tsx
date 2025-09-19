// src/components/BarcodeScanner.tsx
import { useEffect, useRef, useState } from "react";

type Props = { onDetect: (value: string) => void; onClose: () => void };

export function BarcodeScanner({ onDetect, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const rafRef = useRef<number | null>(null);
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
        // BarcodeDetector 지원 확인
        if (!window.BarcodeDetector) {
          setError("BarcodeDetector를 지원하지 않는 환경입니다.");
          return;
        }

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
        v.srcObject = stream;
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
          const raw = codes[0].rawValue;
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
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-black text-white">
        <h2 className="text-lg font-semibold">바코드 스캔</h2>
        <button
          onClick={async () => {
            closedRef.current = true;
            await cleanup();
            onClose();
          }}
          className="px-4 py-2 bg-gray-600 rounded"
        >
          닫기
        </button>
      </div>

      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
      </div>

      {error ? (
        <div className="p-4 bg-red-500 text-white text-center">{error}</div>
      ) : null}
    </div>
  );
}
