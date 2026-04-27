'use client';

interface Props {
  brief: string | null;
  loading: boolean;
  generatedAt: number | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function SituationBriefModal({ brief, loading, generatedAt, onClose, onRefresh }: Props) {
  const timeStr = generatedAt
    ? new Date(generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 overflow-hidden">

        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-300 flex items-center justify-center text-sm">
                📋
              </div>
              <h2 className="font-semibold text-slate-900">Situation Brief</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 ml-9">
              {timeStr ? `Generated at ${timeStr}` : 'AI-generated summary by Gemini'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 min-h-[100px]">
          {loading ? (
            <div className="flex items-center gap-3 text-slate-600">
              <svg className="animate-spin h-5 w-5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
              </svg>
              <span className="text-sm">Gemini is analysing the current situation…</span>
            </div>
          ) : brief ? (
            <p className="text-sm text-slate-900 leading-relaxed">{brief}</p>
          ) : (
            <p className="text-sm text-slate-400">Failed to generate brief. Try again.</p>
          )}
        </div>

        <div className="px-6 pb-5 flex items-center justify-between border-t border-slate-200 pt-4">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
            Refresh
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 text-slate-900 rounded-xl hover:border-blue-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
