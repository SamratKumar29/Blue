import { GoogleGenAI } from '@google/genai';

export interface CompleteArgs {
  system: string;
  prompt: string;
  jsonSchema?: object;
}

let client: GoogleGenAI | null = null;

export function cloudConfigured(): boolean {
  if (process.env.USE_VERTEX === 'true') return Boolean(process.env.GOOGLE_CLOUD_PROJECT);
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getModelName(): string {
  const envModel = process.env.GEMINI_MODEL?.trim();
  // Ensure valid model name; discard tokens, deprecated models, or invalid formats
  if (
    envModel &&
    (envModel.startsWith('gemini-') || envModel.startsWith('models/gemini-')) &&
    !envModel.includes('2.5') &&
    !envModel.includes('2.0') &&
    !envModel.includes('1.5')
  ) {
    return envModel.replace(/^models\//, '');
  }
  return 'gemini-3.8-flash';
}

function getClient(): GoogleGenAI {
  if (client) return client;
  if (process.env.USE_VERTEX === 'true') {
    client = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'global',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } else {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set.');
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return client;
}

export async function complete({ system, prompt, jsonSchema }: CompleteArgs): Promise<{ text: string }> {
  const model = getModelName();
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
