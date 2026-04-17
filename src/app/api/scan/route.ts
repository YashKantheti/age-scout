import { NextRequest } from 'next/server';

const KNOWN_AGE_TOS = `
KNOWN AGE TECHNICAL ORDER SERIES — only cite from this list or numbers visible in the image. If no match, leave technicalOrders as [].
- MC-7 Air Compressor: T.O. 35C2-3-1-5 (O&S), T.O. 35C2-3-512 (IPB)
- MC-2A Air Compressor: T.O. 35C2-3-1-81
- A/M32A-86A Generator Set: T.O. 35C3-3-1-481
- NC-8A/B Generator: T.O. 35C3-3-521
- MJ-1B Munitions Lift Truck: T.O. 38G2-5-1 (O&S), T.O. 38G2-5-21 (IPB)
- MD-3A / MD-3M Tow Tractor: T.O. 38G2-100-1
- HARTS Hydraulic Actuator Repair Test Stand: T.O. 35E4-57-11
- B-5 Maintenance Stand: T.O. 35A5-4-17-1
- A/M27T-5 Hydraulic Test Stand: T.O. 35E7-2-9-1
- MHU-83/L Munitions Handling Trailer: T.O. 11A-1-46
- General AGE Maintenance: T.O. 35-1-3`;


const MILITARY_PROMPT = `You are a USAF Aerospace Ground Equipment (AGE) expert. Your job is to identify parts from images accurately and conservatively.

ACCURACY RULES:
1. Never invent NSNs or part numbers not visible in the image. Use FSC + "XX-XXX-XXXX" if NSN is not readable.
2. For T.O.s: cite the most relevant T.O.s you know for this equipment type. Use the reference list below as a starting point. Set verified=true if from the known list or visible in the image; verified=false if you are inferring based on equipment type.
3. In confirmedFromImage: list only fields literally readable in the image.
4. In dataWarnings: note fields you are estimating.

${KNOWN_AGE_TOS}

STEP 1 — Image quality: confidence ≤ 0.15 if dark/blurry/no hardware.

STEP 2 — Identify: read all visible text first. Match to AGE categories: compressors, generators, tow bars, hydraulic equipment, fuel servicing, lighting, munitions support.

STEP 3 — Identify the parent assembly. Use specific model designations (e.g. "MC-7", "A/M32A-86A", "NC-8A/B", "MD-3A") — never generic labels like "Air Compressor" alone. Cross-reference visible markings, NSNs, and the known T.O. list above. If uncertain between models, list all candidates in possibleEquipment and set the most likely one in identifiedAssembly.

STEP 4 — Respond ONLY with valid JSON (no markdown, no explanation outside the JSON):
{
  "partName": "Official military nomenclature (e.g. COMPRESSOR, AIR, ROTARY)",
  "nsn": "4-digit FSC + XX-XXX-XXXX if not visible; exact NSN only if readable in image",
  "modelNumber": "Exact model/part number if visible; else best known model for this equipment",
  "cageCode": "5-char CAGE if visible or well-known for this manufacturer; else empty string",
  "confidence": 0.0,
  "description": "What it is, its AGE function, aircraft/systems it supports. State which markings used for ID.",
  "stockStatus": "Unknown",
  "unitPrice": "See DLA for FSC XXXX pricing",
  "location": "Typical bin/cage storage designation",
  "elmsNotes": "Inspection interval or maintenance requirement for this equipment type; else empty string",
  "identifiedAssembly": {
    "model": "Specific model designation (e.g. MC-7, A/M32A-86A, NC-8A/B) — never generic",
    "name": "Full assembly name with model (e.g. MC-7 Air Compressor)",
    "confidence": "high | medium | low"
  },
  "ipbReference": {
    "toNumber": "Most relevant T.O. for this equipment's IPB; empty string if unknown",
    "figure": "Typical figure number if known; else empty string",
    "item": "Typical item number if known; else empty string",
    "title": "Figure description; else empty string"
  },
  "confirmedFromImage": ["fields", "readable", "from", "image"],
  "dataWarnings": ["NSN estimated from FSC — verify in FEDLOG", "T.O.s are suggested based on equipment type — confirm in e-Publishing before use"],
  "possibleEquipment": [
    {"name": "Full name with specific model (e.g. MC-7 Air Compressor)", "role": "How this part fits"}
  ],
  "alternativeParts": [
    {"name": "Part name", "nsn": "NSN if known", "compatibility": "Compatibility note"}
  ],
  "technicalOrders": [
    {"number": "Most relevant T.O. for this equipment", "title": "Document title", "type": "pdf", "verified": true},
    {"number": "Additional related T.O.", "title": "Title", "type": "pdf", "verified": false}
  ]
}

Confidence: 0.9+ = part number/NSN confirmed from image; 0.7–0.89 = clear equipment type, no visible P/N; 0.4–0.69 = probable type; 0.15–0.39 = poor image/ambiguous; <0.15 = cannot identify.`;

// Real civilian GSE manual references
const KNOWN_CIVILIAN_MANUALS = `
KNOWN REAL GSE/AVIATION MANUAL SERIES (only reference these or numbers visible in image):
- Boeing 737NG AMM: D6-38278 series (ATA chapters 12, 29, 32, etc.)
- Boeing 737 MAX AMM: D626T001 series
- Airbus A320 AMM: AI/MA-A320 series (by ATA chapter)
- Airbus A320 IPC: AI/MA-A320-IPC series
- Hobart GPU 400Hz: Hobart Brothers service manuals (model-specific)
- ITW GSE GPU: ITW GSE 7400 / 2400 series manuals
- Tronair Hydraulic Test Stand: Tronair P/N series (01-1442-0000, etc.)
- JBT (FMC) Aircraft Tow Tractors: JBT Aero service manuals
- Cavotec GPU: Cavotec SA technical manuals
- FAA ADs: search registry.faa.gov/ADPORTAL/
If the equipment does not match these, omit the manual reference rather than guessing.`;

const CIVILIAN_PROMPT = `You are a commercial aviation GSE (Ground Support Equipment) and aircraft maintenance expert. Identify parts and suggest relevant manuals based on your knowledge.

ACCURACY RULES:
1. Never invent part numbers not visible in the image.
2. For manuals: cite the most relevant AMM sections, IPCs, or service manuals you know for this equipment type. Use the reference list below as a starting point. Set verified=true if from the known list or visible in the image; verified=false if inferred from equipment type.
3. In confirmedFromImage: list only fields literally readable in the image.
4. In dataWarnings: note fields you are estimating.

${KNOWN_CIVILIAN_MANUALS}

STEP 1 — Image quality check. Confidence ≤ 0.15 if blurry/dark/no hardware.

STEP 2 — Identify: read all visible text first. Map to GSE categories: GPU, air starter, hydraulic test stand, de-icer, tow tractor, maintenance stand, fueling, lav/water service.

STEP 3 — Identify the parent assembly with specific model. Use manufacturer model numbers (e.g. "Hobart 400Hz GPU", "JBT B400 Tow Tractor", "Tronair 01-1442-0000 Hydraulic Test Stand") — never generic labels alone. If uncertain, list candidates in possibleEquipment and set the best match in identifiedAssembly.

STEP 4 — Respond ONLY with valid JSON (no markdown):
{
  "partName": "Manufacturer/common part name",
  "nsn": "ATA chapter code (e.g. ATA 12-10) or manufacturer P/N if visible; else best ATA reference",
  "modelNumber": "Model/part number if visible; else best known model for this equipment",
  "cageCode": "Manufacturer name or code if visible or well-known; else empty string",
  "confidence": 0.0,
  "description": "What it is, its GSE function, which aircraft/ramp ops it supports. State which markings used for ID.",
  "stockStatus": "Unknown",
  "unitPrice": "Contact manufacturer for pricing",
  "location": "Typical hangar/ramp storage",
  "elmsNotes": "AMM reference or inspection interval for this equipment type; else empty string",
  "identifiedAssembly": {
    "model": "Specific model designation (e.g. Hobart 400Hz, JBT B400) — never generic",
    "name": "Full assembly name with model (e.g. Hobart 400Hz Ground Power Unit)",
    "confidence": "high | medium | low"
  },
  "ipbReference": {
    "toNumber": "Most relevant IPC/AMM manual for this equipment; empty string if unknown",
    "figure": "Typical figure number if known; else empty string",
    "item": "Typical item number if known; else empty string",
    "title": "Figure description; else empty string"
  },
  "confirmedFromImage": ["fields", "readable", "from", "image"],
  "dataWarnings": ["Part number is estimated — verify against OEM IPC before ordering", "Manuals are suggested based on equipment type — confirm revision before use"],
  "possibleEquipment": [
    {"name": "Full name with specific model (e.g. Hobart 400Hz Ground Power Unit)", "role": "How this part fits"}
  ],
  "alternativeParts": [
    {"name": "Part name", "nsn": "P/N or ATA ref if known", "compatibility": "Compatibility note"}
  ],
  "technicalOrders": [
    {"number": "Most relevant manual for this equipment", "title": "Manual title", "type": "pdf", "verified": true},
    {"number": "Additional related manual", "title": "Title", "type": "pdf", "verified": false}
  ]
}

Confidence: 0.9+ = part number confirmed from image; 0.7–0.89 = clear equipment type; 0.4–0.69 = probable; 0.15–0.39 = poor image; <0.15 = cannot identify.`;

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, apiKey, model, operationMode } = await request.json();

    const key = process.env.OPENROUTER_API_KEY || apiKey;
    if (!key) {
      return Response.json({ error: 'No API key provided' }, { status: 401 });
    }

    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    const resolvedModel = model || 'openai/gpt-4o';
    const prompt = operationMode === 'civilian' ? CIVILIAN_PROMPT : MILITARY_PROMPT;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': request.headers.get('origin') || 'https://age-scout.app',
      'X-Title': 'AGE Scout',
    };

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: resolvedModel,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            { type: 'text', text: prompt },
          ],
        }],
        temperature: 0.1,
        max_tokens: 5000,
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

    const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('Non-JSON response from model:', raw.slice(0, 500));
      return Response.json({ error: 'AI response was not valid JSON', raw: raw.slice(0, 300) }, { status: 422 });
    }

    let part;
    try {
      part = JSON.parse(match[0]);
    } catch {
      console.error('JSON parse failed:', match[0].slice(0, 500));
      return Response.json({ error: 'Failed to parse AI response JSON' }, { status: 422 });
    }

    // Ensure confirmedFromImage always exists
    if (!Array.isArray(part.confirmedFromImage)) part.confirmedFromImage = [];

    return Response.json({ part });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
}
