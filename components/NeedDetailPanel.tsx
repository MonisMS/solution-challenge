'use client';

import type { CommunityNeed, Volunteer } from '@/lib/types';
import { getTopMatches, scoreVolunteer } from '@/lib/matching';

const NEED_ICON: Record<string, string> = {
  food: '🍱', medical: '🏥', shelter: '🏠', water: '💧', other: '📦',
};

const SEV_STYLE: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  high: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  medium: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  low: 'bg-green-50 text-green-700 ring-1 ring-green-200',
};

const SEV_BAR: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
  'bg-indigo-500', 'bg-teal-500',
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}
function timeAgo(ms: number): string {
  const d = Date.now() - ms;
  if (d < 60000) return 'just now';
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

interface Props {
  need: CommunityNeed;
  volunteers: Volunteer[];
  onBack: () => void;
  onInitiateAssign: (need: CommunityNeed, volunteer: Volunteer) => void;
  onResolve?: (needId: string) => void;
}

export default function NeedDetailPanel({ need, volunteers, onBack, onInitiateAssign, onResolve }: Props) {
  const matches = getTopMatches(need, volunteers, 5);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Back
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <span className="text-sm font-medium text-slate-600 capitalize">{need.need_type} Need</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Hero */}
        <div className={`h-1 rounded-full ${SEV_BAR[need.severity]}`} />
        <div className="flex items-start gap-3">
          <span className="text-3xl">{NEED_ICON[need.need_type]}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-slate-900 capitalize text-lg leading-tight">{need.need_type}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${SEV_STYLE[need.severity]}`}>
                {need.severity}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {need.location} · {need.affected_count} people · {timeAgo(need.created_at)}
            </p>
          </div>
        </div>

        {/* Raw message */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Field Report</p>
          <div className="bg-slate-50 rounded-xl p-3.5 border-l-4 border-slate-300">
            <p className="text-sm text-slate-700 italic leading-relaxed">"{need.raw_message}"</p>
            <p className="text-xs text-slate-400 mt-2">{need.source_phone}</p>
          </div>
        </div>

        {/* Extraction details */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Extracted by Gemini</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Location', value: need.location },
              { label: 'Type', value: need.need_type },
              { label: 'Severity', value: need.severity },
              { label: 'Affected', value: `${need.affected_count} people` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        {need.status === 'assigned' && (
          <div className="space-y-2">
            <div className="text-sm font-semibold px-3 py-2 rounded-lg text-center bg-blue-50 text-blue-700">
              ✓ Assigned — volunteer en route
            </div>
            {onResolve && (
              <button
                onClick={() => onResolve(need.id)}
                className="w-full text-sm font-semibold px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Mark as Resolved
              </button>
            )}
          </div>
        )}
        {need.status === 'resolved' && (
          <div className="text-sm font-semibold px-3 py-2 rounded-lg text-center bg-green-50 text-green-700">
            ✓ Resolved
          </div>
        )}

        {/* Top volunteer matches */}
        {need.status === 'open' && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Best Matches {matches.length === 0 && '— no available volunteers'}
            </p>
            <div className="space-y-2">
              {matches.map(v => {
                const score = Math.round(scoreVolunteer(v, need) * 100);
                return (
                  <div key={v.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                    <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(v.name)}`}>
                      {initials(v.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{v.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{v.ward} · {v.skills.join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-blue-600 font-semibold">{score}%</span>
                      <button
                        onClick={() => onInitiateAssign(need, v)}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
      </div>
    </div>
  );
}
