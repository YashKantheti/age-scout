'use client';

import { useEffect, useRef, useState } from 'react';
import { Msi } from '../Msi';
import { useAppStore } from '@/store/appStore';
import { useCamera } from '@/hooks/useCamera';
import type { Part } from '@/types';

type ScanState = 'idle' | 'loading' | 'result' | 'error';

interface Props {
  onToast: (msg: string) => void;
}

export function ScannerScreen({ onToast }: Props) {
  const { navigate, apiKey, model, setCurrentPart, addToHistory } = useAppStore();
  const { videoRef, torchOn, cameraError, start, stop, toggleTorch, capture } = useCamera();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [statusText, setStatusText] = useState('Analyzing image...');
  const [errMsg, setErrMsg] = useState('');
  const [result, setResult] = useState<Part | null>(null);
  const [confPct, setConfPct] = useState(0);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  async function scanImageBase64(b64: string) {
    if (!apiKey) { onToast('Set your API key first'); return; }
    setScanState('loading');
    setStatusText('Sending to AI model...');

    try {
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64, apiKey, model }),
      });

      setStatusText('Parsing results...');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);

      const part: Part = { ...data.part, scannedAt: new Date().toISOString() };
      setResult(part);
      setCurrentPart(part);
      addToHistory(part);
      setConfPct(Math.round((part.confidence || 0.9) * 100));
      setScanState('result');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Unexpected error');
      setScanState('error');
    }
  }

  async function captureAndScan() {
    const b64 = capture();
    if (!b64) { onToast('Camera not ready'); return; }
    await scanImageBase64(b64);
  }

  function openUploadPicker() {
    fileInputRef.current?.click();
  }

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async function handleUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onToast('Please select an image file');
      return;
    }

    try {
      setStatusText('Preparing upload...');
      const dataUrl = await readFileAsDataUrl(file);
      const b64 = dataUrl.split(',')[1];
      if (!b64) {
        onToast('Unable to process image');
        return;
      }
      await scanImageBase64(b64);
    } catch {
      onToast('Failed to read selected image');
    }
  }

  function reset() {
    setScanState('idle');
    setResult(null);
  }

  function viewDetails() {
    navigate('part-details');
  }

  const inStock = result?.stockStatus?.toLowerCase().includes('in stock');

  return (
    <div className="relative flex flex-col h-full bg-black">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadChange}
      />

      {/* Header overlay */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center p-4 justify-between bg-gradient-to-b from-black/75 to-transparent">
        <button onClick={() => navigate('dashboard')} className="text-white w-10 h-10 flex items-center justify-center">
          <Msi icon="arrow_back" />
        </button>
        <h1 className="text-white text-base font-bold uppercase tracking-wider">AI Scanner</h1>
        <button onClick={toggleTorch} className="text-white w-10 h-10 flex items-center justify-center">
          <Msi icon={torchOn ? 'flash_off' : 'flash_on'} />
        </button>
      </header>

      {/* Video */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted />

      {/* AR overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 250, height: 250, border: '2px solid rgba(0,90,156,0.5)', borderRadius: 20 }}>
          <div style={{ position: 'absolute', top: -2, left: -2, width: 26, height: 26, borderTop: '4px solid #005A9C', borderLeft: '4px solid #005A9C', borderRadius: '8px 0 0 0' }} />
          <div style={{ position: 'absolute', top: -2, right: -2, width: 26, height: 26, borderTop: '4px solid #005A9C', borderRight: '4px solid #005A9C', borderRadius: '0 8px 0 0' }} />
          <div style={{ position: 'absolute', bottom: -2, left: -2, width: 26, height: 26, borderBottom: '4px solid #005A9C', borderLeft: '4px solid #005A9C', borderRadius: '0 0 0 8px' }} />
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderBottom: '4px solid #005A9C', borderRight: '4px solid #005A9C', borderRadius: '0 0 8px 0' }} />
        </div>
        {scanState === 'loading' && (
          <div className="scan-line absolute left-0 w-full h-px bg-primary/60" style={{ boxShadow: '0 0 12px rgba(0,90,156,0.9)' }} />
        )}
        {scanState === 'result' && (
          <div className="absolute border-2 border-green-400" style={{ top: '22%', left: '28%', width: '44%', height: '56%', boxShadow: '0 0 18px rgba(74,222,128,0.5)' }}>
            <div style={{ position: 'absolute', top: -22, left: -2, background: '#4ade80', color: '#000', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: '2px 2px 0 0', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {confPct}% MATCH
            </div>
          </div>
        )}
      </div>

      {/* Idle capture button */}
      {(scanState === 'idle' || scanState === 'error') && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-3 pb-10 pt-8 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Position part in frame</p>
          <div className="flex items-center gap-3">
            <button
              onClick={openUploadPicker}
              className="w-12 h-12 rounded-full border border-white/40 bg-black/20 text-white flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Upload image"
            >
              <Msi icon="photo_library" />
            </button>
            <button
              onClick={captureAndScan}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              aria-label="Capture image"
            >
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <Msi icon="photo_camera" className="text-white text-[32px]" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {scanState === 'loading' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-3 pb-10 pt-8 bg-gradient-to-t from-black/80 to-transparent">
          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white spin" />
          <p className="text-white text-xs font-bold uppercase tracking-widest">{statusText}</p>
        </div>
      )}

      {/* Result sheet */}
      {scanState === 'result' && result && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl slide-up">
          <div className="p-4 pt-3">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
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
            <div className="flex gap-2">
              <button onClick={viewDetails} className="flex-1 bg-primary text-white py-3 rounded font-bold text-sm tracking-wide">
                View Technical Data
              </button>
              <button onClick={reset} className="w-12 h-12 border border-border-light rounded flex items-center justify-center text-text-muted hover:bg-bg-light transition-colors">
                <Msi icon="close" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error sheet */}
      {scanState === 'error' && (
        <div className="absolute bottom-32 left-0 right-0 z-20 mx-4 bg-white rounded-2xl shadow-2xl p-5 slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-error/10 p-2 rounded shrink-0"><Msi icon="error" className="text-error" /></div>
            <div>
              <p className="font-bold text-sm">Scan Failed</p>
              <p className="text-xs text-text-muted mt-0.5">{errMsg}</p>
            </div>
          </div>
        </div>
      )}

      {/* Camera error */}
      {cameraError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-900 p-8 text-center">
          <Msi icon="videocam_off" className="text-5xl text-white/40 block mb-4" />
          <p className="text-white font-bold mb-2">Camera Access Required</p>
          <p className="text-white/50 text-sm mb-6">Allow camera access in your browser settings, or upload a photo from your device.</p>
          <div className="flex gap-2">
            <button onClick={start} className="bg-primary text-white px-6 py-3 rounded font-bold text-sm">
              Request Access
            </button>
            <button onClick={openUploadPicker} className="bg-white/10 text-white px-6 py-3 rounded font-bold text-sm border border-white/20">
              Upload Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
