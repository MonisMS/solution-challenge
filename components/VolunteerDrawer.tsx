'use client';

import { useState } from 'react';
import { WARD_NAMES } from '@/lib/wards';

const SKILL_OPTIONS = ['food', 'medical', 'shelter', 'water', 'other'] as const;
const LANGUAGE_OPTIONS = ['Hindi', 'Marathi', 'English', 'Gujarati', 'Urdu', 'Malayalam', 'Bengali', 'Punjabi', 'Tamil'];

interface Props {
  onClose: () => void;
}

export default function VolunteerDrawer({ onClose }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">Add Volunteer</h2>
            <p className="text-xs text-slate-500 mt-0.5">Register to the response network</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">✓</div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Registered!</h3>
              <p className="text-sm text-slate-500 mt-1">
                To receive WhatsApp alerts, text{' '}
                <span className="font-mono font-semibold bg-slate-100 px-1 rounded">join bear-depth</span>
                {' '}to +1 415 523 8886
              </p>
            </div>
            <button onClick={onClose} className="mt-2 px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex-1 px-6 py-5 space-y-5">

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 col-span-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Full Name</span>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Arjun Sharma"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">WhatsApp Number</span>
                  <input
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 98765 43210"
                  />
                </label>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ward</span>
                  <select
                    required
                    value={ward}
                    onChange={e => setWard(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select…</option>
                    {WARD_NAMES.map(w => (
                      <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Skills</span>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSkills(toggle(skills, s))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                        skills.includes(s)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Languages</span>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map(l => (
                    <button
                      type="button"
                      key={l}
                      onClick={() => setLanguages(toggle(languages, l))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        languages.includes(l)
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bio <span className="normal-case font-normal text-slate-400">(optional)</span></span>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of your experience and background…"
                />
              </label>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
              >
                {loading ? 'Registering…' : 'Register Volunteer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
