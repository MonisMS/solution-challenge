'use client';

import { useState } from 'react';
import type { CommunityNeed, NeedStatus } from '@/lib/types';

const SEV_BAR: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
};

const SEV_BADGE: Record<string, string> = {
  critical: 'bg-red-50 text-red-700',
  high: 'bg-orange-50 text-orange-700',
  medium: 'bg-yellow-50 text-yellow-700',
  low: 'bg-green-50 text-green-700',
};

const NEED_ICON: Record<string, string> = {
  food: '🍱', medical: '🏥', shelter: '🏠', water: '💧', other: '📦',
};

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function timeAgo(ms: number): string {
  const d = Date.now() - ms;
  if (d < 60000) return 'just now';
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

const TABS: { key: NeedStatus; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'resolved', label: 'Resolved' },
];

interface Props {
  needs: CommunityNeed[];
  selectedNeedId?: string;
  onSelectNeed: (need: CommunityNeed) => void;
}

export default function PriorityQueue({ needs, selectedNeedId, onSelectNeed }: Props) {
  const [tab, setTab] = useState<NeedStatus>('open');

  const filtered = [...needs]
    .filter(n => n.status === tab)
    .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

  const counts: Record<NeedStatus, number> = {
    open: needs.filter(n => n.status === 'open').length,
    assigned: needs.filter(n => n.status === 'assigned').length,
    resolved: needs.filter(n => n.status === 'resolved').length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-4 pt-4 pb-0">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Needs Queue</h2>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 leading-none">
          {counts.open}
          <span className="text-base font-normal text-slate-400 ml-1">open</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mt-3 px-4">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 pb-2.5 mr-5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Needs list */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2">
        {filtered.map(need => {
          const isSelected = need.id === selectedNeedId;
          return (
            <button
              key={need.id}
              onClick={() => onSelectNeed(need)}
              className={`w-full text-left rounded-xl border transition-all overflow-hidden ${
                isSelected
                  ? 'border-blue-400 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className={`h-0.5 w-full ${SEV_BAR[need.severity]}`} />
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{NEED_ICON[need.need_type]}</span>
                    <span className="font-semibold text-slate-900 text-sm capitalize truncate">{need.need_type}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {need.escalated && (
                      <span className="text-xs animate-pulse" title="Escalated">🚨</span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold capitalize ${SEV_BADGE[need.severity]}`}>
                      {need.severity}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                  <span className="capitalize truncate">{need.location}</span>
                  <span>·</span>
                  <span>{need.affected_count} people</span>
                  <span>·</span>
                  <span className="shrink-0">{timeAgo(need.created_at)}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-400 italic truncate">
                  &ldquo;{need.raw_message.slice(0, 60)}{need.raw_message.length > 60 ? '…' : ''}&rdquo;
                </p>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="text-3xl mb-2">
              {tab === 'open' ? '✓' : tab === 'assigned' ? '📋' : '🎉'}
            </div>
            <p className="text-sm font-medium text-slate-400">
              {tab === 'open' ? 'No open needs' : tab === 'assigned' ? 'Nothing assigned yet' : 'Nothing resolved yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
