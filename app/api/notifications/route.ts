import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  const snap = await adminDb
    .collection('notifications')
    .orderBy('created_at', 'desc')
    .limit(50)
    .get();

  const notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ notifications });
}

export async function PATCH(request: NextRequest) {
  const { ids } = await request.json() as { ids: string[] };

  const batch = adminDb.batch();
  for (const id of ids) {
    batch.update(adminDb.collection('notifications').doc(id), { read: true });
  }
  await batch.commit();

  return NextResponse.json({ ok: true });
}
