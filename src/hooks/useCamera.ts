'use client';

import { useRef, useState, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const start = useCallback(async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError(true);
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchOn(false);
  }, []);

  const toggleTorch = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      if (caps.torch) {
        const next = !torchOn;
        track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
        setTorchOn(next);
      }
    } catch { /* torch not supported */ }
  }, [torchOn]);

  const capture = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
  }, []);

  return { videoRef, torchOn, cameraError, start, stop, toggleTorch, capture };
}
