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
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h2 className="font-semibold text-slate-900">Situation Brief</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-7">
              {timeStr ? `Generated at ${timeStr}` : 'AI-generated summary by Gemini'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[100px]">
          {loading ? (
            <div className="flex items-center gap-3 text-slate-500">
              <svg className="animate-spin h-5 w-5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              <span className="text-sm">Gemini is analysing the current situation…</span>
            </div>
          ) : brief ? (
            <p className="text-slate-700 leading-relaxed text-sm">{brief}</p>
          ) : (
            <p className="text-slate-400 text-sm">Failed to generate brief. Please try again.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Refresh
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
