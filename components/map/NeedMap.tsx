'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CommunityNeed } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

const SEV_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#10b981',
};

const NEED_SVG: Record<string, string> = {
  food:    '<path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M5 11v11M14 7c0-2.8 2.2-5 5-5v20"/>',
  medical: '<path d="M9 1v6H3v6h6v6h6v-6h6V7h-6V1z"/>',
  shelter: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10"/>',
  water:   '<path d="M12 2.5c-3 4.5-6 8-6 11.5a6 6 0 0 0 12 0c0-3.5-3-7-6-11.5z"/>',
  other:   '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M9 6V4h6v2"/>',
};

function markerIcon(need: CommunityNeed, selected: boolean) {
  const isResolved = need.status === 'resolved';
  const color   = isResolved ? '#94a3b8' : SEV_COLOR[need.severity];
  const iconSvg = NEED_SVG[need.need_type] ?? NEED_SVG.other;
  const size    = selected ? 40 : 32;
  const ringSize = size + 18;
  const isUrgent = !isResolved && (need.severity === 'critical' || need.severity === 'high');

  const pulseRing = isUrgent
    ? `<div class="need-marker-ring" style="background:${color}55;width:${ringSize}px;height:${ringSize}px;left:calc(50% - ${ringSize/2}px);top:calc(50% - ${ringSize/2}px);"></div>`
    : '';

  const shadow = selected
    ? `box-shadow:0 0 0 4px ${color}22, 0 8px 24px rgba(15,23,42,0.18), 0 2px 8px ${color}66`
    : `box-shadow:0 4px 12px rgba(15,23,42,0.14), 0 0 0 1px ${color}22`;

  const opacity = isResolved ? 0.55 : 1;

  return L.divIcon({
    html: `<div style="position:relative;width:${size}px;height:${size}px;opacity:${opacity};transition:all 280ms cubic-bezier(0.16, 1, 0.3, 1)">
      ${pulseRing}
      <div style="
        position:relative;
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:#ffffff;
        border:2.5px solid ${color};
        ${shadow};
        display:flex;align-items:center;justify-content:center;
        transition:all 280ms cubic-bezier(0.16, 1, 0.3, 1);
      ">
        <svg width="${selected ? 18 : 14}" height="${selected ? 18 : 14}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          ${iconSvg}
        </svg>
      </div>
      ${need.escalated ? `<div style="position:absolute;top:-3px;right:-3px;width:11px;height:11px;border-radius:50%;background:#ef4444;border:2px solid #ffffff;box-shadow:0 0 8px rgba(239,68,68,0.6);"></div>` : ''}
    </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapController({ selectedNeed }: { selectedNeed: CommunityNeed | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedNeed) map.flyTo([selectedNeed.lat, selectedNeed.lng], 15, { duration: 1.2 });
  }, [selectedNeed, map]);
  return null;
}

function MapReadyHook({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { if (onMapReady) onMapReady(map); }, [map, onMapReady]);
  return null;
}

interface Props {
  needs: CommunityNeed[];
  selectedNeed: CommunityNeed | null;
  onSelectNeed: (need: CommunityNeed) => void;
  showResolved?: boolean;
  onMapReady?: (map: L.Map) => void;
}

export default function NeedMap({ needs, selectedNeed, onSelectNeed, showResolved = true, onMapReady }: Props) {
  const visibleNeeds = showResolved ? needs : needs.filter(n => n.status !== 'resolved');

  return (
    <MapContainer
      center={[19.076, 72.877]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
      zoomControl={false}
    >
      <MapController selectedNeed={selectedNeed} />
      <MapReadyHook onMapReady={onMapReady} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
        maxZoom={20}
      />
      {visibleNeeds.map(need => (
        <Marker
          key={need.id}
          position={[need.lat, need.lng]}
          icon={markerIcon(need, selectedNeed?.id === need.id)}
          eventHandlers={{ click: () => onSelectNeed(need) }}
        />
      ))}
    </MapContainer>
  );
}
