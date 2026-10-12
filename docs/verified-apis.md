# Verified API Research — Project Blue

_Verified: 2026-10-12_

---

## Gemini (Cloud) — S0.5

### Source

- https://ai.google.dev/gemini-api/docs/quickstart?lang=node
- https://ai.google.dev/gemini-api/docs/models

### 1. Official JavaScript Package Name

```
npm install @google/genai
```

Package: `@google/genai`

### 2. generateContent with system instruction and JSON response schema (JavaScript)

```js
import { GoogleGenAI } from "@google/genai";
import * as z from "zod";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const recipeJsonSchema = {
  type: "object",
  properties: {
    recipe_name: { type: "string" },
    ingredients: { type: "array", items: { type: "string" } },
  },
  required: ["recipe_name", "ingredients"],
};

const interaction = await ai.interactions.create({
  model: "gemini-3.8-flash",
  input: "Give me a recipe for banana bread",
  config: {
    systemInstruction: "You are a helpful assistant.",
  },
  response_format: {
    type: "text",
    mime_type: "application/json",
    schema: recipeJsonSchema,
  },
});
```

For server-side Node.js with raw generateContent approach:

```js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: "gemini-3.8-flash",
  contents: [{ role: "user", parts: [{ text: "Hello" }] }],
  config: {
    systemInstruction: "You are Blue, a private, calm work companion.",
    responseMimeType: "application/json",
    responseSchema: {
      /* JSON schema object */
    },
  },
});
console.log(response.text);
```

### 3. Vertex AI Mode

Enable by setting `USE_VERTEX=true` and providing project/location instead of API key:

```js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION,
  // No apiKey needed — uses ADC/service account
});
```

### 4. Recommended Fast Model ID (Stable, Oct 2026)

**`gemini-3.8-flash`** — "Our most intelligent Flash model, engineered for long-horizon software engineering, autonomous agents, and complex enterprise workflows." (New Stable as of Oct 2026)

---

## Gemma Web Runtime (LiteRT-LM) — S0.6

### Sources

- https://ai.google.dev/gemma/docs/releases
- https://developers.google.com/edge/litert-lm/js
- https://developers.google.com/edge/litert-lm/overview

### 1. Gemma Model Names for Web (confirmed from LiteRT-LM docs)

All models are **Gemma 4** variants (the plan.md correctly anticipated this):

- `Gemma 4 E2B` — `gemma-4-E2B-it-gpu.litertlm` (~2B effective params)
- `Gemma 4 E4B` — `gemma-4-E4B-it-gpu.litertlm` (~4B effective params)
- `Gemma 4 12B` — `gemma-4-12B-it-gpu.litertlm`
- `Gemma 4 26B A4B` — `gemma-4-26B-A4B-it-gpu.litertlm` (MoE, ~4B active)
- `Gemma 4 31B` — `gemma-4-31B-it-gpu.litertlm`

> ✅ **Plan matches docs**: The plan.md mentioned E2B, E4B, 12B, 26B A4B, 31B — these are confirmed correct.

### 2. npm Package for JS API

```
npm install @litert-lm/core
```

or via CDN:

```js
import { Engine } from "https://cdn.jsdelivr.net/npm/@litert-lm/core/+esm";
```

### 3. Model File Format

`.litertlm` — proprietary LiteRT-LM format. Downloaded from HuggingFace (`litert-community` namespace).

### 4. Approximate Download Sizes

- E2B: ~2GB (estimated — not directly stated, based on 2B effective params)
- E4B: ~4GB (estimated)
- **Recommended for MVP**: E2B or E4B for reasonable download size

### 5. License Terms

Gemma 4 uses the **Gemma Terms of Use** (not Apache 2.0). Per the license:

- Users may use, fine-tune, and distribute Gemma models
- Commercial use: allowed under the Gemma Terms of Use
- Hosting the model file yourself: **allowed** (user can self-host `.litertlm` files or point to HuggingFace)
- No restriction on embedding in a web app

### 6. Browser Requirements

- **WebGPU is required** (Chrome 113+, Edge 113+; Firefox still behind a flag)
- The `isAvailable()` check should verify `navigator.gpu !== undefined`
- Example initialization:

```js
import { Engine } from "@litert-lm/core";

const engine = await Engine.create({
  model:
    "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-gpu.litertlm",
});

const chat = await engine.createConversation();

// Streaming output
for await (const chunk of chat.sendMessageStreaming("Hello")) {
  console.log(chunk.content[0].text);
}
```

> **DOCS DIFFER (minor)**: The plan mentions "Gemma 4 31B" but LiteRT-LM docs list 31B as web-compatible. The 31B model would require very high-end GPU with large VRAM — practical only with E2B/E4B for in-browser. We recommend defaulting to E2B for the demo with an option to choose.
