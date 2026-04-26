'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { collection, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CommunityNeed, Volunteer } from '@/lib/types';

import PriorityQueue from './PriorityQueue';
import NeedDetailPanel from './NeedDetailPanel';
import VolunteerPanel from './VolunteerPanel';
import VolunteerDrawer from './VolunteerDrawer';
import VolunteerProfileModal from './VolunteerProfileModal';
import AssignConfirmDialog from './AssignConfirmDialog';
import SituationBriefModal from './SituationBriefModal';
import Toast from './Toast';

const NeedMap = dynamic(() => import('./NeedMap'), { ssr: false });

const ESCALATION_POLL_MS = process.env.NEXT_PUBLIC_TEST_MODE === 'true' ? 30_000 : 60_000;

export default function Dashboard() {
  const [needs, setNeeds] = useState<CommunityNeed[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selectedNeed, setSelectedNeed] = useState<CommunityNeed | null>(null);
  const [assignTarget, setAssignTarget] = useState<{ need: CommunityNeed; volunteer: Volunteer } | null>(null);
  const [showVolunteerDrawer, setShowVolunteerDrawer] = useState(false);
  const [profileVolunteer, setProfileVolunteer] = useState<Volunteer | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  // Situation brief
  const [showBrief, setShowBrief] = useState(false);
  const [briefText, setBriefText] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefGeneratedAt, setBriefGeneratedAt] = useState<number | null>(null);

  // Real-time Firestore listeners
  useEffect(() => {
    const unsubNeeds = onSnapshot(collection(db, 'needs'), snap => {
      setNeeds(snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityNeed)));
    });
    const unsubVols = onSnapshot(collection(db, 'volunteers'), snap => {
      setVolunteers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Volunteer)));
    });
    return () => { unsubNeeds(); unsubVols(); };
  }, []);

  // Auto-seed volunteers if Firestore is empty
  useEffect(() => {
    fetch('/api/seed', { method: 'POST' }).catch(() => {});
  }, []);

  // Escalation polling
  useEffect(() => {
    const poll = () => fetch('/api/needs/escalate', { method: 'POST' }).catch(() => {});
    const timer = setInterval(poll, ESCALATION_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const handleSelectNeed = useCallback((need: CommunityNeed) => {
    setSelectedNeed(prev => prev?.id === need.id ? null : need);
  }, []);

  const handleInitiateAssign = useCallback((need: CommunityNeed, volunteer: Volunteer) => {
    setAssignTarget({ need, volunteer });
  }, []);

  const handleConfirmAssign = useCallback(async (message: string) => {
    if (!assignTarget) return;
    const { need, volunteer } = assignTarget;

    try {
      const [patchRes, notifyRes] = await Promise.all([
        fetch('/api/needs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: need.id, status: 'assigned', assigned_volunteer_id: volunteer.id }),
        }),
        fetch('/api/whatsapp/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: volunteer.phone, message }),
        }),
      ]);

      if (!patchRes.ok) throw new Error('Failed to update need');

      await updateDoc(doc(db, 'volunteers', volunteer.id), {
        available: false,
        assignmentCount: increment(1),
      });

      const notifyOk = notifyRes.ok;
      setToast({
        message: notifyOk
          ? `Assigned to ${volunteer.name} — WhatsApp sent ✓`
          : `Assigned to ${volunteer.name} (WhatsApp delivery failed)`,
        type: notifyOk ? 'success' : 'error',
      });
    } catch (err) {
      console.error('Assignment error:', err);
      setToast({ message: 'Assignment failed. Please try again.', type: 'error' });
    }

    setAssignTarget(null);
    setSelectedNeed(null);
  }, [assignTarget]);

  const handleToggleAvailability = useCallback(async (volunteerId: string, available: boolean) => {
    await updateDoc(doc(db, 'volunteers', volunteerId), { available });
  }, []);

  const handleResolve = useCallback(async (needId: string) => {
    const need = needs.find(n => n.id === needId);
    try {
      await fetch('/api/needs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: needId, status: 'resolved' }),
      });
      if (need?.assigned_volunteer_id) {
        await updateDoc(doc(db, 'volunteers', need.assigned_volunteer_id), { available: true });
      }
      setToast({ message: 'Need marked as resolved ✓', type: 'success' });
    } catch (err) {
      console.error('Resolve error:', err);
      setToast({ message: 'Failed to resolve need.', type: 'error' });
    }
    setSelectedNeed(null);
  }, [needs]);

  const handleFetchBrief = useCallback(async () => {
    setShowBrief(true);
    setBriefLoading(true);
    setBriefText(null);
    try {
      const res = await fetch('/api/needs/brief');
      if (!res.ok) throw new Error('Brief fetch failed');
      const data = await res.json();
      setBriefText(data.brief ?? null);
      setBriefGeneratedAt(Date.now());
    } catch {
      setBriefText(null);
    } finally {
      setBriefLoading(false);
    }
  }, []);

  const openCount = needs.filter(n => n.status === 'open').length;
  const criticalCount = needs.filter(n => n.status === 'open' && n.severity === 'critical').length;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">

      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">NGO Response Hub</p>
            <p className="text-xs text-slate-400 leading-none mt-0.5">Mumbai · Real-time</p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 text-sm">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-600 font-semibold">{criticalCount}</span>
              <span className="text-slate-400">critical</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-600 font-medium">{openCount}</span>
            <span className="text-slate-400">open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-slate-500 text-xs">Live</span>
          </div>
        </div>

        {/* Situation Brief */}
        <button
          onClick={handleFetchBrief}
          className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
        >
          <span>📋</span>
          <span>Situation Brief</span>
        </button>

        {/* Add volunteer */}
        <button
          onClick={() => setShowVolunteerDrawer(true)}
          className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 text-white px-3.5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Volunteer
        </button>
      </header>

      {/* Body — 3 panels */}
      <div className="flex flex-1 min-h-0">

        {/* Left — Needs queue / Need detail */}
        <div className="w-80 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          {selectedNeed ? (
            <NeedDetailPanel
              need={selectedNeed}
              volunteers={volunteers}
              onBack={() => setSelectedNeed(null)}
              onInitiateAssign={handleInitiateAssign}
              onResolve={handleResolve}
            />
          ) : (
            <PriorityQueue
              needs={needs}
              selectedNeedId={selectedNeed ? (selectedNeed as CommunityNeed).id : undefined}
              onSelectNeed={handleSelectNeed}
            />
          )}
        </div>

        {/* Center — Map */}
        <div className="flex-1 min-w-0 relative">
          <NeedMap
            needs={needs}
            volunteers={volunteers}
            selectedNeed={selectedNeed}
            onSelectNeed={handleSelectNeed}
            onInitiateAssign={handleInitiateAssign}
          />
        </div>

        {/* Right — Volunteer roster */}
        <div className="w-72 shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
          <VolunteerPanel
            volunteers={volunteers}
            onViewProfile={setProfileVolunteer}
            onAddVolunteer={() => setShowVolunteerDrawer(true)}
          />
        </div>
      </div>

      {/* Overlays */}
      {showVolunteerDrawer && (
        <VolunteerDrawer onClose={() => setShowVolunteerDrawer(false)} />
      )}

      {profileVolunteer && (
        <VolunteerProfileModal
          volunteer={profileVolunteer}
          onClose={() => setProfileVolunteer(null)}
          onToggleAvailability={handleToggleAvailability}
        />
      )}

      {assignTarget && (
        <AssignConfirmDialog
          need={assignTarget.need}
          volunteer={assignTarget.volunteer}
          onCancel={() => setAssignTarget(null)}
          onConfirm={handleConfirmAssign}
        />
      )}

      {showBrief && (
        <SituationBriefModal
          brief={briefText}
          loading={briefLoading}
          generatedAt={briefGeneratedAt}
          onClose={() => setShowBrief(false)}
          onRefresh={handleFetchBrief}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />
      )}
    </div>
  );
}
