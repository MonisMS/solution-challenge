'use client';

import { useState } from 'react';
import type { Volunteer } from '@/lib/types';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
  'bg-indigo-500', 'bg-teal-500',
];

const SKILL_STYLE: Record<string, string> = {
  food: 'bg-orange-100 text-orange-700',
  medical: 'bg-red-100 text-red-700',
  shelter: 'bg-blue-100 text-blue-700',
  water: 'bg-cyan-100 text-cyan-700',
  other: 'bg-slate-100 text-slate-600',
};

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

interface Props {
  volunteers: Volunteer[];
  onToggleAvailability: (id: string, available: boolean) => void;
  onViewProfile: (v: Volunteer) => void;
  onAddVolunteer: () => void;
}

export default function VolunteerPanel({ volunteers, onToggleAvailability, onViewProfile, onAddVolunteer }: Props) {
  const [search, setSearch] = useState('');
  const [filterAvailable, setFilterAvailable] = useState(false);

  const filtered = volunteers
    .filter(v => {
      if (filterAvailable && !v.available) return false;
      if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.ward.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (b.available ? 1 : 0) - (a.available ? 1 : 0));

  const availableCount = volunteers.filter(v => v.available).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Volunteers</h2>
            <p className="text-2xl font-bold text-slate-900 mt-0.5 leading-none">
              {availableCount}
              <span className="text-base font-normal text-slate-400 ml-1">available</span>
            </p>
          </div>
          <button
            onClick={onAddVolunteer}
            className="mt-1 flex items-center gap-1 text-xs font-semibold bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="px-3 mt-3 space-y-2">
        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-2 bg-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search volunteers…"
            className="flex-1 text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
          />
        </div>
        <button
          onClick={() => setFilterAvailable(f => !f)}
          className={`w-full text-xs font-medium py-1.5 rounded-lg border transition-colors ${
            filterAvailable
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
          }`}
        >
          {filterAvailable ? '● Available only' : 'Show all volunteers'}
        </button>
      </div>

      <div className="h-px bg-slate-100 mt-3" />

      {/* Volunteer list */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1.5">
        {filtered.map(v => (
          <button
            key={v.id}
            onClick={() => onViewProfile(v)}
            className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2.5">
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(v.name)}`}>
                {initials(v.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold text-slate-900 truncate">{v.name}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${v.available ? 'bg-green-500' : 'bg-slate-300'}`} />
                </div>
                <p className="text-xs text-slate-500 capitalize truncate mt-0.5">{v.ward}</p>
              </div>
            </div>

            {/* Skills */}
            {v.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {v.skills.map(s => (
                  <span key={s} className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${SKILL_STYLE[s]}`}>
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            {(v.assignmentCount != null || v.rating != null) && (
              <div className="flex items-center gap-3 mt-2">
                {v.assignmentCount != null && (
                  <span className="text-xs text-slate-400">{v.assignmentCount} tasks</span>
                )}
                {v.rating != null && (
                  <span className="text-xs text-amber-500 font-medium">★ {v.rating.toFixed(1)}</span>
                )}
              </div>
            )}
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm font-medium text-slate-400">
              {volunteers.length === 0 ? 'No volunteers yet' : 'No matches'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
