import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CommunityNeed, Volunteer } from '@/lib/types';

export async function GET() {
  const [needsSnap, volsSnap] = await Promise.all([
    adminDb.collection('needs').get(),
    adminDb.collection('volunteers').get(),
  ]);

  const needs = needsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityNeed));
  const volunteers = volsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Volunteer));

  const open = needs.filter(n => n.status === 'open');
  const assigned = needs.filter(n => n.status === 'assigned');
  const resolved = needs.filter(n => n.status === 'resolved');
  const availableVols = volunteers.filter(v => v.available);

  const context = {
    totalNeeds: needs.length,
    open: open.length,
    assigned: assigned.length,
    resolved: resolved.length,
    availableVolunteers: availableVols.length,
    criticalUnattended: open.filter(n => n.severity === 'critical').length,
    highUnattended: open.filter(n => n.severity === 'high').length,
    openByType: Object.fromEntries(
      (['food', 'medical', 'shelter', 'water', 'other'] as const).map(t => [
        t, open.filter(n => n.need_type === t).length,
      ])
    ),
    hotspots: [...new Set(open.map(n => n.location))].slice(0, 5),
    recentMessages: open.slice(0, 3).map(n => n.raw_message.slice(0, 80)),
  };

  const fallbackBrief =
    `${context.open} open needs across ${context.hotspots.join(', ') || 'Mumbai'}. ` +
    `${context.criticalUnattended} critical unattended. ` +
    `${context.availableVolunteers} of ${volunteers.length} volunteers available.`;

  if (process.env.GEMINI_MOCK === 'true') {
    return NextResponse.json({ brief: fallbackBrief });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a situation analyst for an NGO disaster response team in Mumbai, India.
Based on the current field data below, write a concise 2-3 sentence situation brief for the coordinator.
Be specific: mention the most urgent areas, dominant need types, and whether volunteer capacity is sufficient.
Plain English only, no bullet points, no markdown formatting.

Data: ${JSON.stringify(context)}`;

    const result = await model.generateContent(prompt);
    const brief = result.response.text().trim();
    return NextResponse.json({ brief });
  } catch (err) {
    console.error('Gemini brief failed:', err);
    return NextResponse.json({ brief: fallbackBrief });
  }
}
