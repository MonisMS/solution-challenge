'use client';

import { useState } from 'react';
import type { CommunityNeed, Volunteer } from '@/lib/types';
import { SeverityBadge, SkillBadge } from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { scoreVolunteer } from '@/lib/matching';

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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-semibold text-slate-900">Confirm Assignment</h2>
            <p className="text-xs text-slate-400 mt-0.5">Review before sending WhatsApp</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Need */}
          <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xl mt-0.5">
              {{ food: '🍱', medical: '🏥', shelter: '🏠', water: '💧', other: '📦' }[need.need_type]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 capitalize">{need.need_type} Need</span>
                <SeverityBadge severity={need.severity} />
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{need.location} · {need.affected_count} people</p>
            </div>
          </div>

          {/* Volunteer */}
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <Avatar name={volunteer.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{volunteer.name}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {volunteer.skills.map(s => <SkillBadge key={s} skill={s} />)}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-blue-600">{score}%</p>
              <p className="text-[10px] text-slate-400">match</p>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">
              WhatsApp Message
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 resize-none focus:outline-none focus:border-blue-400 leading-relaxed placeholder-slate-400"
            />
            <p className="text-xs text-slate-400 mt-1">Edit the message before sending.</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !message.trim()}
            className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                </svg>
                Sending…
              </>
            ) : 'Confirm & Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
