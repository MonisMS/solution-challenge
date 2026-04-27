'use client';

import { useState } from 'react';
import type { Volunteer } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

const QUICK_MESSAGES = [
  "What's your ETA?",
  'Are you on site yet?',
  'Please send a status update.',
  'Need additional support?',
];

interface Props {
  volunteer: Volunteer;
  context?: string;
  onCancel: () => void;
  onSend: (message: string) => Promise<void>;
}

export default function ContactVolunteerDialog({ volunteer, context, onCancel, onSend }: Props) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await onSend(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl shadow-slate-900/20 overflow-hidden"
        style={{ animation: 'float-in 320ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={volunteer.name} size="md" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">Send WhatsApp</p>
                <h2 className="text-base font-bold text-slate-900 tracking-tight truncate mt-0.5">
                  {volunteer.name}
                </h2>
                <p className="text-xs text-slate-500 capitalize truncate">{volunteer.ward}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="-mr-1 -mt-1 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          {context && (
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              <span className="font-semibold text-slate-700">Re:</span> {context}
            </p>
          )}
        </div>

        {/* Quick suggestions */}
        <div className="px-6 pt-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2.5">Quick reply</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_MESSAGES.map(m => (
              <button
                key={m}
                onClick={() => setMessage(m)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Message body */}
        <div className="px-6 pt-5 pb-2">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] block mb-2">
            Your message
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            autoFocus
            placeholder="Type a message…"
            className="w-full text-sm text-slate-900 bg-transparent border-0 border-b border-slate-200 px-0 py-2 placeholder-slate-400 focus:outline-none focus:border-slate-900 resize-none leading-relaxed transition-colors"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="px-5 py-2 text-sm font-semibold bg-slate-900 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-full transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                </svg>
                Sending
              </>
            ) : 'Send →'}
          </button>
        </div>
      </div>
    </div>
  );
}
