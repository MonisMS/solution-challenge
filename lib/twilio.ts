import twilio from 'twilio';

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  await getClient().messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: toNumber,
    body: message,
  });
}
