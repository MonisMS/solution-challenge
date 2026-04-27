'use client';

import { useEffect, useState } from 'react';
import type { CommunityNeed } from '@/lib/types';

const NEED_ICON: Record<string, string> = {
  food: '🍱', medical: '🏥', shelter: '🏠', water: '💧', other: '📦',
};

const SEV_STYLE: Record<string, string> = {
  critical: 'border-red-300 bg-red-50',
  high:     'border-orange-300 bg-orange-50',
  medium:   'border-amber-300 bg-amber-50',
  low:      'border-emerald-300 bg-emerald-50',
};

const SEV_TEXT: Record<string, string> = {
  critical: 'text-red-600',
  high:     'text-orange-600',
  medium:   'text-amber-600',
  low:      'text-emerald-600',
};

interface Props {
  need: CommunityNeed;
  onDismiss: () => void;
  onView: () => void;
}

export default function AlertToast({ need, onDismiss, onView }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] w-80 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className={`rounded-2xl border ${SEV_STYLE[need.severity]} backdrop-blur-sm p-4 shadow-2xl shadow-slate-900/15`}>
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0">{NEED_ICON[need.need_type]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wide ${SEV_TEXT[need.severity]}`}>
                {need.severity} alert
              </span>
              {need.severity === 'critical' && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 capitalize">
              {need.need_type} need — {need.location}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">{need.affected_count} people affected</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 p-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { onView(); onDismiss(); }}
            className="flex-1 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            View & Assign
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
