'use client';

import Link from 'next/link';
import type { Volunteer } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

const SKILL_COPY: Record<string, string> = {
  food:    'Food distribution',
  medical: 'Medical aid',
  shelter: 'Shelter & housing',
  water:   'Water & sanitation',
  other:   'General response',
};

function timeAgo(ms: number): string {
  const d = Date.now() - ms;
  const days = Math.floor(d / 86_400_000);
  if (days === 0) return 'today';
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

interface Props {
  volunteer: Volunteer;
}

export default function VolunteerProfilePage({ volunteer: v }: Props) {
  const role =
    v.skills.includes('medical') ? 'Medical responder' :
    v.skills.includes('shelter') ? 'Shelter coordinator' :
    v.skills.includes('food')    ? 'Food distribution lead' :
    v.skills.includes('water')   ? 'Water & sanitation lead' :
    'Field volunteer';

  return (
    <div className="min-h-screen relative">
      <div className="px-8 py-5 flex items-center justify-between border-b border-slate-200/70">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Dashboard
        </Link>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">Volunteer profile</span>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">

        {/* Hero — typography only */}
        <div className="flex items-start gap-6">
          <Avatar name={v.name} size="xl" />
          <div className="flex-1 pt-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">{role}</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900 tracking-tight leading-none">{v.name}</h1>
            <p className="mt-3 text-base text-slate-600">
              <span className="capitalize">{v.ward}</span>, Mumbai
              <span className="mx-2 text-slate-300">·</span>
              <span>Joined {timeAgo(v.registered_at)}</span>
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${v.available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className={`font-semibold ${v.available ? 'text-emerald-700' : 'text-slate-500'}`}>
                {v.available ? 'Available for dispatch' : 'Currently unavailable'}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200/70 my-10" />

        {/* Two-column body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10">
          <div className="md:col-span-2 space-y-10">
            {v.bio && (
              <section>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-3">About</p>
                <blockquote className="relative pl-6">
                  <span className="absolute left-0 -top-2 text-4xl text-slate-300 leading-none font-serif select-none">&ldquo;</span>
                  <p className="text-lg text-slate-700 italic leading-relaxed font-light">
                    {v.bio}
                  </p>
                </blockquote>
              </section>
            )}

            {v.skills.length > 0 && (
              <section>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-4">Areas of expertise</p>
                <ul className="divide-y divide-slate-100">
                  {v.skills.map(s => (
                    <li key={s} className="py-3 flex items-baseline">
                      <span className="text-base font-medium text-slate-900 capitalize">{s}</span>
                      <span className="mx-3 text-slate-300">—</span>
                      <span className="text-sm text-slate-500">{SKILL_COPY[s]}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {v.languages && v.languages.length > 0 && (
              <section>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-3">Speaks</p>
                <p className="text-base text-slate-700">
                  {v.languages.map((lang, i) => (
                    <span key={lang}>
                      {lang}
                      {i < v.languages!.length - 1 && <span className="mx-2 text-slate-300">·</span>}
                    </span>
                  ))}
                </p>
              </section>
            )}
          </div>

          <aside className="space-y-8 md:pt-1">
            <section>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-4">At a glance</p>
              <dl className="space-y-4">
                <div>
                  <dd className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums leading-none">
                    {v.assignmentCount ?? 0}
                  </dd>
                  <dt className="text-xs text-slate-500 mt-1.5">Tasks completed</dt>
                </div>
                <div>
                  <dd className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums leading-none flex items-baseline gap-2">
                    {v.rating ? v.rating.toFixed(1) : '—'}
                    {v.rating && <span className="text-sm text-amber-500">★</span>}
                  </dd>
                  <dt className="text-xs text-slate-500 mt-1.5">Coordinator rating</dt>
                </div>
                <div>
                  <dd className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums leading-none">
                    {v.skills.length}
                  </dd>
                  <dt className="text-xs text-slate-500 mt-1.5">Skill areas</dt>
                </div>
              </dl>
            </section>

            <div className="h-px bg-slate-200/70" />

            <section>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-4">Reach</p>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">WhatsApp</p>
                  <a
                    href={`https://wa.me/${v.phone.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noopener"
                    className="text-sm font-mono text-slate-900 hover:text-emerald-600 transition-colors"
                  >
                    {v.phone}
                  </a>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Operating ward</p>
                  <p className="text-sm text-slate-900 capitalize">{v.ward}, Mumbai</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Joined</p>
                  <p className="text-sm text-slate-900">{timeAgo(v.registered_at)}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
