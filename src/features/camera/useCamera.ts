// src/features/camera/useCamera.ts
export async function requestCamera(
  constraints: MediaStreamConstraints = { video: true }
) {
  if (!("mediaDevices" in navigator))
    throw new Error("Media devices not supported in this context");
  // HTTPS or localhost required
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  return stream;
}
