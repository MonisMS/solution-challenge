import Link from 'next/link';
import type { Volunteer } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

interface Props {
  volunteer: Volunteer;
}

export default function VolunteerCard({ volunteer: v }: Props) {
  return (
    <Link
      href={`/profile/${v.id}`}
      className="group block w-full px-5 py-3.5 hover:bg-slate-50/80 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar name={v.name} size="md" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
              v.available ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-900 truncate">{v.name}</span>
            {v.rating != null && (
              <span className="text-[11px] text-amber-600 font-medium shrink-0 tabular-nums">
                ★ {v.rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500 truncate">
            <span className="capitalize">{v.ward}</span>
            {v.skills.length > 0 && (
              <>
                <span className="mx-1.5 text-slate-300">·</span>
                <span className="capitalize">{v.skills.slice(0, 2).join(', ')}</span>
                {v.skills.length > 2 && <span className="text-slate-400"> +{v.skills.length - 2}</span>}
              </>
            )}
          </p>
        </div>

        <svg
          className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </Link>
  );
}
