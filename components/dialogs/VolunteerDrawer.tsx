'use client';

import { useState } from 'react';
import { WARD_NAMES } from '@/lib/wards';
import Avatar from '@/components/ui/Avatar';

const SKILL_OPTIONS = [
  { key: 'food',    label: 'Food',    desc: 'Distribution & rations' },
  { key: 'medical', label: 'Medical', desc: 'First aid & health' },
  { key: 'shelter', label: 'Shelter', desc: 'Housing & evacuation' },
  { key: 'water',   label: 'Water',   desc: 'Water & sanitation' },
  { key: 'other',   label: 'General', desc: 'Other field tasks' },
] as const;

const LANGUAGE_OPTIONS = ['Hindi', 'Marathi', 'English', 'Gujarati', 'Urdu', 'Malayalam', 'Bengali', 'Punjabi', 'Tamil'];

interface Props {
  onClose: () => void;
}

export default function VolunteerDrawer({ onClose }: Props) {
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [ward, setWard]           = useState('');
  const [skills, setSkills]       = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [bio, setBio]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, ward, skills, languages, bio }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || 'Registration failed. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full text-base text-slate-900 bg-transparent border-0 border-b border-slate-200 px-0 py-2.5 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors';

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md h-full flex flex-col shadow-2xl shadow-slate-900/20 overflow-hidden"
        style={{
          background: '#ffffff',
          animation: 'slide-in-right 420ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >

        <div className="flex items-center justify-between px-7 pt-6 pb-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">New volunteer</p>
          <button
            onClick={onClose}
            className="-mr-2 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-10 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to the network</h3>
              <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                To start receiving WhatsApp dispatches, text{' '}
                <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">join bear-depth</span>
                {' '}to <span className="font-mono text-slate-700">+1 415 523 8886</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-3 px-7 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-full font-semibold text-sm transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">

            <div className="px-7 pb-6">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                Add a volunteer
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Bring someone new into the response network.
              </p>

              {/* Live preview */}
              <div className="mt-6 flex items-center gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <div className={`transition-all duration-300 ${name ? 'opacity-100' : 'opacity-50'}`}>
                  <Avatar name={name || 'New Volunteer'} size="lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-slate-900 truncate">
                    {name || <span className="text-slate-400 font-normal italic">Volunteer name</span>}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize truncate">
                    {ward || <span className="italic">No ward selected</span>}
                  </p>
                  {skills.length > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1 capitalize truncate">
                      {skills.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-7 pb-4">

              <Section label="01" title="Identity">
                <div className="space-y-5">
                  <Field label="Full name">
                    <input
                      required
                      autoFocus
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Aditya Sharma"
                    />
                  </Field>

                  <Field label="WhatsApp number">
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className={inputClass}
                      placeholder="+91 98765 43210"
                    />
                  </Field>

                  <Field label="Operating ward">
                    <select
                      required
                      value={ward}
                      onChange={e => setWard(e.target.value)}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">Select a ward…</option>
                      {WARD_NAMES.map(w => (
                        <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Section>

              <Section label="02" title="Capabilities">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-3">Skill areas</p>
                  <div className="space-y-1.5">
                    {SKILL_OPTIONS.map(({ key, label, desc }) => {
                      const active = skills.includes(key);
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setSkills(toggle(skills, key))}
                          className={`group w-full flex items-center justify-between text-left px-3 py-2.5 -mx-3 rounded-lg transition-colors ${
                            active ? 'bg-blue-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-medium ${active ? 'text-blue-700' : 'text-slate-900'}`}>{label}</p>
                            <p className={`text-xs mt-0.5 ${active ? 'text-blue-600/70' : 'text-slate-500'}`}>{desc}</p>
                          </div>
                          <span
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                              active ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-slate-400'
                            }`}
                          >
                            {active && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <path d="M20 6 9 17l-5-5"/>
                              </svg>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-7">
                  <p className="text-[11px] font-semibold text-slate-500 mb-3">Languages spoken</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUAGE_OPTIONS.map(l => {
                      const active = languages.includes(l);
                      return (
                        <button
                          type="button"
                          key={l}
                          onClick={() => setLanguages(toggle(languages, l))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            active
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Section>

              <Section label="03" title="Background" optional>
                <Field label="A few words about this volunteer">
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none leading-relaxed`}
                    placeholder="Experience, training, languages, anything useful…"
                  />
                </Field>
              </Section>

              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg border border-red-100">{error}</p>
              )}
            </div>

            <div className="px-7 pt-4 pb-6 flex items-center gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name || !phone || !ward}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-full font-semibold text-sm transition-colors"
              >
                {loading ? 'Registering…' : 'Register volunteer →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Section({
  label, title, optional, children,
}: { label: string; title: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="py-7 border-b border-slate-100 last:border-0">
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-[11px] font-mono font-bold text-slate-400">{label}</span>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        {optional && (
          <span className="text-[10px] text-slate-400 italic">optional</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-slate-500 block mb-0">{label}</span>
      {children}
    </label>
  );
}
