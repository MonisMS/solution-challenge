'use client';

import { useState } from 'react';
import type { CommunityNeed, Volunteer } from '@/lib/types';
import { scoreVolunteer } from '@/lib/matching';

const NEED_ICON: Record<string, string> = {
  food: '🍱', medical: '🏥', shelter: '🏠', water: '💧', other: '📦',
};

const SEV_STYLE: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  high: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  medium: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  low: 'bg-green-50 text-green-700 ring-1 ring-green-200',
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

interface Props {
  need: CommunityNeed;
  volunteer: Volunteer;
  onCancel: () => void;
  onConfirm: (message: string) => Promise<void>;
}

export default function AssignConfirmDialog({ need, volunteer, onCancel, onConfirm }: Props) {
  const defaultMsg =
    `Hi ${volunteer.name}! You've been matched to a ${need.need_type} emergency in ${need.location}. ` +
    `${need.affected_count} people are affected. Please head to the area as soon as possible. Thank you! 🙏`;

  const [message, setMessage] = useState(defaultMsg);
  const [loading, setLoading] = useState(false);
  const score = Math.round(scoreVolunteer(volunteer, need) * 100);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Confirm Assignment</h2>
              <p className="text-sm text-slate-500 mt-0.5">Review details before sending</p>
            </div>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 rounded-lg hover:bg-slate-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          {/* Need card */}
          <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl">
            <span className="text-xl mt-0.5">{NEED_ICON[need.need_type]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900 capitalize text-sm">{need.need_type} Need</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${SEV_STYLE[need.severity]}`}>
                  {need.severity}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {need.location} · {need.affected_count} people affected
              </p>
            </div>
          </div>

          {/* Volunteer card */}
          <div className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl">
            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold ${avatarColor(volunteer.name)}`}>
              {initials(volunteer.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm">{volunteer.name}</p>
              <p className="text-xs text-slate-500 capitalize">
                {volunteer.ward} · {volunteer.skills.join(', ')}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-blue-600">{score}%</p>
              <p className="text-xs text-slate-400">match</p>
            </div>
          </div>

          {/* WhatsApp preview */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
              WhatsApp Message
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed"
            />
            <p className="text-xs text-slate-400 mt-1">You can edit this message before sending.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !message.trim()}
            className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
                Sending…
              </>
            ) : 'Confirm & Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
