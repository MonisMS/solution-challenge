'use client';

import type { CommunityNeed, Volunteer } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import { getTopMatches, haversineKm, scoreVolunteer } from '@/lib/matching';

const SEV_TEXT: Record<string, string> = {
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
  onBack: () => void;
  onInitiateAssign: (need: CommunityNeed, volunteer: Volunteer) => void;
  onResolve?: (needId: string) => void;
}

export default function NeedDetail({ need, volunteers, onBack, onInitiateAssign, onResolve }: Props) {
  const matches = getTopMatches(need, volunteers, 5);

  return (
    <div className="flex flex-col h-full">
      {/* Slim header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back to alerts
        </button>
        {need.escalated && (
          <span className="text-[10px] font-bold text-red-600 animate-pulse uppercase tracking-[0.14em]">
            ● Escalated
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="px-5 pt-3 pb-6 border-b border-slate-200/70">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">
            <span className={`w-1.5 h-1.5 rounded-full ${SEV_DOT[need.severity]} ${need.severity === 'critical' ? 'animate-pulse' : ''}`} />
            <span className={SEV_TEXT[need.severity]}>{need.severity} severity</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 normal-case tracking-normal font-medium">{timeAgo(need.created_at)}</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 tracking-tight leading-tight capitalize">
            {need.need_type}{need.need_type === 'medical' ? ' emergency' : ' need'}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            <span className="capitalize">{need.location}</span>, Mumbai
            <span className="mx-2 text-slate-300">·</span>
            <span>{need.affected_count} {need.affected_count === 1 ? 'person' : 'people'} affected</span>
          </p>
        </div>

        {/* Pull-quote field report */}
        <div className="px-5 py-6 border-b border-slate-200/70">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-3">Field report</p>
          <blockquote className="relative pl-5">
            <span className="absolute left-0 -top-1 text-3xl text-slate-300 leading-none font-serif select-none">&ldquo;</span>
            <p className="text-base text-slate-700 italic leading-relaxed font-light">
              {need.raw_message}
            </p>
          </blockquote>
          <p className="mt-3 text-[11px] text-slate-400 font-mono pl-5">
            — Reported from <span className="text-slate-600">{need.source_phone}</span>
          </p>
        </div>

        {/* Status */}
        {need.status === 'assigned' && (
          <div className="px-5 py-5 border-b border-slate-200/70">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-cyan-700 uppercase tracking-[0.18em]">Volunteer dispatched</span>
            </div>
            {(need.volunteer_eta || need.volunteer_reply) && (
              <div className="space-y-2 mb-3">
                {need.volunteer_eta && (
                  <p className="text-sm text-slate-700">
                    <span className="text-slate-400 font-medium">Status</span>
                    <span className="mx-2 text-slate-300">→</span>
                    <span className="font-medium">{need.volunteer_eta}</span>
                  </p>
                )}
                {need.volunteer_reply && (
                  <p className="text-sm text-slate-500 italic leading-relaxed">
                    &ldquo;{need.volunteer_reply.slice(0, 120)}{need.volunteer_reply.length > 120 ? '…' : ''}&rdquo;
                  </p>
                )}
              </div>
            )}
            {onResolve && (
              <button
                onClick={() => onResolve(need.id)}
                className="w-full py-2.5 text-xs font-semibold tracking-wide text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
              >
                Mark resolved
              </button>
            )}
          </div>
        )}

        {need.status === 'resolved' && (
          <div className="px-5 py-5 border-b border-slate-200/70 flex items-center gap-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
            <span className="text-sm font-semibold text-emerald-700">Resolved</span>
          </div>
        )}

        {/* Best responders */}
        {need.status === 'open' && (
          <div className="px-5 py-6">
            <div className="flex items-baseline justify-between mb-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">Best responders</p>
              <p className="text-[11px] text-slate-400">{matches.length} available</p>
            </div>
            <div className="-mx-1.5 space-y-0.5">
              {matches.map(v => {
                const score = Math.round(scoreVolunteer(v, need) * 100);
                const km = haversineKm(v.lat, v.lng, need.lat, need.lng).toFixed(1);
                return (
                  <div
                    key={v.id}
                    className="group flex items-center gap-3 px-1.5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="relative shrink-0">
                      <Avatar name={v.name} size="sm" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{v.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className="capitalize">{v.ward}</span>
                        <span className="mx-1 text-slate-300">·</span>
                        <span>{km} km away</span>
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      <span className="text-xs font-bold text-blue-600 tabular-nums">{score}%</span>
                      <button
                        onClick={() => onInitiateAssign(need, v)}
                        className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-700 text-white transition-colors"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                );
              })}

              {matches.length === 0 && (
                <p className="text-sm text-slate-400 italic px-1.5 py-4">No volunteers currently available.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
