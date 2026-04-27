'use client';

import { useState } from 'react';
import type { CommunityNeed, NeedStatus } from '@/lib/types';
import NeedCard from './NeedCard';

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const TABS: { key: NeedStatus; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'resolved', label: 'Resolved' },
];

const EMPTY_COPY: Record<NeedStatus, { title: string; subtitle: string }> = {
  open:     { title: 'All clear',         subtitle: 'No open alerts in the queue' },
  assigned: { title: 'Nothing assigned',  subtitle: 'Volunteers will appear here once dispatched' },
  resolved: { title: 'Awaiting outcomes', subtitle: 'Resolved needs will be archived here' },
};

interface Props {
  needs: CommunityNeed[];
  selectedNeedId?: string;
  onSelectNeed: (need: CommunityNeed) => void;
}

export default function NeedList({ needs, selectedNeedId, onSelectNeed }: Props) {
  const [tab, setTab] = useState<NeedStatus>('open');

  const counts: Record<NeedStatus, number> = {
    open:     needs.filter(n => n.status === 'open').length,
    assigned: needs.filter(n => n.status === 'assigned').length,
    resolved: needs.filter(n => n.status === 'resolved').length,
  };

  const filtered = [...needs]
    .filter(n => n.status === tab)
    .sort((a, b) => {
      const sev = SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
      return sev !== 0 ? sev : b.created_at - a.created_at;
    });

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">Alert queue</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900 tracking-tight tabular-nums leading-none">
          {counts[tab]}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          <span className="capitalize">{tab}</span>
          <span className="mx-2 text-slate-300">·</span>
          <span>{counts[tab] === 1 ? '1 alert' : `${counts[tab]} alerts`}</span>
        </p>
      </div>

      <div className="flex items-end gap-5 px-5 border-b border-slate-200/80">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative pb-3 text-xs font-semibold transition-colors ${
              tab === key ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`ml-1.5 tabular-nums font-bold ${tab === key ? 'text-slate-500' : 'text-slate-300'}`}>
                {counts[key]}
              </span>
            )}
            {tab === key && (
              <span className="absolute -bottom-px left-0 right-0 h-px bg-slate-900" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filtered.map(need => (
          <NeedCard
            key={need.id}
            need={need}
            selected={need.id === selectedNeedId}
            onClick={() => onSelectNeed(need)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700">{EMPTY_COPY[tab].title}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px] leading-relaxed">{EMPTY_COPY[tab].subtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
}
