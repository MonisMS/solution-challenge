import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { phone } = await request.json();
  if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 });

  const snapshot = await adminDb.collection('volunteers').get();
  const batch = adminDb.batch();
  snapshot.docs.forEach(doc => batch.update(doc.ref, { phone }));
  await batch.commit();

  return NextResponse.json({ updated: snapshot.size, phone });
}
