'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export interface Detection {
  classId: number;
  className: string;
  confidence: number;
  // All normalized 0–1 relative to input image
  x: number;   // top-left x
  y: number;   // top-left y
  w: number;   // width
  h: number;   // height
}

type DetectorState = 'idle' | 'loading' | 'ready' | 'error';

const MODEL_URL = '/models/detector/age-scout-detector.onnx';
const META_URL  = '/models/detector/metadata.json';
const INPUT_SIZE = 640;

interface ModelMeta {
  classes: string[];
  conf_threshold: number;
  iou_threshold: number;
  note?: string;
}

// COCO classes that plausibly appear near AGE equipment → mapped to AGE label
const COCO_TO_AGE: Record<string, string> = {
  airplane:     'unknown_age_part',
  truck:        'generator',
  bus:          'compressor',
  car:          'tow_bar',
  motorcycle:   'tow_bar',
  train:        'unknown_age_part',
  boat:         'unknown_age_part',
  suitcase:     'unknown_age_part',
  backpack:     'unknown_age_part',
};

function remapClassName(raw: string): string | null {
  // If the model is AGE-specific (fine-tuned), pass through unchanged
  if (raw.includes('compressor') || raw.includes('generator') || raw.includes('tow_bar')) {
    return raw;
  }
  return COCO_TO_AGE[raw] ?? null; // null = filter out irrelevant COCO classes
}

// ---------------------------------------------------------------------------
// YOLOv8 output post-processing
// Raw ONNX output shape: [1, num_classes+4, 8400]
// Each of the 8400 anchor predictions contains: [cx, cy, w, h, ...class_scores]
// ---------------------------------------------------------------------------
function parseYoloOutput(
  raw: Float32Array,
  numClasses: number,
  confThresh: number,
  iouThresh: number,
): Detection[] {
  const numAnchors = 8400;
  const numFields  = numClasses + 4;

  // Transpose from [numFields, numAnchors] to [numAnchors, numFields]
  const transposed: number[][] = [];
  for (let a = 0; a < numAnchors; a++) {
    const row: number[] = [];
    for (let f = 0; f < numFields; f++) {
      row.push(raw[f * numAnchors + a]);
    }
    transposed.push(row);
  }

  // Extract detections above threshold
  const raw_dets: Detection[] = [];
  for (const row of transposed) {
    const cx = row[0] / INPUT_SIZE;
    const cy = row[1] / INPUT_SIZE;
    const w  = row[2] / INPUT_SIZE;
    const h  = row[3] / INPUT_SIZE;

    const scores = row.slice(4);
    const maxScore = Math.max(...scores);
    if (maxScore < confThresh) continue;

    const classId = scores.indexOf(maxScore);
    raw_dets.push({
      classId,
      className: '',      // filled in after NMS
      confidence: maxScore,
      x: cx - w / 2,
      y: cy - h / 2,
      w,
      h,
    });
  }

  return nms(raw_dets, iouThresh);
}

function iou(a: Detection, b: Detection): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  if (inter === 0) return 0;
  const union = a.w * a.h + b.w * b.h - inter;
  return inter / union;
}

function nms(dets: Detection[], iouThresh: number): Detection[] {
  const sorted = [...dets].sort((a, b) => b.confidence - a.confidence);
  const kept: Detection[] = [];
  const suppressed = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (suppressed.has(i)) continue;
    kept.push(sorted[i]);
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[i].classId === sorted[j].classId && iou(sorted[i], sorted[j]) > iouThresh) {
        suppressed.add(j);
      }
    }
  }
  return kept;
}

// ---------------------------------------------------------------------------
// Preprocess: resize video frame to 640×640, return Float32Array in CHW order
// Reuse a single canvas and tensor buffer to avoid per-frame GPU allocations.
// ---------------------------------------------------------------------------
let _prepCanvas: HTMLCanvasElement | null = null;
let _prepCtx: CanvasRenderingContext2D | null = null;
let _prepTensor: Float32Array | null = null;

function preprocessFrame(video: HTMLVideoElement): Float32Array {
  if (!_prepCanvas) {
    _prepCanvas = document.createElement('canvas');
    _prepCanvas.width  = INPUT_SIZE;
    _prepCanvas.height = INPUT_SIZE;
    _prepCtx = _prepCanvas.getContext('2d')!;
    _prepTensor = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
  }
  _prepCtx!.drawImage(video, 0, 0, INPUT_SIZE, INPUT_SIZE);
  const { data } = _prepCtx!.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const tensor = _prepTensor!;

  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
    tensor[i]                           = data[i * 4]     / 255;  // R
    tensor[INPUT_SIZE * INPUT_SIZE + i] = data[i * 4 + 1] / 255;  // G
    tensor[2 * INPUT_SIZE * INPUT_SIZE + i] = data[i * 4 + 2] / 255; // B
  }
  return tensor;
}

// Cached ort module — imported once, reused every frame
let _ort: typeof import('onnxruntime-web') | null = null;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useDetector(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const sessionRef   = useRef<import('onnxruntime-web').InferenceSession | null>(null);
  const metaRef      = useRef<ModelMeta | null>(null);
  const rafRef       = useRef<number>(0);
  const runningRef   = useRef(false);

  const inferringRef  = useRef(false); // guard against concurrent inference

  const [state, setState]         = useState<DetectorState>('idle');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [fps, setFps]             = useState(0);
  const fpsCounterRef             = useRef({ count: 0, last: Date.now() });

  // ── Load model ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (sessionRef.current) return;
    setState('loading');
    try {
      if (!_ort) _ort = await import('onnxruntime-web');
      const ort = _ort;

      ort.env.wasm.wasmPaths = '/';
      const session = await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      sessionRef.current = session;

      const metaResp = await fetch(META_URL);
      metaRef.current = await metaResp.json();

      setState('ready');
    } catch (e) {
      console.warn('Detector model not found — running without detection overlay', e);
      setState('error');
    }
  }, []);

  // ── Single inference pass ────────────────────────────────────────────────
  const runFrame = useCallback(async () => {
    // Drop frame if previous inference hasn't finished — prevents GPU overload
    if (inferringRef.current) return;
    const session = sessionRef.current;
    const meta    = metaRef.current;
    const video   = videoRef.current;
    if (!session || !meta || !video || video.readyState < 2) return;

    inferringRef.current = true;
    try {
      const ort = _ort!;
      // Copy tensor data before inference so the shared buffer can be reused next frame
      const rawTensor = preprocessFrame(video);
      const tensorCopy = new Float32Array(rawTensor);
      const input  = new ort.Tensor('float32', tensorCopy, [1, 3, INPUT_SIZE, INPUT_SIZE]);

      const results = await session.run({ images: input });
      const output = results['output0'];
      const rawData  = output.data as Float32Array;

      const dets = parseYoloOutput(
        rawData,
        meta.classes.length,
        meta.conf_threshold,
        meta.iou_threshold,
      )
        .map(d => {
          const rawName = meta.classes[d.classId] ?? 'unknown';
          const mapped  = remapClassName(rawName);
          return mapped ? { ...d, className: mapped } : null;
        })
        .filter((d): d is NonNullable<typeof d> => d !== null);

      // Dispose output tensor to free GPU memory
      if (typeof (output as unknown as { dispose?: () => void }).dispose === 'function') {
        (output as unknown as { dispose: () => void }).dispose();
      }

      setDetections(dets);

      // FPS counter
      fpsCounterRef.current.count++;
      const now = Date.now();
      const elapsed = now - fpsCounterRef.current.last;
      if (elapsed >= 1000) {
        setFps(Math.round(fpsCounterRef.current.count * 1000 / elapsed));
        fpsCounterRef.current = { count: 0, last: now };
      }
    } catch {
      // silently skip dropped frames
    } finally {
      inferringRef.current = false;
    }
  }, [videoRef]);

  // ── Detection loop ────────────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    let lastTime = 0;
    const TARGET_INTERVAL = 80; // ~12fps for inference (30fps video still flows)

    function loop(time: number) {
      if (!runningRef.current) return;
      if (time - lastTime >= TARGET_INTERVAL) {
        lastTime = time;
        runFrame();
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [runFrame]);

  const stopLoop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setDetections([]);
  }, []);

  // ── Capture best detection crop ──────────────────────────────────────────
  const captureCrop = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || detections.length === 0) return null;

    const best = detections[0]; // already sorted by confidence
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // Add 10% padding around the detection
    const pad = 0.1;
    const x = Math.max(0, (best.x - pad * best.w) * vw);
    const y = Math.max(0, (best.y - pad * best.h) * vh);
    const w = Math.min(vw - x, (best.w + 2 * pad * best.w) * vw);
    const h = Math.min(vh - y, (best.h + 2 * pad * best.h) * vh);

    const canvas = document.createElement('canvas');
    canvas.width  = Math.round(w);
    canvas.height = Math.round(h);
    canvas.getContext('2d')!.drawImage(video, x, y, w, h, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
  }, [videoRef, detections]);

  // Cleanup on unmount
  useEffect(() => () => stopLoop(), [stopLoop]);

  return { state, detections, fps, load, startLoop, stopLoop, captureCrop };
}
