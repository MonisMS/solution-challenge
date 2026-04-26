import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsApp } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json();
    if (!to || !message) {
      return NextResponse.json({ error: 'to and message are required' }, { status: 400 });
    }
    await sendWhatsApp(to, message);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Notify error:', err);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
