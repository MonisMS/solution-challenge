import type { CommunityNeed } from '@/lib/types';

const SEV_COLOR: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-amber-500',
  low:      'bg-emerald-500',
};

const SEV_TEXT: Record<string, string> = {
  critical: 'text-red-600',
  high:     'text-orange-600',
  medium:   'text-amber-600',
  low:      'text-emerald-600',
};

const STATUS_TEXT: Record<string, string> = {
  open:     'text-slate-500',
  assigned: 'text-cyan-600',
  resolved: 'text-emerald-600',
};

function timeAgo(ms: number): string {
  const d = Date.now() - ms;
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
  return `${Math.floor(d / 86_400_000)}d`;
}

interface Props {
  need: CommunityNeed;
  selected?: boolean;
  onClick: () => void;
}

export default function NeedCard({ need, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left relative pl-4 pr-3 py-3.5 transition-all duration-200 ${
        selected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
      }`}
    >
      <span
        className={`absolute left-0 top-3 bottom-3 rounded-full ${SEV_COLOR[need.severity]} transition-all duration-200 ${
          selected ? 'w-1' : 'w-0.5'
        }`}
      />

      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em]">
        <span className={SEV_TEXT[need.severity]}>{need.severity}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400 normal-case tracking-normal font-medium">{timeAgo(need.created_at)} ago</span>
        {need.escalated && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-red-600 animate-pulse tracking-wide">escalated</span>
          </>
        )}
        <span className={`ml-auto text-[10px] font-semibold normal-case tracking-normal ${STATUS_TEXT[need.status]}`}>
          {need.status === 'assigned' && '◐ '}
          {need.status === 'resolved' && '✓ '}
          {need.status}
        </span>
      </div>

      <h3 className="mt-1 text-[15px] font-bold text-slate-900 capitalize tracking-tight leading-snug">
        {need.need_type}{need.need_type === 'medical' ? ' emergency' : ' need'}
      </h3>

      <p className="mt-0.5 text-xs text-slate-500">
        <span className="capitalize">{need.location}</span>
        <span className="mx-1.5 text-slate-300">·</span>
        <span>{need.affected_count} affected</span>
      </p>

      <p className="mt-2 text-xs text-slate-400 italic leading-relaxed line-clamp-1">
        &ldquo;{need.raw_message}&rdquo;
      </p>
    </button>
  );
}
