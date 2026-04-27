'use client';

import { useState } from 'react';
import type { Volunteer } from '@/lib/types';
import VolunteerCard from './VolunteerCard';

interface Props {
  volunteers: Volunteer[];
  onAddVolunteer: () => void;
}

export default function VolunteerList({ volunteers, onAddVolunteer }: Props) {
  const [search, setSearch]                   = useState('');
  const [filterAvailable, setFilterAvailable] = useState(false);

  const filtered = volunteers
    .filter(v => {
      if (filterAvailable && !v.available) return false;
      const q = search.toLowerCase();
      if (q && !v.name.toLowerCase().includes(q) && !v.ward.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => Number(b.available) - Number(a.available));

  const availableCount = volunteers.filter(v => v.available).length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">Network</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900 tracking-tight tabular-nums leading-none">
          {availableCount}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          available
          <span className="mx-2 text-slate-300">·</span>
          <span>{volunteers.length} registered</span>
        </p>
      </div>

      <div className="px-5 pb-3 flex items-center gap-3 border-b border-slate-200/70">
        <div className="flex-1 flex items-center gap-2 py-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ward…"
            className="flex-1 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
        </div>
        <button
          onClick={() => setFilterAvailable(f => !f)}
          className={`text-[11px] font-semibold transition-colors ${
            filterAvailable ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {filterAvailable ? '● Available' : 'All'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filtered.map(v => (
          <VolunteerCard key={v.id} volunteer={v} />
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <p className="text-sm font-semibold text-slate-700">
              {volunteers.length === 0 ? 'No volunteers yet' : 'No matches'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px] leading-relaxed">
              {volunteers.length === 0
                ? 'Register your first volunteer to start dispatching.'
                : 'Try a different name or ward.'}
            </p>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-slate-200/70">
        <button
          onClick={onAddVolunteer}
          className="w-full py-2.5 text-xs font-semibold tracking-wide bg-slate-900 hover:bg-slate-700 text-white rounded-full transition-colors"
        >
          + Add new volunteer
        </button>
      </div>
    </div>
  );
}
