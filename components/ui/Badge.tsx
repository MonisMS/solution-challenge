import type { NeedSeverity, NeedStatus, NeedType } from '@/lib/types';

const SEVERITY_STYLE: Record<NeedSeverity, string> = {
  critical: 'bg-red-50 text-red-700 border border-red-200',
  high:     'bg-orange-50 text-orange-700 border border-orange-200',
  medium:   'bg-amber-50 text-amber-700 border border-amber-200',
  low:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const STATUS_STYLE: Record<NeedStatus, string> = {
  open:     'bg-blue-50 text-blue-700 border border-blue-200',
  assigned: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const SKILL_STYLE: Record<NeedType, string> = {
  food:    'bg-orange-50 text-orange-700 border border-orange-200',
  medical: 'bg-red-50 text-red-700 border border-red-200',
  shelter: 'bg-blue-50 text-blue-700 border border-blue-200',
  water:   'bg-cyan-50 text-cyan-700 border border-cyan-200',
  other:   'bg-slate-100 text-slate-700 border border-slate-200',
};

interface SeverityProps { severity: NeedSeverity }
interface StatusProps   { status: NeedStatus }
interface SkillProps    { skill: NeedType }

export function SeverityBadge({ severity }: SeverityProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${SEVERITY_STYLE[severity]}`}>
      {severity}
    </span>
  );
}

export function StatusBadge({ status }: StatusProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[status]}`}>
      {status}
    </span>
  );
}

export function SkillBadge({ skill }: SkillProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${SKILL_STYLE[skill]}`}>
      {skill}
    </span>
  );
}

export function LangBadge({ lang }: { lang: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {lang}
    </span>
  );
}
