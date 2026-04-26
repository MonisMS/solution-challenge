import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  const snapshot = await adminDb.collection('needs').orderBy('created_at', 'desc').get();
  const needs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(needs);
}

export async function PATCH(request: NextRequest) {
  const { id, status, assigned_volunteer_id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (assigned_volunteer_id) update.assigned_volunteer_id = assigned_volunteer_id;

  await adminDb.collection('needs').doc(id).update(update);
  return NextResponse.json({ success: true });
}
