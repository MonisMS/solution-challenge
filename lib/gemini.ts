import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NeedExtraction, NeedType, NeedSeverity } from './types';

// Mock extraction using keyword matching — used when GEMINI_MOCK=true
function mockExtract(message: string): NeedExtraction {
  const msg = message.toLowerCase();

  const need_type: NeedType =
    msg.includes('food') || msg.includes('khana') || msg.includes('bhojan') ? 'food' :
    msg.includes('medical') || msg.includes('doctor') || msg.includes('hospital') || msg.includes('dawai') ? 'medical' :
    msg.includes('shelter') || msg.includes('ghar') || msg.includes('flood') || msg.includes('baarish') ? 'shelter' :
    msg.includes('water') || msg.includes('paani') || msg.includes('pani') ? 'water' :
    'other';

  const severity: NeedSeverity =
    msg.includes('urgent') || msg.includes('critical') || msg.includes('emergency') || msg.includes('jaldi') ? 'critical' :
    msg.includes('high') || msg.includes('bahut') || msg.includes('zyada') ? 'high' :
    msg.includes('medium') || msg.includes('thoda') ? 'medium' :
    'low';

  const countMatch = msg.match(/(\d+)\s*(log|logo|people|persons|families|family|ghar)/);
  const affected_count = countMatch ? parseInt(countMatch[1]) : 10;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { WARD_NAMES } = require('./wards');
  const location = WARD_NAMES.find((w: string) => msg.includes(w)) ?? 'dharavi';

  return { location, need_type, severity, affected_count };
}

// Strip markdown fences Gemini occasionally wraps JSON in
function parseGeminiJson(raw: string): NeedExtraction {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  return JSON.parse(cleaned) as NeedExtraction;
}

export async function extractNeed(rawMessage: string): Promise<NeedExtraction> {
  if (process.env.GEMINI_MOCK === 'true') {
    return mockExtract(rawMessage);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `You are a field report parser for an NGO disaster response system in Mumbai, India.
Extract from the WhatsApp message and return ONLY valid JSON matching this exact shape:
{ "location": "<ward name in English>", "need_type": "food|medical|shelter|water|other", "severity": "low|medium|high|critical", "affected_count": <integer> }
Rules:
- location must be a Mumbai ward name in English (e.g. "dharavi", "andheri", "bandra")
- If location is unclear, default to "dharavi"
- If affected_count is unclear, default to 10
- Handle Hindi, Hinglish, abbreviations, and informal text without punctuation
- Infer severity from urgency words even if not explicit
Message: "${rawMessage}"`;

  try {
    const result = await model.generateContent(prompt);
    return parseGeminiJson(result.response.text());
  } catch (err) {
    console.error('Gemini extraction failed, falling back to mock:', err);
    return mockExtract(rawMessage);
  }
}
