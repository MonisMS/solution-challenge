'use client';

import { useMemo } from 'react';
import type { CommunityNeed, Volunteer } from '@/lib/types';

const SEV_COLOR: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-amber-500',
  low:      'bg-emerald-500',
};

const SEV_TEXT: Record<string, string> = {
  critical: 'text-red-600',
  high:     'text-orange-600',
  medium:   'text-amber-600',
  low:      'text-emerald-600',
};

const HOURS_BACK = 12;
const HOUR_MS = 3600 * 1000;

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

interface Props {
  needs: CommunityNeed[];
  volunteers: Volunteer[];
}

export default function StatsPanel({ needs, volunteers }: Props) {
  const open      = needs.filter(n => n.status === 'open');
  const assigned  = needs.filter(n => n.status === 'assigned');
  const resolved  = needs.filter(n => n.status === 'resolved');
  const escalated = needs.filter(n => n.escalated).length;
  const available = volunteers.filter(v => v.available).length;

  const sevBreakdown = ['critical', 'high', 'medium', 'low'].map(sev => ({
    sev,
    count: open.filter(n => n.severity === sev).length,
  }));
  const maxSev = Math.max(...sevBreakdown.map(s => s.count), 1);

  const hourlyBars = useMemo(() => {
    const now = Date.now();
    const buckets: number[] = Array(HOURS_BACK).fill(0);
    for (const n of needs) {
      const idx = Math.floor((now - n.created_at) / HOUR_MS);
      if (idx >= 0 && idx < HOURS_BACK) buckets[HOURS_BACK - 1 - idx]++;
    }
    return buckets;
  }, [needs]);

  const maxBar = Math.max(...hourlyBars, 1);
  const resolutionRate = needs.length > 0 ? Math.round((resolved.length / needs.length) * 100) : 0;

  // Smooth area sparkline path
  const W = 220, H = 36;
  const pts = hourlyBars.map((c, i) => ({
    x: (i / Math.max(HOURS_BACK - 1, 1)) * W,
    y: H - (c / maxBar) * H,
  }));
  const linePath = pts.length
    ? pts.reduce((acc, p, i) => acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '')
    : '';
  const areaPath = linePath ? `${linePath} L ${W} ${H} L 0 ${H} Z` : '';

  return (
    <div
      className="rounded-2xl border border-slate-200/70 overflow-hidden shadow-lg shadow-slate-900/5"
      style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px) saturate(140%)' }}
    >
      {/* Editorial header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">Today</p>
          <span className="text-[10px] text-slate-500 font-medium">{todayLabel()}</span>
        </div>

        <h2 className="mt-3 text-[44px] font-bold text-slate-900 tracking-tight leading-none tabular-nums">
          {open.length}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          active alerts
          {needs.length > 0 && (
            <>
              <span className="mx-2 text-slate-300">·</span>
              <span className="text-emerald-600 font-medium">{resolutionRate}% resolved</span>
            </>
          )}
        </p>

        {/* Smooth area sparkline */}
        <div className="mt-4 -mx-1">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-9 overflow-visible">
            <defs>
              <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {areaPath && (
              <>
                <path d={areaPath} fill="url(#spark-grad)" />
                <path d={linePath} stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {pts.length > 0 && (
                  <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3" fill="#3b82f6" />
                )}
              </>
            )}
          </svg>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium tabular-nums">
          <span>{HOURS_BACK}h ago</span>
          <span>now</span>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Severity */}
      <div className="px-5 py-5">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-3">By severity</p>
        <div className="space-y-2.5">
          {sevBreakdown.map(({ sev, count }) => (
            <div key={sev} className="flex items-center gap-3">
              <span className={`text-xs font-medium w-14 capitalize ${count > 0 ? SEV_TEXT[sev] : 'text-slate-300'}`}>
                {sev}
              </span>
              <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${SEV_COLOR[sev]} transition-all duration-700 ease-out`}
                  style={{ width: count === 0 ? '0%' : `${(count / maxSev) * 100}%` }}
                />
              </div>
              <span className={`text-xs tabular-nums w-5 text-right font-medium ${count > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Activity inline */}
      <div className="px-5 py-5">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-3">Activity</p>
        <dl className="space-y-2">
          {[
            { label: 'Total reported', value: needs.length, tone: 'text-slate-900' },
            { label: 'Assigned',       value: assigned.length, tone: 'text-cyan-600' },
            { label: 'Resolved',       value: resolved.length, tone: 'text-emerald-600' },
            { label: 'Escalated',      value: escalated, tone: 'text-red-600' },
          ].map(({ label, value, tone }) => (
            <div key={label} className="flex items-baseline justify-between">
              <dt className="text-sm text-slate-600">{label}</dt>
              <dd className={`text-base font-bold tabular-nums ${tone}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Volunteer pool */}
      <div className="px-5 py-5">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">Volunteer pool</p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            <span className="text-slate-900 font-bold tabular-nums text-base">{available}</span>
            <span className="mx-1 text-slate-400">of</span>
            <span className="text-slate-700 font-medium tabular-nums">{volunteers.length}</span>
            <span className="ml-1.5 text-slate-500">ready</span>
          </p>
          <div className="flex -space-x-2">
            {volunteers.filter(v => v.available).slice(0, 4).map((v, i) => (
              <div
                key={v.id}
                className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm shadow-slate-900/10"
                style={{ zIndex: 4 - i }}
                title={v.name}
              >
                {v.name.charAt(0)}
              </div>
            ))}
            {available > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                +{available - 4}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
