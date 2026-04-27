import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import type { CommunityNeed } from '@/lib/types';

export async function GET() {
  const snapshot = await adminDb.collection('needs').orderBy('created_at', 'desc').get();
  const needs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(needs);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as {
    id: string;
    status?: CommunityNeed['status'];
    assigned_volunteer_id?: string | null;
  };
  const { id, status, assigned_volunteer_id } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const needRef = adminDb.collection('needs').doc(id);
  const needSnap = await needRef.get();
  if (!needSnap.exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const prev = needSnap.data() as CommunityNeed;
  const prevVolId = prev.assigned_volunteer_id;

  const batch = adminDb.batch();
  const needUpdate: Record<string, unknown> = {};
  if (status) needUpdate.status = status;

  // Case 1: assigning a volunteer (status=assigned with id)
  if (status === 'assigned' && assigned_volunteer_id) {
    needUpdate.assigned_volunteer_id = assigned_volunteer_id;

    // Lock the new volunteer + bump count
    batch.update(adminDb.collection('volunteers').doc(assigned_volunteer_id), {
      available: false,
      assignmentCount: FieldValue.increment(1),
    });

    // If this is a reassignment, free the previous volunteer
    if (prevVolId && prevVolId !== assigned_volunteer_id) {
      batch.update(adminDb.collection('volunteers').doc(prevVolId), {
        available: true,
      });
    }
  }

  // Case 2: resolving — free the assigned volunteer
  if (status === 'resolved' && prevVolId) {
    batch.update(adminDb.collection('volunteers').doc(prevVolId), {
      available: true,
    });
  }

  // Case 3: explicit unassign (status=open after assigned, or assigned_volunteer_id=null)
  const isUnassign =
    (status === 'open' && prevVolId) ||
    (assigned_volunteer_id === null && prevVolId);

  if (isUnassign && prevVolId) {
    needUpdate.assigned_volunteer_id = FieldValue.delete();
    needUpdate.volunteer_eta = FieldValue.delete();
    needUpdate.volunteer_reply = FieldValue.delete();
    if (!status) needUpdate.status = 'open';
    batch.update(adminDb.collection('volunteers').doc(prevVolId), {
      available: true,
    });
  }

  if (Object.keys(needUpdate).length > 0) {
    batch.update(needRef, needUpdate);
  }

  await batch.commit();
  return NextResponse.json({ success: true });
}
