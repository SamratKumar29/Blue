import { GoogleGenAI } from '@google/genai';

export interface CompleteArgs {
  system: string;
  prompt: string;
  jsonSchema?: object;
}

let client: GoogleGenAI | null = null;

export function cloudConfigured(): boolean {
  if (!process.env.GEMINI_MODEL) return false;
  if (process.env.USE_VERTEX === 'true') return Boolean(process.env.GOOGLE_CLOUD_PROJECT);
  return Boolean(process.env.GEMINI_API_KEY);
}

function getClient(): GoogleGenAI {
  if (client) return client;
  if (process.env.USE_VERTEX === 'true') {
    client = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'global',
    });
  } else {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set (local development only).');
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

export async function complete({ system, prompt, jsonSchema }: CompleteArgs): Promise<{ text: string }> {
  const model = process.env.GEMINI_MODEL;
  if (!model) throw new Error('GEMINI_MODEL is not set.');

  const response = await getClient().models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: system,
      ...(jsonSchema ? { responseMimeType: 'application/json', responseJsonSchema: jsonSchema } : {}),
    },
  });
  return { text: response.text ?? '' };
}
