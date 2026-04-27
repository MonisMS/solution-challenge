'use client';

import type L from 'leaflet';

interface Props {
  map: L.Map | null;
}

export default function MapControls({ map }: Props) {
  if (!map) return null;

  const btn = 'w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors';

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200"
      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)' }}
    >
      <button
        onClick={() => map.zoomIn()}
        className={`${btn} border-b border-slate-200`}
        title="Zoom in"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
      <button
        onClick={() => map.zoomOut()}
        className={`${btn} border-b border-slate-200`}
        title="Zoom out"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14"/>
        </svg>
      </button>
      <button
        onClick={() => map.flyTo([19.076, 72.877], 12, { duration: 0.8 })}
        className={btn}
        title="Reset view"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 1 0 9-9"/>
          <polyline points="3 4 3 12 11 12"/>
        </svg>
      </button>
    </div>
  );
}
