import { NextRequest } from 'next/server';

const PROMPT = `You are a USAF Aerospace Ground Equipment (AGE) expert and military logistics specialist with deep knowledge of NSN data, CAGE codes, and technical orders. Analyze the image and identify any aerospace ground support equipment, aircraft components, or military hardware.

Respond ONLY with a valid JSON object (no markdown fences, no explanation):
{
  "partName": "Official military part name",
  "nsn": "NSN in format XXXX-XX-XXX-XXXX using correct FSC/NIIN based on part type",
  "partNumber": "Manufacturer part number if visible or known",
  "cageCode": "5-char CAGE code of primary manufacturer if known",
  "confidence": 0.92,
  "description": "2-3 sentence technical description: what it is, its function, which aircraft/equipment systems it supports",
  "stockStatus": "In Stock",
  "unitPrice": "$X,XXX.XX approximate based on publicly available data or similar parts",
  "location": "Typical bin/storage location designation",
  "elmsNotes": "Any ELMS maintenance notes, inspection intervals, or post-installation requirements if applicable",
  "alternativeParts": [
    {"name": "Part name", "nsn": "XXXX-XX-XXX-XXXX", "compatibility": "100% Compatible - Direct Swap"}
  ],
  "technicalOrders": [
    {"number": "TO XX-X-XXX-X", "title": "Document title", "type": "pdf"},
    {"number": "TCTO XX-XXX", "title": "TCTO title", "type": "warning"}
  ]
}

Use real NSN data where possible. If uncertain, use the correct FSC class for the part type. If the image contains no identifiable military/aerospace hardware, set partName to "Unknown Equipment" and confidence to 0.1.`;

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, apiKey, model } = await request.json();

    const key = process.env.OPENROUTER_API_KEY || apiKey;
    if (!key) {
      return Response.json({ error: 'No API key provided' }, { status: 401 });
    }

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': request.headers.get('origin') || 'https://age-scout.app',
        'X-Title': 'AGE Scout',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            { type: 'text', text: PROMPT },
          ],
        }],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return Response.json(
        { error: (err as { error?: { message?: string } }).error?.message || `API error ${resp.status}` },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const raw: string = data.choices?.[0]?.message?.content || '';

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: 'AI response was not valid JSON' }, { status: 422 });
    }

    const part = JSON.parse(match[0]);
    return Response.json({ part });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
}
