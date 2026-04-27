import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { resolveWard } from '@/lib/wards';
import type { Volunteer } from '@/lib/types';

const DAY = 86_400_000;

interface SeedVolunteer extends Omit<Volunteer, 'id' | 'lat' | 'lng' | 'registered_at'> {
  /** Days since registration — staggered so the roster feels like a real team */
  daysAgo: number;
}

const SEED: SeedVolunteer[] = [
  {
    name: 'Aarav Sharma',
    phone: '+919810045216',
    ward: 'dharavi',
    skills: ['food', 'water'],
    available: true,
    bio: 'Lead community organizer in Dharavi running daily kitchens for ~300 families. Trained in flood-safe water handling and ration coordination.',
    assignmentCount: 47,
    rating: 4.9,
    languages: ['Hindi', 'Marathi', 'English'],
    daysAgo: 412,
  },
  {
    name: 'Dr. Ayesha Khan',
    phone: '+919820112473',
    ward: 'bandra',
    skills: ['medical'],
    available: true,
    bio: 'Emergency medicine doctor at Holy Family Hospital. Triages mass-casualty events and runs first-aid drills for civic volunteers across Bandra.',
    assignmentCount: 33,
    rating: 4.95,
    languages: ['Hindi', 'Urdu', 'English'],
    daysAgo: 287,
  },
  {
    name: 'Vikram Kulkarni',
    phone: '+919819334562',
    ward: 'andheri',
    skills: ['shelter', 'water'],
    available: true,
    bio: 'Civil engineer with 12 years of monsoon-response experience. Sets up transitional shelters and certifies structural safety after building collapses.',
    assignmentCount: 52,
    rating: 4.8,
    languages: ['Marathi', 'Hindi', 'English'],
    daysAgo: 540,
  },
  {
    name: 'Sneha Iyer',
    phone: '+919833218841',
    ward: 'powai',
    skills: ['medical', 'other'],
    available: false,
    bio: 'Public-health researcher at IIT Powai. Coordinates outbreak surveillance and mental-health first aid for displaced families.',
    assignmentCount: 21,
    rating: 4.7,
    languages: ['Hindi', 'Tamil', 'English'],
    daysAgo: 95,
  },
  {
    name: 'Imran Qureshi',
    phone: '+919892014498',
    ward: 'mankhurd',
    skills: ['food', 'shelter'],
    available: true,
    bio: 'Mosque-committee volunteer running a 24×7 langar during emergencies. Strong network across Mankhurd and Govandi for last-mile distribution.',
    assignmentCount: 38,
    rating: 4.85,
    languages: ['Hindi', 'Urdu', 'Marathi'],
    daysAgo: 198,
  },
  {
    name: 'Pooja Deshmukh',
    phone: '+919869003721',
    ward: 'kurla',
    skills: ['food', 'medical'],
    available: true,
    bio: 'Registered nurse and ASHA worker. Runs maternal-health outreach in Kurla; among the first responders during the 2024 Mithi-river floods.',
    assignmentCount: 29,
    rating: 4.8,
    languages: ['Marathi', 'Hindi'],
    daysAgo: 365,
  },
  {
    name: 'Rohan Mehta',
    phone: '+919920556718',
    ward: 'malad',
    skills: ['water', 'other'],
    available: true,
    bio: 'Logistics manager who volunteers full-time during disasters. Specializes in supply-chain coordination and donor-vehicle dispatch in the western suburbs.',
    assignmentCount: 14,
    rating: 4.6,
    languages: ['Hindi', 'Gujarati', 'English'],
    daysAgo: 62,
  },
  {
    name: "Sister Maria D'Souza",
    phone: '+919892772341',
    ward: 'vileparle',
    skills: ['medical', 'shelter'],
    available: true,
    bio: 'Caritas-trained relief worker with the Bombay Archdiocese. Manages women & children shelters and post-trauma counselling in the western suburbs.',
    assignmentCount: 41,
    rating: 4.9,
    languages: ['English', 'Hindi', 'Konkani'],
    daysAgo: 720,
  },
  {
    name: 'Harpreet Singh',
    phone: '+919833114427',
    ward: 'borivali',
    skills: ['shelter', 'food'],
    available: true,
    bio: 'Gurudwara sevadar coordinating community kitchens that feed up to 1,500 people during disasters. Runs the volunteer roster for north-Mumbai gurudwaras.',
    assignmentCount: 56,
    rating: 4.85,
    languages: ['Punjabi', 'Hindi', 'English'],
    daysAgo: 480,
  },
  {
    name: 'Anjali Reddy',
    phone: '+919920884116',
    ward: 'worli',
    skills: ['medical', 'other'],
    available: false,
    bio: 'Paramedic with 108-Ambulance services. Specializes in cardiac and obstetric emergencies; trains new volunteers in trauma response.',
    assignmentCount: 18,
    rating: 4.7,
    languages: ['Hindi', 'Tamil', 'English'],
    daysAgo: 145,
  },
  {
    name: 'Farzad Mistry',
    phone: '+919819225014',
    ward: 'colaba',
    skills: ['water', 'shelter'],
    available: true,
    bio: 'Marine engineer-turned-volunteer. Operates rescue boats during coastal flooding and runs evacuation drills for south-Mumbai residential societies.',
    assignmentCount: 23,
    rating: 4.75,
    languages: ['Gujarati', 'Hindi', 'English'],
    daysAgo: 310,
  },
  {
    name: 'Meera Krishnan',
    phone: '+919892335779',
    ward: 'chembur',
    skills: ['food', 'other'],
    available: true,
    bio: 'Tech-sector volunteer who built and maintains the relief-network spreadsheet. Coordinates digital donation drives and live volunteer maps.',
    assignmentCount: 9,
    rating: 4.5,
    languages: ['Tamil', 'English', 'Hindi'],
    daysAgo: 28,
  },
];

export async function POST() {
  const existing = await adminDb.collection('volunteers').limit(SEED.length).get();
  if (existing.size >= SEED.length) {
    return NextResponse.json({ message: 'already_seeded', count: existing.size });
  }

  const now = Date.now();
  const batch = adminDb.batch();
  for (const { daysAgo, ...v } of SEED) {
    const coords = resolveWard(v.ward) ?? { lat: 19.0376, lng: 72.854 };
    const ref = adminDb.collection('volunteers').doc();
    batch.set(ref, {
      ...v,
      lat: coords.lat,
      lng: coords.lng,
      registered_at: now - daysAgo * DAY,
    });
  }
  await batch.commit();

  return NextResponse.json({ message: 'seeded', count: SEED.length });
}
