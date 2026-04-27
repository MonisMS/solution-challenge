'use client';

import { useEffect } from 'react';

interface Props {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const isSuccess = type === 'success';

  return (
    <div
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl shadow-slate-900/15 max-w-sm"
      style={{
        background: isSuccess ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.15)',
        borderColor: isSuccess ? 'rgba(5,150,105,0.4)' : 'rgba(220,38,38,0.4)',
      }}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isSuccess ? 'bg-emerald-100' : 'bg-red-100'}`}>
        {isSuccess ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        )}
      </div>
      <p className="text-sm font-medium text-slate-900 flex-1">{message}</p>
      <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}
