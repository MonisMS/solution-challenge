'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CommunityNeed, Volunteer } from '@/lib/types';
import { getTopMatches, scoreVolunteer } from '@/lib/matching';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SEV_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const SEV_LABEL: Record<string, string> = {
  critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW',
};

const NEED_ICON: Record<string, string> = {
  food: '🍱', medical: '🏥', shelter: '🏠', water: '💧', other: '📦',
};

function markerIcon(severity: string, selected: boolean) {
  const size = selected ? 20 : 14;
  const color = SEV_COLOR[severity] ?? '#888';
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${selected ? '3px' : '2px'} solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transition:all 0.2s"></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapController({ selectedNeed }: { selectedNeed: CommunityNeed | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedNeed) {
      map.flyTo([selectedNeed.lat, selectedNeed.lng], 15, { duration: 1.2 });
    }
  }, [selectedNeed, map]);

  return null;
}

function initials(name: string) { return name.split(' ').map(n => n[0]).join('').slice(0, 2); }

interface Props {
  needs: CommunityNeed[];
  volunteers: Volunteer[];
  selectedNeed: CommunityNeed | null;
  onSelectNeed: (need: CommunityNeed) => void;
  onInitiateAssign: (need: CommunityNeed, volunteer: Volunteer) => void;
}

export default function NeedMap({ needs, volunteers, selectedNeed, onSelectNeed, onInitiateAssign }: Props) {
  return (
    <MapContainer center={[19.076, 72.877]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
      <MapController selectedNeed={selectedNeed} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {needs.map(need => {
        const isSelected = selectedNeed?.id === need.id;
        const matches = getTopMatches(need, volunteers, 3);
        return (
          <Marker
            key={need.id}
            position={[need.lat, need.lng]}
            icon={markerIcon(need.severity, isSelected)}
            eventHandlers={{ click: () => onSelectNeed(need) }}
          >
            <Popup>
              <div style={{ minWidth: 200, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{NEED_ICON[need.need_type]}</span>
                  <div>
                    <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{need.need_type}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                      <span style={{ background: SEV_COLOR[need.severity], color: 'white', padding: '1px 6px', borderRadius: 9999, fontSize: 10, fontWeight: 600 }}>
                        {SEV_LABEL[need.severity]}
                      </span>
                      {' '}{need.location} · {need.affected_count} people
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.4 }}>
                  &ldquo;{need.raw_message.slice(0, 70)}{need.raw_message.length > 70 ? '…' : ''}&rdquo;
                </div>
                {need.status === 'open' && matches.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Top Matches</div>
                    {matches.map(v => {
                      const score = Math.round(scoreVolunteer(v, need) * 100);
                      return (
                        <button
                          key={v.id}
                          onClick={() => onInitiateAssign(need, v)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            textAlign: 'left', padding: '5px 8px', marginBottom: 4,
                            background: '#f8fafc', border: '1px solid #e2e8f0',
                            borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = '#eff6ff')}
                          onMouseOut={e => (e.currentTarget.style.background = '#f8fafc')}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b82f6', color: 'white', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                            {initials(v.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{v.name}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>{v.ward}</div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', flexShrink: 0 }}>{score}%</span>
                        </button>
                      );
                    })}
                  </>
                )}
                {need.status !== 'open' && (
                  <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: need.status === 'assigned' ? '#2563eb' : '#16a34a', padding: '4px 8px', background: need.status === 'assigned' ? '#eff6ff' : '#f0fdf4', borderRadius: 6 }}>
                    {need.status === 'assigned' ? '✓ Assigned' : '✓ Resolved'}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
