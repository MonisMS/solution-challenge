import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendWhatsApp } from '@/lib/twilio';
import type { CommunityNeed } from '@/lib/types';

const ESCALATION_MS = process.env.NEXT_PUBLIC_TEST_MODE === 'true' ? 60_000 : 600_000;

export async function POST() {
  const coordinatorPhone = process.env.COORDINATOR_PHONE;
  if (!coordinatorPhone) {
    return NextResponse.json({ error: 'COORDINATOR_PHONE not set' }, { status: 500 });
  }

  const now = Date.now();
  const cutoff = now - ESCALATION_MS;

  const snap = await adminDb.collection('needs')
    .where('status', '==', 'open')
    .where('severity', '==', 'critical')
    .get();

  const toEscalate = snap.docs.filter(d => {
    const data = d.data() as CommunityNeed;
    return !data.escalated && data.created_at < cutoff;
  });

  for (const d of toEscalate) {
    const need = d.data() as CommunityNeed;
    const ageMin = Math.round((now - need.created_at) / 60_000);
    const msg =
      `🚨 *ESCALATION ALERT*\n` +
      `*${need.need_type.toUpperCase()}* need in *${need.location}*\n` +
      `${need.affected_count} people affected — critical, unattended for ${ageMin} min.\n` +
      `"${need.raw_message.slice(0, 100)}${need.raw_message.length > 100 ? '…' : ''}"`;

    await sendWhatsApp(coordinatorPhone, msg);
    await d.ref.update({ escalated: true, escalated_at: now });
  }

  return NextResponse.json({ escalated: toEscalate.length });
}
