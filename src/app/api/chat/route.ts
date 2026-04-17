import { NextRequest } from 'next/server';

const SYSTEM_MILITARY = `You are an expert USAF Aerospace Ground Equipment (AGE) technical advisor with deep knowledge of NSN data, military maintenance, technical orders, DLA supply chain, and CAGE codes.

You are helping a maintenance technician identify and procure AGE parts. You have context about a specific part they scanned. Help them refine the identification, answer technical questions, and provide real resource links.

When providing resource links, use this JSON structure in your response:
{
  "message": "Your helpful response text here",
  "links": [
    {"label": "DLA Aviation Parts Search", "url": "https://www.dla.mil/Aviation/", "type": "reference"},
    {"label": "NSN Lookup", "url": "https://www.nsn.com/", "type": "reference"},
    {"label": "Fed Logistics (FLIS)", "url": "https://www.logisticsinformationservice.dla.mil/", "type": "reference"},
    {"label": "Technical Orders Portal", "url": "https://www.e-publishing.af.mil/", "type": "manual"}
  ]
}

Always respond with valid JSON in that exact format. Include only relevant links. For purchase links use DLA, GSA Advantage, or known military suppliers. For manuals use e-publishing.af.mil, techrepo, or manufacturer sites.`;

const SYSTEM_CIVILIAN = `You are an expert civilian aviation Ground Support Equipment (GSE) technical advisor with deep knowledge of FAA regulations, ATA chapters, aircraft maintenance manuals, and aviation supply chains.

You are helping a technician identify and procure GSE parts or aircraft components. You have context about a specific part they scanned. Help them refine the identification, answer technical questions, and provide real resource links.

When providing resource links, use this JSON structure in your response:
{
  "message": "Your helpful response text here",
  "links": [
    {"label": "Aviall Parts Search", "url": "https://www.aviall.com/", "type": "purchase"},
    {"label": "Aircraft Spruce", "url": "https://www.aircraftspruce.com/", "type": "purchase"},
    {"label": "FAA Regulatory Guidance", "url": "https://rgl.faa.gov/", "type": "reference"},
    {"label": "FAA Airworthiness Directives", "url": "https://www.faa.gov/regulations_policies/airworthiness_directives/", "type": "manual"}
  ]
}

Always respond with valid JSON in that exact format. Include only relevant links. For manuals use manufacturer sites, FAA, or aviation reference databases. For purchase links use Aviall, Aircraft Spruce, or known aviation suppliers.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, part, apiKey, model, operationMode } = await request.json();

    const key = process.env.OPENROUTER_API_KEY || apiKey;
    if (!key) {
      return Response.json({ error: 'No API key provided' }, { status: 401 });
    }

    const systemPrompt = operationMode === 'civilian' ? SYSTEM_CIVILIAN : SYSTEM_MILITARY;

    const partContext = part ? `
The technician has already scanned and identified this part:
- Name: ${part.partName}
- ${operationMode === 'civilian' ? 'ATA/P/N' : 'NSN'}: ${part.nsn || 'N/A'}
- Part Number: ${part.partNumber || 'N/A'}
- ${operationMode === 'civilian' ? 'Manufacturer' : 'CAGE Code'}: ${part.cageCode || 'N/A'}
- Description: ${part.description || 'N/A'}
- Stock Status: ${part.stockStatus || 'N/A'}
- Unit Price: ${part.unitPrice || 'N/A'}
` : '';

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': request.headers.get('origin') || 'https://age-scout.app',
        'X-Title': 'AGE Scout',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt + partContext },
          ...messages,
        ],
        temperature: 0.3,
        max_tokens: 800,
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
      return Response.json({ message: raw, links: [] });
    }

    try {
      const parsed = JSON.parse(match[0]);
      return Response.json({ message: parsed.message || raw, links: parsed.links || [] });
    } catch {
      return Response.json({ message: raw, links: [] });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
}
