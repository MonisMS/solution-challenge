import { NextRequest, NextResponse } from 'next/server';
import { extractNeed } from '@/lib/gemini';
import { resolveWard } from '@/lib/wards';
import { adminDb } from '@/lib/firebase-admin';
import type { CommunityNeed } from '@/lib/types';

const TWIML_OK = new NextResponse('<?xml version="1.0"?><Response></Response>', {
  headers: { 'Content-Type': 'text/xml' },
  status: 200,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const body = formData.get('Body') as string | null;
    const from = formData.get('From') as string | null;

    if (!body) return TWIML_OK;

    const extraction = await extractNeed(body);
    const coords = resolveWard(extraction.location) ?? { lat: 19.0376, lng: 72.854 };

    const need: Omit<CommunityNeed, 'id'> = {
      raw_message: body,
      location: extraction.location,
      lat: coords.lat,
      lng: coords.lng,
      need_type: extraction.need_type,
      severity: extraction.severity,
      affected_count: extraction.affected_count,
      status: 'open',
      created_at: Date.now(),
      source_phone: from ?? 'unknown',
    };

    await adminDb.collection('needs').add(need);
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
  }

  return TWIML_OK;
}
