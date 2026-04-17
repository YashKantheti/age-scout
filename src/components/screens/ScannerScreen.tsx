'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Msi } from '../Msi';
import { useAppStore } from '@/store/appStore';
import { useCamera } from '@/hooks/useCamera';
import { useDetector } from '@/hooks/useDetector';
import { useImageQuality } from '@/hooks/useImageQuality';
import type { QualityLabel } from '@/hooks/useImageQuality';
import type { Part, EquipmentOption } from '@/types';

type ScanState = 'idle' | 'loading' | 'result' | 'error';

// Color per detection class
const CLASS_COLORS: Record<string, string> = {
  compressor:           '#22d3ee',
  generator:            '#a78bfa',
  tow_bar:              '#34d399',
  hydraulic_equipment:  '#fb923c',
  fuel_servicing:       '#f472b6',
  lighting_equipment:   '#facc15',
  munitions_equipment:  '#f87171',
  part_label:           '#4ade80',
  unknown_age_part:     '#94a3b8',
};

const CLASS_LABELS: Record<string, string> = {
  compressor:           'Compressor',
  generator:            'Generator',
  tow_bar:              'Tow Bar',
  hydraulic_equipment:  'Hydraulic Equip',
  fuel_servicing:       'Fuel Servicing',
  lighting_equipment:   'Lighting',
  munitions_equipment:  'Munitions Equip',
  part_label:           'Part Label',
  unknown_age_part:     'AGE Part',
};

const QUALITY_CONFIG: Record<QualityLabel, { color: string; bar: string; text: string; icon: string }> = {
  too_dark:  { color: 'text-red-400',    bar: 'bg-red-400',    text: 'Too Dark',   icon: 'brightness_low' },
  too_bright:{ color: 'text-yellow-400', bar: 'bg-yellow-400', text: 'Too Bright', icon: 'brightness_high' },
  blurry:    { color: 'text-red-400',    bar: 'bg-red-400',    text: 'Blurry',     icon: 'blur_on' },
  poor:      { color: 'text-orange-400', bar: 'bg-orange-400', text: 'Poor',       icon: 'warning' },
  ok:        { color: 'text-yellow-400', bar: 'bg-yellow-400', text: 'OK',         icon: 'radio_button_checked' },
  good:      { color: 'text-green-400',  bar: 'bg-green-400',  text: 'Good',       icon: 'check_circle' },
  excellent: { color: 'text-green-400',  bar: 'bg-green-400',  text: 'Excellent',  icon: 'verified' },
};

interface Props {
  onToast: (msg: string) => void;
}

export function ScannerScreen({ onToast }: Props) {
  const { navigate, apiKey, model, operationMode, setCurrentPart, addToHistory, addToCart } = useAppStore();
  const { videoRef, torchOn, cameraError, start, stop, toggleTorch, capture } = useCamera();
  const { state: detState, detections, fps, load, startLoop, stopLoop, captureCrop } = useDetector(videoRef);
  const { quality, start: startQuality, stop: stopQuality } = useImageQuality(videoRef);

  const overlayRef    = useRef<HTMLCanvasElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  const [scanState, setScanState]   = useState<ScanState>('idle');
  const [statusText, setStatusText] = useState('');
  const [errMsg, setErrMsg]         = useState('');
  const [result, setResult]         = useState<Part | null>(null);
  const [confPct, setConfPct]       = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentOption | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // ── Start camera on demand ────────────────────────────────────────────────
  function enableCamera() {
    setCameraActive(true);
    start().then(() => {
      startQuality();
      load().then(() => {
        if (detState !== 'error') startLoop();
      });
    });
  }

  useEffect(() => {
    return () => { stop(); stopLoop(); stopQuality(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Draw detection boxes on overlay canvas ────────────────────────────────
  useEffect(() => {
    const canvas = overlayRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const container = containerRef.current;
    const cw = container?.clientWidth  || canvas.width;
    const ch = container?.clientHeight || canvas.height;
    canvas.width  = cw;
    canvas.height = ch;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, cw, ch);

    if (scanState !== 'idle' || detections.length === 0) return;

    for (const det of detections) {
      const color = CLASS_COLORS[det.className] ?? '#ffffff';
      const x = det.x * cw;
      const y = det.y * ch;
      const w = det.w * cw;
      const h = det.h * ch;

      // Box
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur  = 8;
      ctx.strokeRect(x, y, w, h);
      ctx.shadowBlur  = 0;

      // Corner brackets (AR style)
      const cs = Math.min(w, h) * 0.15; // corner size
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(([bx,by,sx,sy]) => {
        ctx.beginPath();
        ctx.moveTo(bx + (sx as number)*cs, by as number);
        ctx.lineTo(bx as number, by as number);
        ctx.lineTo(bx as number, by + (sy as number)*cs);
        ctx.stroke();
      });

      // Label chip
      const label = `${CLASS_LABELS[det.className] ?? det.className} ${Math.round(det.confidence * 100)}%`;
      ctx.font         = 'bold 11px Manrope, sans-serif';
      const textW      = ctx.measureText(label).width + 10;
      const chipH      = 20;
      const chipY      = Math.max(0, y - chipH);
      ctx.fillStyle    = color;
      ctx.fillRect(x, chipY, textW, chipH);
      ctx.fillStyle    = '#000';
      ctx.fillText(label, x + 5, chipY + 14);
    }
  }, [detections, scanState, videoRef]);

  // ── Scan core ─────────────────────────────────────────────────────────────
  const scanImageBase64 = useCallback(async (b64: string) => {
    if (!apiKey) { onToast('Set your API key first'); return; }
    setScanState('loading');
    setStatusText('Sending to AI model...');
    stopLoop();

    try {
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64, apiKey, model, operationMode }),
      });
      setStatusText('Parsing results...');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);

      const part: Part = { ...data.part, scannedAt: new Date().toISOString() };
      setResult(part);
      setConfPct(Math.round((part.confidence || 0.9) * 100));
      // Auto-select the identified assembly if AI is confident
      if (part.identifiedAssembly && part.identifiedAssembly.confidence !== 'low') {
        setSelectedEquipment({ name: part.identifiedAssembly.name, role: part.identifiedAssembly.model });
      }
      setScanState('result');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Unexpected error');
      setScanState('error');
    }
  }, [apiKey, model, onToast, stopLoop, setCurrentPart, addToHistory]);

  function enhanceImage(b64: string): Promise<string> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.filter = 'contrast(1.2) saturate(1.1) sharpen(1)';
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95).split(',')[1]);
      };
      img.onerror = () => resolve(b64); // fallback to original
      img.src = `data:image/jpeg;base64,${b64}`;
    });
  }

  async function captureAndScan() {
    const raw = captureCrop() ?? capture();
    if (!raw) { onToast('Camera not ready'); return; }
    const b64 = await enhanceImage(raw);
    await scanImageBase64(b64);
  }

  function openUploadPicker() { fileInputRef.current?.click(); }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;

    const isHeic = file.type === 'image/heic' || file.type === 'image/heif'
      || /\.(heic|heif)$/i.test(file.name);

    if (!file.type.startsWith('image/') && !isHeic) {
      onToast('Please select an image file');
      return;
    }

    let blob: Blob = file;
    if (isHeic) {
      try {
        const { default: heic2any } = await import('heic2any');
        blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 }) as Blob;
      } catch {
        onToast('Could not convert HEIC — try a JPEG or PNG');
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedImage(dataUrl);
      const b64 = dataUrl.split(',')[1];
      if (b64) scanImageBase64(b64);
    };
    reader.readAsDataURL(blob);
  }

  function reset() {
    setScanState('idle');
    setResult(null);
    setUploadedImage(null);
    setSelectedEquipment(null);
    if (cameraActive) startLoop();
  }

  function cancelScan() {
    setScanState('idle');
    setErrMsg('');
    if (cameraActive) startLoop();
  }

  function confirmEquipment(eq: EquipmentOption | null) {
    if (!result) return;
    const updated: Part = { ...result, parentAssembly: eq ? `${eq.name} — ${eq.role}` : undefined };
    setCurrentPart(updated);
    addToHistory(updated);
    navigate('part-details');
  }

  const bestDet    = detections[0] ?? null;
  const hasTarget  = bestDet && bestDet.confidence >= 0.35;
  const inStock    = result?.stockStatus?.toLowerCase().includes('in stock');

  return (
    <div ref={containerRef} className="relative flex flex-col h-full bg-black overflow-hidden">
      <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleUpload} />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center p-4 justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => navigate('dashboard')} className="text-white w-10 h-10 flex items-center justify-center">
          <Msi icon="arrow_back" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-white text-sm font-bold uppercase tracking-wider">AI Scanner</h1>
          {detState === 'ready' && scanState === 'idle' && (
            <span className="text-[10px] text-white/50 font-mono mt-0.5">
              {detections.length > 0 ? `${detections.length} part${detections.length > 1 ? 's' : ''} detected` : 'scanning...'} · {fps}fps
            </span>
          )}
          {detState === 'loading' && (
            <span className="text-[10px] text-white/50 mt-0.5">Loading detector...</span>
          )}
        </div>
        <button onClick={toggleTorch} disabled={!cameraActive} className="text-white w-10 h-10 flex items-center justify-center disabled:opacity-30">
          <Msi icon={torchOn ? 'flash_off' : 'flash_on'} />
        </button>
      </header>

      {/* Camera off — prompt to enable */}
      {!cameraActive && !uploadedImage && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950 gap-6 px-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Msi icon="photo_camera" className="text-primary text-[40px]" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">Camera is off</p>
            <p className="text-white/50 text-sm mt-1">Enable to scan parts, or upload an image</p>
          </div>
          <button
            onClick={enableCamera}
            className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg"
          >
            Enable Camera
          </button>
          <button
            onClick={openUploadPicker}
            className="flex items-center gap-2 text-white/60 text-sm font-semibold"
          >
            <Msi icon="photo_library" className="text-[18px]" />
            Upload Image Instead
          </button>
        </div>
      )}

      {/* Video feed */}
      <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover ${uploadedImage ? 'invisible' : ''}`} autoPlay playsInline muted />

      {/* Uploaded image preview */}
      {uploadedImage && (
        <img src={uploadedImage} alt="Uploaded" className="absolute inset-0 w-full h-full object-contain bg-black" />
      )}

      {/* Live image quality indicator */}
      {quality && scanState === 'idle' && !uploadedImage && (() => {
        const cfg = QUALITY_CONFIG[quality.label];
        return (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              <Msi icon={cfg.icon} className={`${cfg.color} text-[14px]`} />
              <span className={`text-[11px] font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.text}</span>
            </div>
            {/* Score bar */}
            <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${cfg.bar}`}
                style={{ width: `${Math.round(quality.score * 100)}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* Detection box overlay canvas */}
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Scan-line during LLM call */}
      {scanState === 'loading' && (
        <div className="scan-line absolute left-0 w-full h-px bg-primary/60 z-10 pointer-events-none"
             style={{ boxShadow: '0 0 12px rgba(0,90,156,0.9)' }} />
      )}

      {/* Matched bounding box (after LLM result) */}
      {scanState === 'result' && (
        <div className="absolute z-10 pointer-events-none border-2 border-green-400"
             style={{ top: '22%', left: '22%', width: '56%', height: '56%', boxShadow: '0 0 18px rgba(74,222,128,0.5)' }}>
          <div style={{ position: 'absolute', top: -22, left: -2, background: '#4ade80', color: '#000', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: '2px 2px 0 0', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {confPct}% MATCH
          </div>
        </div>
      )}

      {/* ── Capture controls (idle / error) ─────────────────────────────────── */}
      {(scanState === 'idle' || scanState === 'error') && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center pb-10 pt-6 bg-gradient-to-t from-black/85 to-transparent">

          {/* Detection hint */}
          {hasTarget ? (
            <div className="flex items-center gap-2 mb-4 bg-black/50 px-4 py-2 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white text-[11px] font-bold uppercase tracking-widest">
                {CLASS_LABELS[bestDet.className] ?? bestDet.className} — tap to identify
              </span>
            </div>
          ) : (
            <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-4">
              {detState === 'ready' ? 'Point camera at an AGE part' : 'Position part in frame'}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={openUploadPicker}
              className="w-12 h-12 rounded-full border border-white/30 bg-black/30 text-white flex items-center justify-center active:scale-95 transition-transform"
            >
              <Msi icon="photo_library" />
            </button>

            {/* Main capture button — pulses green when target locked */}
            <button
              onClick={captureAndScan}
              className={`w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-95 transition-all ${hasTarget ? 'ring-4 ring-green-400 ring-offset-2 ring-offset-black' : ''}`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${hasTarget ? 'bg-green-500' : 'bg-primary'}`}>
                <Msi icon={hasTarget ? 'my_location' : 'photo_camera'} className="text-white text-[32px]" />
              </div>
            </button>

            {/* Multi-detection picker (shown when >1 part detected) */}
            {detections.length > 1 && (
              <div className="flex flex-col gap-1">
                {detections.slice(0, 3).map((d, i) => (
                  <button
                    key={i}
                    className="text-[9px] font-bold px-2 py-1 rounded border border-white/20 text-white/70 bg-black/30"
                    style={{ borderColor: CLASS_COLORS[d.className] ?? '#fff' }}
                  >
                    {CLASS_LABELS[d.className] ?? d.className}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {scanState === 'loading' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-3 pb-10 pt-8 bg-gradient-to-t from-black/85 to-transparent">
          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white spin" />
          <p className="text-white text-xs font-bold uppercase tracking-widest">{statusText}</p>
          <button onClick={cancelScan} className="text-white/50 text-xs font-semibold mt-1 hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Result sheet */}
      {scanState === 'result' && result && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl slide-up max-h-[75vh] overflow-y-auto">
          <div className="p-4 pt-3">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />

            {/* Part header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="bg-primary/10 p-2 rounded shrink-0">
                  <Msi icon="auto_awesome" className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold leading-tight">{result.partName}</h3>
                  <p className="text-xs text-text-muted font-mono mt-0.5">NSN: {result.nsn || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold ml-2 shrink-0">IDENTIFIED</div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div className="bg-bg-light p-3 rounded">
                <p className="text-[10px] text-text-muted font-bold uppercase">Confidence</p>
                <p className="text-lg font-bold">{confPct}%</p>
              </div>
              <div className="bg-bg-light p-3 rounded">
                <p className="text-[10px] text-text-muted font-bold uppercase">Stock Status</p>
                <p className={`text-lg font-bold ${inStock ? 'text-success' : 'text-error'}`}>{result.stockStatus}</p>
              </div>
            </div>

            {bestDet && (
              <div className="bg-bg-light rounded px-3 py-2 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: CLASS_COLORS[bestDet.className] }} />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">
                  Detected as {CLASS_LABELS[bestDet.className] ?? bestDet.className}
                </span>
              </div>
            )}

            {/* Equipment picker */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Msi icon="account_tree" className="text-[13px]" />
                Parent assembly (optional)
              </p>
              <div className="flex flex-col gap-2">
                {result.possibleEquipment?.map((eq, i) => {
                  const active = selectedEquipment?.name === eq.name;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedEquipment(active ? null : eq)}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded border text-left transition-colors ${
                        active
                          ? 'bg-primary/5 border-primary text-primary'
                          : 'bg-bg-light border-border-light text-text-main hover:border-primary/50'
                      }`}
                    >
                      <Msi icon={active ? 'check_circle' : 'radio_button_unchecked'} className={`text-[18px] mt-0.5 shrink-0 ${active ? 'text-primary' : 'text-text-muted'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-tight">{eq.name}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">{eq.role}</p>
                      </div>
                    </button>
                  );
                })}
                {/* Manual entry */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="Or type assembly name (e.g. MC-7 Air Compressor)"
                    className="flex-1 text-sm bg-bg-light border border-border-light rounded px-3 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-text-muted/60"
                    onChange={e => {
                      const v = e.target.value.trim();
                      setSelectedEquipment(v ? { name: v, role: 'Manually entered' } : null);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => confirmEquipment(selectedEquipment)}
                className="flex-1 bg-primary text-white py-3 rounded font-bold text-sm tracking-wide"
              >
                View Technical Data
              </button>
              <button
                onClick={() => {
                  if (!result) return;
                  addToCart({ name: result.partName, nsn: result.nsn, stockStatus: result.stockStatus, icon: 'settings' });
                  onToast('Added to cart');
                  confirmEquipment(selectedEquipment);
                }}
                className="flex items-center gap-1.5 bg-success text-white px-4 py-3 rounded font-bold text-sm"
              >
                <Msi icon="add_shopping_cart" className="text-[18px]" />
              </button>
              <button onClick={reset} className="w-12 h-12 border border-border-light rounded flex items-center justify-center text-text-muted hover:bg-bg-light transition-colors">
                <Msi icon="close" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {scanState === 'error' && (
        <div className="absolute bottom-32 left-4 right-4 z-20 bg-white rounded-2xl shadow-2xl p-5 slide-up">
          <div className="flex items-center gap-3">
            <div className="bg-error/10 p-2 rounded shrink-0"><Msi icon="error" className="text-error" /></div>
            <div>
              <p className="font-bold text-sm">Scan Failed</p>
              <p className="text-xs text-text-muted mt-0.5">{errMsg}</p>
            </div>
          </div>
        </div>
      )}

      {/* Camera permission error */}
      {cameraError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-900 p-8 text-center">
          <Msi icon="videocam_off" className="text-5xl text-white/40 block mb-4" />
          <p className="text-white font-bold mb-2">Camera Access Required</p>
          <p className="text-white/50 text-sm mb-6">Allow camera access in your browser settings, then tap below.</p>
          <button onClick={start} className="bg-primary text-white px-6 py-3 rounded font-bold text-sm">
            Request Access
          </button>
        </div>
      )}
    </div>
  );
}
