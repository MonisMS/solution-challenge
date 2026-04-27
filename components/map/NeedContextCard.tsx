'use client';

import { useState, useEffect } from 'react';
import type { CommunityNeed, Volunteer } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import { getTopMatches, haversineKm, scoreVolunteer } from '@/lib/matching';
import VideoModal from '@/components/video/VideoModal';

const SEV_COLOR: Record<string, string> = {
  critical: 'text-red-600',
  high:     'text-orange-600',
  medium:   'text-amber-600',
  low:      'text-emerald-600',
};

const SEV_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-amber-500',
  low:      'bg-emerald-500',
};

function timeAgo(ms: number): string {
  const d = Date.now() - ms;
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} min ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} h ago`;
  return `${Math.floor(d / 86_400_000)} d ago`;
}

interface Props {
  need: CommunityNeed;
  volunteers: Volunteer[];
  onClose: () => void;
  onInitiateAssign: (need: CommunityNeed, volunteer: Volunteer) => void;
  onResolve: (needId: string) => void;
  onViewDetails: () => void;
}

export default function NeedContextCard({
  need, volunteers, onClose, onInitiateAssign, onResolve, onViewDetails,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const matches = getTopMatches(need, volunteers, 2);

  return (
    <>
      <div
        className={visible ? 'opacity-100' : 'opacity-0'}
        style={{
          transform: visible ? 'translateX(0) scale(1)' : 'translateX(20px) scale(0.97)',
          transition: 'transform 480ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms ease-out',
        }}
      >
        <div
          className="w-[340px] rounded-2xl border border-slate-200/70 overflow-hidden shadow-2xl shadow-slate-900/10"
          style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(24px) saturate(140%)' }}
        >
          {/* ── Video / placeholder hero ── */}
          <div
            className="relative cursor-pointer group overflow-hidden"
            style={{ aspectRatio: '16/10' }}
            onClick={() => need.video_url && setShowVideo(true)}
          >
            {need.video_url ? (
              <>
                <video src={need.video_url} className="w-full h-full object-cover" muted preload="metadata" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/0 to-slate-900/30 group-hover:from-slate-900/60 transition-all duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-slate-900/30 group-hover:scale-110 transition-transform duration-300 ease-out">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0f172a">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/55 backdrop-blur-md rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-white font-bold tracking-wider uppercase">Field video</span>
                </div>
              </>
            ) : (
              <VideoPlaceholder />
            )}

            {/* Severity ribbon overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-md shadow-slate-900/10">
              <span className={`w-1.5 h-1.5 rounded-full ${SEV_DOT[need.severity]} ${need.severity === 'critical' ? 'animate-pulse' : ''}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${SEV_COLOR[need.severity]}`}>
                {need.severity}
              </span>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="px-5 pt-4 pb-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-900 capitalize tracking-tight leading-tight">
                  {need.need_type}{need.need_type === 'medical' ? ' emergency' : ' need'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="capitalize">{need.location}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span>{need.affected_count} {need.affected_count === 1 ? 'person' : 'people'}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span>{timeAgo(need.created_at)}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="-mr-1 -mt-1 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Quote — field report */}
            <p className="text-sm text-slate-600 italic leading-relaxed mt-3 line-clamp-2 pl-3 border-l-2 border-slate-200">
              &ldquo;{need.raw_message}&rdquo;
            </p>

            {/* Status banner */}
            {need.status === 'assigned' && (
              <div className="mt-4 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-cyan-50/80 border border-cyan-100">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-xs font-semibold text-cyan-700">Volunteer en route</span>
                {need.volunteer_eta && (
                  <span className="text-xs text-cyan-600/80 ml-auto">{need.volunteer_eta}</span>
                )}
              </div>
            )}

            {need.status === 'resolved' && (
              <div className="mt-4 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-50/80 border border-emerald-100">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                <span className="text-xs font-semibold text-emerald-700">Resolved</span>
              </div>
            )}

            {/* Nearest responders */}
            {need.status === 'open' && matches.length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.14em] mb-2.5">
                  Nearest responders
                </p>
                <div className="space-y-1">
                  {matches.map(v => {
                    const km = haversineKm(v.lat, v.lng, need.lat, need.lng).toFixed(1);
                    const score = Math.round(scoreVolunteer(v, need) * 100);
                    return (
                      <div key={v.id} className="group flex items-center gap-3 -mx-1.5 px-1.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="relative shrink-0">
                          <Avatar name={v.name} size="sm" />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{v.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            <span className="capitalize">{v.ward}</span>
                            <span className="mx-1 text-slate-300">·</span>
                            <span>{km} km away</span>
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className="text-[11px] font-bold text-blue-600 tabular-nums">{score}%</span>
                          <button
                            onClick={() => onInitiateAssign(need, v)}
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-700 text-white opacity-0 group-hover:opacity-100 transition-all"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action footer */}
            <div className="mt-5 flex items-center gap-2">
              {need.status === 'assigned' && (
                <button
                  onClick={() => onResolve(need.id)}
                  className="flex-1 py-2.5 text-xs font-semibold tracking-wide text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  Mark resolved
                </button>
              )}
              <button
                onClick={onViewDetails}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Open full report →
              </button>
            </div>
          </div>
        </div>
      </div>

      {showVideo && need.video_url && (
        <VideoModal
          url={need.video_url}
          title={`${need.need_type} report — ${need.location}`}
          onClose={() => setShowVideo(false)}
        />
      )}
    </>
  );
}

function VideoPlaceholder() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f1f5f9 0%, #ddd6fe 50%, #fce7f3 100%)',
      }}
    >
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Soft radial highlight */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 100%, rgba(255,255,255,0.6), transparent 60%)',
        }}
      />
      {/* Ripple rings (smooth animation) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute -inset-12 rounded-full border border-slate-300/50 need-marker-ring" />
        <div className="absolute -inset-6 rounded-full border border-slate-300/40 need-marker-ring" style={{ animationDelay: '0.6s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-2.5">
        <div className="w-14 h-14 rounded-2xl bg-white/85 backdrop-blur-md flex items-center justify-center shadow-lg shadow-slate-900/10 border border-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.6">
            <path d="M23 7l-7 5 7 5V7z" fill="#cbd5e1" stroke="#475569"/>
            <rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
        </div>
        <p className="text-xs font-semibold text-slate-700">Awaiting field media</p>
        <p className="text-[10px] text-slate-500 max-w-[200px] text-center leading-relaxed">
          Field workers can attach video to their WhatsApp report
        </p>
      </div>
    </div>
  );
}
