import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { resolveWard } from '@/lib/wards';
import type { Volunteer } from '@/lib/types';

export async function GET() {
  const snapshot = await adminDb.collection('volunteers').get();
  const volunteers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(volunteers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const coords = resolveWard(body.ward) ?? { lat: 19.0376, lng: 72.854 };

  const volunteer: Omit<Volunteer, 'id'> = {
    name: body.name,
    phone: body.phone,
    skills: body.skills ?? [],
    ward: body.ward,
    lat: coords.lat,
    lng: coords.lng,
    available: true,
    registered_at: Date.now(),
    ...(body.bio && { bio: body.bio }),
    ...(body.languages?.length && { languages: body.languages }),
    assignmentCount: 0,
  };

  const ref = await adminDb.collection('volunteers').add(volunteer);
  return NextResponse.json({ id: ref.id, ...volunteer }, { status: 201 });
}
