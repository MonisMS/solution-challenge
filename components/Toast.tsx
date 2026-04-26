'use client';

import { useEffect } from 'react';

interface Props {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
