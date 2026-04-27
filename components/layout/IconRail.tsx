'use client';

type Panel = 'stats' | 'alerts' | 'volunteers' | null;

const ICONS = {
  stats: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  alerts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  volunteers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  map: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  ),
};

interface Props {
  activePanel: Panel;
  onTogglePanel: (panel: Panel) => void;
  openAlertCount: number;
  unreadNotifCount: number;
}

export default function IconRail({ activePanel, onTogglePanel, openAlertCount, unreadNotifCount }: Props) {
  const items: { key: Panel; badge?: number; title: string }[] = [
    { key: 'stats',      title: 'Overview' },
    { key: 'alerts',     badge: openAlertCount,    title: 'Alerts' },
    { key: 'volunteers', badge: unreadNotifCount,  title: 'Volunteers' },
  ];

  return (
    <div
      className="flex flex-col items-center py-3 gap-1 h-full border-r border-slate-200"
      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', width: 56 }}
    >
      {/* Logo */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-2 shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      </div>

      <div className="w-8 h-px bg-slate-200 mb-1" />

      {items.map(({ key, badge, title }) => (
        <button
          key={key}
          title={title}
          onClick={() => onTogglePanel(activePanel === key ? null : key)}
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            activePanel === key
              ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm shadow-blue-200/50'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {ICONS[key as keyof typeof ICONS]}
          {badge != null && badge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </button>
      ))}

      <div className="w-8 h-px bg-slate-200 mt-1" />

      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-500/40">
        {ICONS.map}
      </div>

      <div className="flex-1" />

      <button
        title="Settings"
        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mb-1"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      {/* Avatar at bottom (operator profile) */}
      <button
        title="Coordinator"
        className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
      >
        OP
      </button>
    </div>
  );
}
