import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { resolveWard } from '@/lib/wards';
import type { Volunteer } from '@/lib/types';

const SEED: Omit<Volunteer, 'id' | 'lat' | 'lng' | 'registered_at'>[] = [
  {
    name: 'Arjun Sharma',
    phone: '+919336754624',
    ward: 'dharavi',
    skills: ['food', 'water'],
    available: true,
    bio: 'Senior community volunteer with 3 years in disaster relief. Coordinates food distribution drives across Dharavi and manages a network of 50+ local helpers.',
    assignmentCount: 24,
    rating: 4.8,
    languages: ['Hindi', 'Marathi'],
  },
  {
    name: 'Dr. Priya Menon',
    phone: '+919876543210',
    ward: 'andheri',
    skills: ['medical'],
    available: true,
    bio: 'Registered nurse at Kokilaben Hospital. Specializes in emergency triage, first aid training, and has led medical camps across Mumbai during floods.',
    assignmentCount: 18,
    rating: 4.9,
    languages: ['Hindi', 'Malayalam', 'English'],
  },
  {
    name: 'Ravi Patil',
    phone: '+919876543211',
    ward: 'bandra',
    skills: ['shelter', 'food'],
    available: true,
    bio: 'Construction supervisor turned full-time relief volunteer. Expert in rapidly setting up temporary shelters and transitional housing for displaced families.',
    assignmentCount: 31,
    rating: 4.7,
    languages: ['Hindi', 'Marathi'],
  },
  {
    name: 'Sunita Desai',
    phone: '+919876543212',
    ward: 'kurla',
    skills: ['food', 'medical'],
    available: false,
    bio: 'Community organizer running a kitchen that feeds 200+ families daily. Trained in basic first aid and nutrition counseling for disaster-affected populations.',
    assignmentCount: 42,
    rating: 4.9,
    languages: ['Hindi', 'Gujarati', 'Marathi'],
  },
  {
    name: 'Mohammed Raza',
    phone: '+919876543213',
    ward: 'ghatkopar',
    skills: ['water', 'shelter'],
    available: true,
    bio: 'NGO field worker specializing in water purification and flood relief. Has worked across Maharashtra, Gujarat, and Bihar in major disaster operations.',
    assignmentCount: 15,
    rating: 4.6,
    languages: ['Hindi', 'Urdu', 'English'],
  },
  {
    name: 'Kavita Nair',
    phone: '+919876543214',
    ward: 'malad',
    skills: ['medical', 'other'],
    available: true,
    bio: 'Social worker and certified mental health counselor. Provides trauma support and psychological first aid during and after disaster relief operations.',
    assignmentCount: 9,
    rating: 4.8,
    languages: ['Hindi', 'Malayalam', 'English'],
  },
  {
    name: 'Deepak Joshi',
    phone: '+919876543215',
    ward: 'borivali',
    skills: ['shelter', 'water'],
    available: true,
    bio: 'Ex-army engineer with expertise in rapid infrastructure setup, water supply restoration, and structural safety assessments during flood emergencies.',
    assignmentCount: 37,
    rating: 4.7,
    languages: ['Hindi', 'English'],
  },
  {
    name: 'Ananya Singh',
    phone: '+919876543216',
    ward: 'powai',
    skills: ['food', 'other'],
    available: false,
    bio: 'Tech professional who volunteers on weekends. Manages logistics, supply chain coordination, and digital inventory tracking for large-scale relief operations.',
    assignmentCount: 11,
    rating: 4.5,
    languages: ['Hindi', 'English', 'Bengali'],
  },
  {
    name: 'Dr. Ramesh Kulkarni',
    phone: '+919876543217',
    ward: 'dadar',
    skills: ['medical', 'water'],
    available: true,
    bio: 'Retired government doctor with 30 years of experience. Has led medical teams in 5 major Maharashtra flood relief operations and is an expert in waterborne disease prevention.',
    assignmentCount: 58,
    rating: 4.9,
    languages: ['Hindi', 'Marathi', 'English'],
  },
  {
    name: 'Fatima Sheikh',
    phone: '+919876543218',
    ward: 'mankhurd',
    skills: ['food', 'shelter'],
    available: true,
    bio: 'Community leader in Mankhurd with deep trust networks across local institutions. Coordinates inter-community relief distribution and resource pooling.',
    assignmentCount: 29,
    rating: 4.8,
    languages: ['Hindi', 'Urdu', 'Marathi'],
  },
  {
    name: 'Vikram Tiwari',
    phone: '+919876543219',
    ward: 'mulund',
    skills: ['water', 'food'],
    available: true,
    bio: 'Licensed plumber and water supply specialist. First responder for flood-related water contamination, pipe repairs, and emergency water distribution setups.',
    assignmentCount: 16,
    rating: 4.6,
    languages: ['Hindi', 'Bhojpuri'],
  },
  {
    name: 'Neha Gupta',
    phone: '+919876543220',
    ward: 'santacruz',
    skills: ['medical', 'other'],
    available: true,
    bio: 'Registered pharmacist and certified first aid trainer. Manages medicine distribution, trains community health workers, and coordinates with hospital supply chains during crises.',
    assignmentCount: 22,
    rating: 4.7,
    languages: ['Hindi', 'English', 'Punjabi'],
  },
];

export async function POST() {
  const existing = await adminDb.collection('volunteers').limit(12).get();
  if (existing.size >= 12) {
    return NextResponse.json({ message: 'already_seeded', count: existing.size });
  }

  const batch = adminDb.batch();
  for (const v of SEED) {
    const coords = resolveWard(v.ward) ?? { lat: 19.0376, lng: 72.854 };
    const ref = adminDb.collection('volunteers').doc();
    batch.set(ref, { ...v, lat: coords.lat, lng: coords.lng, registered_at: Date.now() });
  }
  await batch.commit();

  return NextResponse.json({ message: 'seeded', count: SEED.length });
}
