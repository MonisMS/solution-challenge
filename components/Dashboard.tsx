'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { collection, onSnapshot } from 'firebase/firestore';
import type L from 'leaflet';
import { db } from '@/lib/firebase';
import type { CommunityNeed, Volunteer, AppNotification } from '@/lib/types';

import IconRail from './layout/IconRail';
import NeedList from './needs/NeedList';
import NeedDetail from './needs/NeedDetail';
import VolunteerList from './volunteers/VolunteerList';
import StatsPanel from './map/StatsPanel';
import NeedContextCard from './map/NeedContextCard';
import MapControls from './map/MapControls';
import NotificationBell from './notifications/NotificationBell';
import AlertToast from './notifications/AlertToast';
import AssignConfirmDialog from './dialogs/AssignConfirmDialog';
import ContactVolunteerDialog from './dialogs/ContactVolunteerDialog';
import SituationBriefModal from './dialogs/SituationBriefModal';
import VolunteerDrawer from './dialogs/VolunteerDrawer';
import Toast from './Toast';

const NeedMap = dynamic(() => import('./map/NeedMap'), { ssr: false });

type ActivePanel = 'stats' | 'alerts' | 'volunteers' | null;

const ESCALATION_POLL_MS = process.env.NEXT_PUBLIC_TEST_MODE === 'true' ? 30_000 : 60_000;

export default function Dashboard() {
  const [needs, setNeeds]                 = useState<CommunityNeed[]>([]);
  const [volunteers, setVolunteers]       = useState<Volunteer[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedNeed, setSelectedNeed]   = useState<CommunityNeed | null>(null);
  const [assignTarget, setAssignTarget]   = useState<{ need: CommunityNeed; volunteer: Volunteer } | null>(null);
  const [alertNeed, setAlertNeed]         = useState<CommunityNeed | null>(null);
  const [activePanel, setActivePanel]     = useState<ActivePanel>('stats');
  const [showDrawer, setShowDrawer]       = useState(false);
  const [showResolved, setShowResolved]   = useState(true);
  const [toast, setToast]                 = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showBrief, setShowBrief]               = useState(false);
  const [briefText, setBriefText]               = useState<string | null>(null);
  const [briefLoading, setBriefLoading]         = useState(false);
  const [briefGeneratedAt, setBriefGeneratedAt] = useState<number | null>(null);
  const [detailNeed, setDetailNeed] = useState<CommunityNeed | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [contactTarget, setContactTarget] = useState<{ volunteer: Volunteer; context?: string } | null>(null);

  const prevNeedIds = useRef<Set<string>>(new Set());
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    const unsubNeeds = onSnapshot(collection(db, 'needs'), snap => {
      const incoming = snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityNeed));
      const newCritical = incoming.find(
        n => !prevNeedIds.current.has(n.id) && (n.severity === 'critical' || n.severity === 'high') && n.status === 'open'
      );
      if (newCritical) setAlertNeed(newCritical);
      prevNeedIds.current = new Set(incoming.map(n => n.id));
      setNeeds(incoming);
    });

    const unsubVols = onSnapshot(collection(db, 'volunteers'), snap => {
      setVolunteers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Volunteer)));
    });

    const unsubNotifs = onSnapshot(collection(db, 'notifications'), snap => {
      setNotifications(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() } as AppNotification))
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, 50)
      );
    });

    return () => { unsubNeeds(); unsubVols(); unsubNotifs(); };
  }, []);

  useEffect(() => {
    fetch('/api/seed', { method: 'POST' }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => fetch('/api/needs/escalate', { method: 'POST' }).catch(() => {}),
      ESCALATION_POLL_MS,
    );
    return () => clearInterval(t);
  }, []);

  const handleSelectNeed = useCallback((need: CommunityNeed) => {
    setSelectedNeed(prev => prev?.id === need.id ? null : need);
    setDetailNeed(null);
  }, []);

  const handleViewDetails = useCallback(() => {
    if (!selectedNeed) return;
    setDetailNeed(selectedNeed);
    setActivePanel('alerts');
  }, [selectedNeed]);

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
      setToast({
        message: notifyRes.ok
          ? `Assigned to ${volunteer.name} — WhatsApp sent ✓`
          : `Assigned to ${volunteer.name} (WhatsApp failed)`,
        type: notifyRes.ok ? 'success' : 'error',
      });
    } catch (err) {
      console.error('Assignment error:', err);
      setToast({ message: 'Assignment failed. Please try again.', type: 'error' });
    }
    setAssignTarget(null);
  }, [assignTarget]);

  const handleResolve = useCallback(async (needId: string) => {
    try {
      const res = await fetch('/api/needs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: needId, status: 'resolved' }),
      });
      if (!res.ok) throw new Error();
      setToast({ message: 'Need marked as resolved ✓', type: 'success' });
    } catch (err) {
      console.error('Resolve error:', err);
      setToast({ message: 'Failed to resolve need.', type: 'error' });
    }
    setSelectedNeed(null);
    setDetailNeed(null);
  }, []);

  const handleReassign = useCallback(async (needId: string) => {
    const need = needs.find(n => n.id === needId);
    const prevVol = need?.assigned_volunteer_id
      ? volunteers.find(v => v.id === need.assigned_volunteer_id)
      : null;
    try {
      const res = await fetch('/api/needs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: needId, status: 'open' }),
      });
      if (!res.ok) throw new Error();

      // Best-effort notify the released volunteer
      if (prevVol) {
        fetch('/api/whatsapp/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: prevVol.phone,
            message: `Update — your previous assignment has been reassigned. You're back on the available list. Thank you!`,
          }),
        }).catch(() => {});
      }

      setToast({ message: 'Volunteer released — pick another responder', type: 'success' });
    } catch (err) {
      console.error('Reassign error:', err);
      setToast({ message: 'Failed to release volunteer.', type: 'error' });
    }
  }, [needs, volunteers]);

  const handleSendCustomMessage = useCallback(async (message: string) => {
    if (!contactTarget) return;
    try {
      const res = await fetch('/api/whatsapp/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contactTarget.volunteer.phone, message }),
      });
      if (!res.ok) throw new Error();
      setToast({ message: `Message sent to ${contactTarget.volunteer.name} ✓`, type: 'success' });
    } catch (err) {
      console.error('Contact error:', err);
      setToast({ message: 'Failed to deliver message.', type: 'error' });
    }
    setContactTarget(null);
  }, [contactTarget]);

  const openContact = useCallback((volunteer: Volunteer, context?: string) => {
    setContactTarget({ volunteer, context });
  }, []);

  const handleFetchBrief = useCallback(async () => {
    setShowBrief(true);
    setBriefLoading(true);
    setBriefText(null);
    try {
      const res = await fetch('/api/needs/brief');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBriefText(data.brief ?? null);
      setBriefGeneratedAt(Date.now());
    } catch {
      setBriefText(null);
    } finally {
      setBriefLoading(false);
    }
  }, []);

  const handleMarkNotificationsRead = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }).catch(() => {});
  }, []);

  const openCount   = needs.filter(n => n.status === 'open').length;
  const resolvedCount = needs.filter(n => n.status === 'resolved').length;
  const unreadCount = notifications.filter(n => !n.read).length;

  const liveSelectedNeed = selectedNeed
    ? needs.find(n => n.id === selectedNeed.id) ?? selectedNeed
    : null;
  const liveDetailNeed = detailNeed
    ? needs.find(n => n.id === detailNeed.id) ?? detailNeed
    : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        <NeedMap
          needs={needs}
          selectedNeed={liveSelectedNeed}
          onSelectNeed={handleSelectNeed}
          showResolved={showResolved}
          onMapReady={setMapInstance}
        />
      </div>

      {/* Left icon rail */}
      <div className="absolute left-0 top-0 h-full z-30">
        <IconRail
          activePanel={activePanel}
          onTogglePanel={setActivePanel}
          openAlertCount={openCount}
          unreadNotifCount={unreadCount}
        />
      </div>

      {/* Slide-out side panel */}
      <div
        className={`absolute left-14 top-0 h-full z-20 ${
          activePanel ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid #e2e8f0',
          overflow: 'hidden',
          transition: 'width 420ms cubic-bezier(0.16, 1, 0.3, 1), opacity 320ms cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: activePanel ? '4px 0 24px rgba(15, 23, 42, 0.04)' : 'none',
        }}
      >
        <div className="w-80 h-full overflow-hidden flex flex-col">
          {activePanel === 'stats' && (
            <div className="p-3 overflow-y-auto flex-1">
              <StatsPanel needs={needs} volunteers={volunteers} />
            </div>
          )}
          {activePanel === 'alerts' && !liveDetailNeed && (
            <NeedList
              needs={needs}
              selectedNeedId={liveSelectedNeed?.id}
              onSelectNeed={handleSelectNeed}
            />
          )}
          {activePanel === 'alerts' && liveDetailNeed && (
            <NeedDetail
              need={liveDetailNeed}
              volunteers={volunteers}
              onBack={() => setDetailNeed(null)}
              onInitiateAssign={handleInitiateAssign}
              onResolve={handleResolve}
              onReassign={handleReassign}
              onContactVolunteer={openContact}
            />
          )}
          {activePanel === 'volunteers' && (
            <VolunteerList
              volunteers={volunteers}
              onAddVolunteer={() => setShowDrawer(true)}
            />
          )}
        </div>
      </div>

      {/* Top overlay bar */}
      <div
        className="absolute top-0 left-14 right-0 h-14 z-20 flex items-center justify-between px-5 gap-3 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(248,250,252,0.7) 0%, transparent 100%)' }}
      >
        {/* Left: filter pills */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowResolved(s => !s)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              showResolved
                ? 'bg-white/80 backdrop-blur-md border-slate-200 text-slate-600 hover:text-slate-900'
                : 'bg-blue-50 border-blue-300 text-blue-600'
            }`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {showResolved ? <path d="M20 6 9 17l-5-5"/> : <path d="M2 2l20 20M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>}
            </svg>
            {showResolved ? 'Show resolved' : 'Hidden'} <span className="opacity-60">({resolvedCount})</span>
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-600 font-semibold">Live</span>
          </div>

          <button
            onClick={handleFetchBrief}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 transition-colors"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}
          >
            📋 Brief
          </button>

          <NotificationBell notifications={notifications} onMarkRead={handleMarkNotificationsRead} />

          {/* Lime accent CTA */}
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0a1523] px-3.5 py-2 rounded-full transition-all hover:scale-[1.02]"
            style={{ background: '#c5f548', boxShadow: '0 4px 16px rgba(197, 245, 72, 0.3)' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Volunteer
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold">{volunteers.length}</span>
          </button>
        </div>
      </div>

      {/* Floating context card */}
      <div
        className="absolute right-4 z-20 pointer-events-none"
        style={{ top: '4rem', maxHeight: 'calc(100vh - 5rem)', overflowY: 'auto' }}
      >
        {liveSelectedNeed && (
          <div className="pointer-events-auto">
            <NeedContextCard
              key={liveSelectedNeed.id}
              need={liveSelectedNeed}
              volunteers={volunteers}
              onClose={() => { setSelectedNeed(null); setDetailNeed(null); }}
              onInitiateAssign={handleInitiateAssign}
              onResolve={handleResolve}
              onReassign={handleReassign}
              onContactVolunteer={openContact}
              onViewDetails={handleViewDetails}
            />
          </div>
        )}
      </div>

      {/* Map controls bottom-right */}
      <div className="absolute bottom-5 right-5 z-20">
        <MapControls map={mapInstance} />
      </div>

      {/* Overlays */}
      {showDrawer && <VolunteerDrawer onClose={() => setShowDrawer(false)} />}

      {assignTarget && (
        <AssignConfirmDialog
          need={assignTarget.need}
          volunteer={assignTarget.volunteer}
          onCancel={() => setAssignTarget(null)}
          onConfirm={handleConfirmAssign}
        />
      )}

      {contactTarget && (
        <ContactVolunteerDialog
          volunteer={contactTarget.volunteer}
          context={contactTarget.context}
          onCancel={() => setContactTarget(null)}
          onSend={handleSendCustomMessage}
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

      {alertNeed && (
        <AlertToast
          need={alertNeed}
          onDismiss={() => setAlertNeed(null)}
          onView={() => { setSelectedNeed(alertNeed); setAlertNeed(null); }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}
    </div>
  );
}
