'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export type QualityLabel = 'too_dark' | 'too_bright' | 'blurry' | 'poor' | 'ok' | 'good' | 'excellent';

export interface ImageQuality {
  score: number;       // 0–1
  label: QualityLabel;
  brightness: number;  // 0–255
  sharpness: number;   // Laplacian variance
}

const SAMPLE_W = 160;
const SAMPLE_H = 120;
const INTERVAL = 500; // ms between checks

function analyzeFrame(video: HTMLVideoElement): ImageQuality | null {
  if (video.readyState < 2 || video.videoWidth === 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width  = SAMPLE_W;
  canvas.height = SAMPLE_H;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0, SAMPLE_W, SAMPLE_H);
  const { data } = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);

  // ── Brightness (mean luminance) ──────────────────────────────────────────
  let lumaSum = 0;
  const n = SAMPLE_W * SAMPLE_H;
  for (let i = 0; i < n; i++) {
    const base = i * 4;
    lumaSum += 0.299 * data[base] + 0.587 * data[base + 1] + 0.114 * data[base + 2];
  }
  const brightness = lumaSum / n;

  // ── Sharpness (Laplacian variance on grayscale) ──────────────────────────
  const gray = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const b = i * 4;
    gray[i] = 0.299 * data[b] + 0.587 * data[b + 1] + 0.114 * data[b + 2];
  }

  let lapSum = 0;
  let lapSumSq = 0;
  let count = 0;
  for (let y = 1; y < SAMPLE_H - 1; y++) {
    for (let x = 1; x < SAMPLE_W - 1; x++) {
      const idx = y * SAMPLE_W + x;
      const lap =
        -4 * gray[idx] +
        gray[idx - 1] +
        gray[idx + 1] +
        gray[idx - SAMPLE_W] +
        gray[idx + SAMPLE_W];
      lapSum   += lap;
      lapSumSq += lap * lap;
      count++;
    }
  }
  const lapMean = lapSum / count;
  const sharpness = lapSumSq / count - lapMean * lapMean; // variance

  // ── Score + label ────────────────────────────────────────────────────────
  let label: QualityLabel;
  let score: number;

  if (brightness < 35) {
    label = 'too_dark';
    score = brightness / 35 * 0.2;
  } else if (brightness > 220) {
    label = 'too_bright';
    score = (255 - brightness) / 35 * 0.2;
  } else {
    // Brightness OK — judge by sharpness
    // Typical sharp scene: variance > 150; blurry: < 30
    const sharpScore = Math.min(sharpness / 200, 1);
    const brightPenalty = Math.abs(brightness - 128) / 128; // 0 = perfect, 1 = edge
    score = sharpScore * (1 - brightPenalty * 0.3);

    if (sharpness < 20)       { label = 'blurry';    }
    else if (score < 0.25)    { label = 'poor';      }
    else if (score < 0.45)    { label = 'ok';        }
    else if (score < 0.70)    { label = 'good';      }
    else                      { label = 'excellent'; }
  }

  return { score: Math.max(0, Math.min(1, score)), label, brightness, sharpness };
}

export function useImageQuality(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [quality, setQuality] = useState<ImageQuality | null>(null);
  const rafRef    = useRef<number>(0);
  const lastRef   = useRef(0);
  const activeRef = useRef(false);

  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;

    function loop(time: number) {
      if (!activeRef.current) return;
      if (time - lastRef.current >= INTERVAL) {
        lastRef.current = time;
        const video = videoRef.current;
        if (video) {
          const result = analyzeFrame(video);
          if (result) setQuality(result);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [videoRef]);

  const stop = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setQuality(null);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { quality, start, stop };
}
