import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { extractNeed } from '@/lib/gemini';
import { resolveWard } from '@/lib/wards';
import { adminDb } from '@/lib/firebase-admin';
import { sendWhatsApp } from '@/lib/twilio';
import type { CommunityNeed } from '@/lib/types';

function twimlOk() {
  return new NextResponse('<?xml version="1.0"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
    status: 200,
  });
}

function normalizePhone(raw: string): string {
  return raw.replace(/^whatsapp:/, '').trim();
}

async function handleVolunteerReply(phone: string, body: string): Promise<boolean> {
  const volSnap = await adminDb.collection('volunteers').where('phone', '==', phone).limit(1).get();
  if (volSnap.empty) return false;

  const volDoc = volSnap.docs[0];
  const volunteerId = volDoc.id;

  // Find their current active assignment
  const needSnap = await adminDb
    .collection('needs')
    .where('assigned_volunteer_id', '==', volunteerId)
    .where('status', '==', 'assigned')
    .limit(1)
    .get();

  if (needSnap.empty) {
    // They're a registered volunteer but no active task — treat as field report
    return false;
  }

  const needDoc = needSnap.docs[0];
  const msg = body.toLowerCase();

  // ETA shorthand: "eta 15 min"
  const etaMatch = msg.match(/\beta\s*(\d+)\s*min/i);
  if (etaMatch) {
    await needDoc.ref.update({ volunteer_eta: `${etaMatch[1]} min`, volunteer_reply: body.slice(0, 200) });
    await sendWhatsApp(phone, `✓ ETA noted: ${etaMatch[1]} minutes. Thank you!`);
    return true;
  }

  if (/\b(on my way|on the way|en route|coming|aa raha|aa rahi|nikal|nikla|chal raha|heading)\b/i.test(msg)) {
    await needDoc.ref.update({ volunteer_eta: 'En route', volunteer_reply: body.slice(0, 200) });
    await sendWhatsApp(phone, '✓ Got it — noted you\'re on the way!');
    return true;
  }

  if (/\b(arrived|reached|here|pahunch|pahuncha|aa gaya|aa gayi|on site)\b/i.test(msg)) {
    await needDoc.ref.update({ volunteer_eta: 'On site', volunteer_reply: body.slice(0, 200) });
    await sendWhatsApp(phone, '✓ Confirmed on site. Thank you for being there!');
    return true;
  }

  if (/\b(done|completed|finished|helped|help diya|kaam khatam|sorted|all good)\b/i.test(msg)) {
    // Auto-resolve need and free volunteer
    await needDoc.ref.update({ status: 'resolved' });
    await volDoc.ref.update({
      available: true,
      assignmentCount: FieldValue.increment(1),
    });
    await sendWhatsApp(phone, '✓ Excellent work! The need has been marked resolved. You\'re back on the available list.');
    return true;
  }

  if (/\b(can't|cannot|unable|nahi|nahin|nhi|won't|wont|skip|not available)\b/i.test(msg)) {
    // Reopen need and free volunteer
    await needDoc.ref.update({ status: 'open', assigned_volunteer_id: FieldValue.delete() });
    await volDoc.ref.update({ available: true });
    await sendWhatsApp(phone, '✓ Understood. We\'ll reassign this need. You\'re back on the available list.');
    return true;
  }

  // Unrecognised reply — log and prompt
  await needDoc.ref.update({ volunteer_reply: body.slice(0, 200) });
  await sendWhatsApp(
    phone,
    '✓ Message received. Reply with:\n• "on my way" / "arrived" / "done"\n• "eta 15 min"\n• "can\'t make it" to release the task',
  );
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const body = formData.get('Body') as string | null;
    const rawFrom = formData.get('From') as string | null;

    if (!body || !rawFrom) return twimlOk();

    const phone = normalizePhone(rawFrom);

    // Route to volunteer reply handler first
    const wasVolunteerReply = await handleVolunteerReply(phone, body);
    if (wasVolunteerReply) return twimlOk();

    // Field report flow
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
      source_phone: phone,
    };

    await adminDb.collection('needs').add(need);

    // Auto-reply confirmation to field worker
    const sevEmoji = extraction.severity === 'critical' ? '🚨' : extraction.severity === 'high' ? '⚠️' : '✓';
    const autoReply =
      `${sevEmoji} Report received! Logged a *${extraction.severity}* ${extraction.need_type} need in *${extraction.location}* for ~${extraction.affected_count} people. Our coordinator has been notified.`;
    await sendWhatsApp(phone, autoReply);
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
  }

  return twimlOk();
}
