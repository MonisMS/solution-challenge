import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase-admin';
import type { Volunteer } from '@/lib/types';
import VolunteerProfilePage from '@/components/profile/VolunteerProfilePage';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;

  const snap = await adminDb.collection('volunteers').doc(id).get();
  if (!snap.exists) notFound();

  const volunteer = { id: snap.id, ...snap.data() } as Volunteer;

  return <VolunteerProfilePage volunteer={volunteer} />;
}
