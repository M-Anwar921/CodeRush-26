const Groq = require('groq-sdk');

let _client = null;
function client() {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
}

const SYSTEM_PROMPT = `You are an emergency dispatch parser for a maritime crisis system.
A ship captain has sent a free-form distress message. Extract structured information.

Return ONLY valid JSON in this exact shape — no prose, no markdown, no commentary:
{
  "severity": "low" | "medium" | "high" | "critical",
  "issueType": string (short tag, e.g. "fire", "engine failure", "collision", "medical", "piracy", "flooding", "grounding"),
  "injuredCount": number (0 if not specified),
  "damageEstimate": string (one short phrase),
  "recommendedAction": string (one sentence)
}

Severity guide:
- low: minor issue, ship operable
- medium: significant problem, transit possible with caution
- high: emergency, immediate response needed
- critical: imminent loss of vessel or life`;

const FALLBACK = {
  severity:          'medium',
  issueType:         'unparsed',
  injuredCount:      0,
  damageEstimate:    '—',
  recommendedAction: 'Manual review required',
};

const VALID_SEVERITY = ['low', 'medium', 'high', 'critical'];

async function parseDistress(text) {
  if (!process.env.GROQ_API_KEY) {
    return { ...FALLBACK, damageEstimate: 'GROQ_API_KEY missing' };
  }

  try {
    const completion = await client().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 400,
    });

    const raw    = completion.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    return {
      severity:          VALID_SEVERITY.includes(parsed.severity) ? parsed.severity : 'medium',
      issueType:         String(parsed.issueType || 'unknown').slice(0, 60),
      injuredCount:      Math.max(0, Number(parsed.injuredCount) || 0),
      damageEstimate:    String(parsed.damageEstimate || '—').slice(0, 200),
      recommendedAction: String(parsed.recommendedAction || 'Assess and respond').slice(0, 240),
    };
  } catch (err) {
    console.error('[ai/distress] parse failed:', err.message);
    return { ...FALLBACK };
  }
}

module.exports = { parseDistress };
