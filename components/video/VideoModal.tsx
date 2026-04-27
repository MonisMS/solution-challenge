'use client';

import { useEffect, useRef } from 'react';

interface Props {
  url: string;
  title: string;
  onClose: () => void;
}

export default function VideoModal({ url, title, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/55 backdrop-blur-md">
      <div className="relative w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Field Report · Video</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-300 text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white aspect-video flex items-center justify-center">
          {url.startsWith('http') ? (
            <video
              ref={videoRef}
              src={url}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-400">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.361a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/>
              </svg>
              <p className="text-sm">Video unavailable</p>
            </div>
          )}
        </div>

        <p className="mt-3 text-sm text-slate-600 text-center">{title}</p>
      </div>
    </div>
  );
}
