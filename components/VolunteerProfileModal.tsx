'use client';

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
  other: 'bg-slate-100 text-slate-700',
};

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}
function stars(rating: number) {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

interface Props {
  volunteer: Volunteer;
  onClose: () => void;
  onToggleAvailability: (id: string, available: boolean) => void;
}

export default function VolunteerProfileModal({ volunteer: v, onClose, onToggleAvailability }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Hero */}
        <div className="bg-slate-50 px-6 pt-6 pb-5 border-b border-slate-100">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md ${avatarColor(v.name)}`}>
              {initials(v.name)}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg leading-tight">{v.name}</h2>
              <p className="text-sm text-slate-500 capitalize mt-0.5">{v.ward}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${v.available ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${v.available ? 'bg-green-500' : 'bg-slate-400'}`} />
                  {v.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-96">
          {/* Bio */}
          {v.bio && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">About</p>
              <p className="text-sm text-slate-700 leading-relaxed">{v.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{v.assignmentCount ?? 0}</p>
              <p className="text-xs text-blue-600 mt-0.5">Assignments</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-amber-700">{v.rating?.toFixed(1) ?? '—'}</p>
              <p className="text-xs text-amber-600 mt-0.5">{v.rating ? stars(v.rating) : 'No rating'}</p>
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {v.skills.map(s => (
                <span key={s} className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${SKILL_STYLE[s]}`}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Languages */}
          {v.languages && v.languages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Languages</p>
              <div className="flex flex-wrap gap-1.5">
                {v.languages.map(l => (
                  <span key={l} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Contact</p>
            <p className="text-sm text-slate-700 font-mono">{v.phone}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={() => { onToggleAvailability(v.id, !v.available); onClose(); }}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              v.available
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Mark {v.available ? 'Unavailable' : 'Available'}
          </button>
          <button onClick={onClose} className="text-sm px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
