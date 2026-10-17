import type { CompleteArgs } from './aiTypes';
import {
  factsSchema, triageSchema, roundupSchema, helpDraftSchema, capacitySchema, stepsSchema, bulletsSchema, draftSchema,
} from './schemas';

export const PERSONA = `You are Blue, a private, calm work companion for one employee. Rules:
- Use ONLY the items provided. Never invent facts, names, dates or links.
- Never blame, shame, rank or label the user or any colleague.
- Never diagnose emotions or health. Do not treat profanity as a health signal.
- Asking for help is a strength. A teammate saying "no" is capacity information, not a character verdict.
- Be short, concrete and warm. No exclamation spam, no streaks, no guilt.
- Never include secrets, credentials, source code, diffs or repository links in any output.`;

export type Feature =
  | 'facts' | 'triage' | 'roundup' | 'helpDraft' | 'capacity' | 'steps' | 'bullets' | 'draft' | 'chat' | 'praise' | 'summarizeNote';

/** Every prompt carries a feature tag and a delimited data block, so the offline demo provider can answer deterministically. */
export const tag = (f: Feature) => `[[blue:${f}]]`;
export const DATA_OPEN = '<<DATA>>';
export const DATA_CLOSE = '<<END>>';

const withData = (instruction: string, data: unknown) => `${instruction}\n${DATA_OPEN}\n${JSON.stringify(data)}\n${DATA_CLOSE}`;

export function factsPrompt(items: { ref: string; source: string; from?: string; subject?: string; text: string }[]): CompleteArgs {
  return {
    system: `${tag('facts')}\n${PERSONA}\nExtract only actionable facts from each item. Do not quote the text. shortSummary must be a paraphrase under 20 words.`,
    prompt: withData('For each item return {ref, tasks[], blockers[], decisions[], dates[], shortSummary}.', { items }),
    jsonSchema: factsSchema,
  };
}

export function triagePrompt(data: { facts: unknown[]; manualTasks: unknown[]; team: unknown[] | null }): CompleteArgs {
  return {
    system: `${tag('triage')}\n${PERSONA}
Sort the work into tasks. Rules:
- group "easy_wins": under 30 minutes and no dependencies.
- group "needs_senior": blocked, ambiguous, or access-dependent.
- group "next_up": everything else.
- Order within groups by urgency, then effort.
- estimateMin between 5 and 480. confidence between 0 and 1.
- explanation.reason is one plain sentence saying why.
- Set suggestedHelperId ONLY from team ids provided (and only if a team list is provided); otherwise omit it.
- Keep provenance {source, ref} from the fact the task came from.`,
    prompt: withData('Return {tasks:[...]}.', data),
    jsonSchema: triageSchema,
  };
}

export function roundupPrompt(data: { tasks: unknown[]; events: unknown[] }): CompleteArgs {
  return {
    system: `${tag('roundup')}\n${PERSONA}
Write a morning digest of at most 120 words in total, as lines. Order: easy tasks first, harder tasks next, then tasks likely to benefit from senior input.
Each line must carry the provenance {source, ref} of the task it describes.`,
    prompt: withData('Return {lines:[{text, source, ref, group}]}.', data),
    jsonSchema: roundupSchema,
  };
}

export function helpDraftPrompt(data: { task: unknown; helper: unknown; policy: unknown[]; userName: string }): CompleteArgs {
  return {
    system: `${tag('helpDraft')}\n${PERSONA}
Draft a help request from the user to a senior colleague. Structure: context (1 sentence), tried (2-3 bullets of what the user could have tried; keep them generic and editable), ask (a specific question), nextStep (smallest useful next step), timing.
Tone: matter-of-fact and confident. Never apologetic or self-deprecating. Cite a policy document by name only if one is provided and relevant.`,
    prompt: withData('Return the JSON draft.', data),
    jsonSchema: helpDraftSchema,
  };
}

export function capacityPrompt(data: { task: unknown; person: string; team: unknown[] | null }): CompleteArgs {
  return {
    system: `${tag('capacity')}\n${PERSONA}
A teammate has said they cannot take a task. Treat it as capacity information. Offer exactly 3 options: split the task, reduce scope or move the deadline, find another approved helper (only from the team list, if provided). Also write a short, respectful reply the user can send back. Do not judge the person.`,
    prompt: withData('Return {options:[{kind,text}], replyDraft}.', data),
    jsonSchema: capacitySchema,
  };
}

export function stepsPrompt(data: { task: string }): CompleteArgs {
  return {
    system: `${tag('steps')}\n${PERSONA}\nBreak the overwhelming task into 3 to 5 small, concrete steps, each doable in under 15 minutes. Do not mention emotions or health.`,
    prompt: withData('Return {steps:[...]}.', data),
    jsonSchema: stepsSchema,
  };
}

export function bulletsPrompt(data: { text: string }): CompleteArgs {
  return {
    system: `${tag('bullets')}\n${PERSONA}\nSummarize the text in exactly 3 short bullets.`,
    prompt: withData('Return {bullets:[...]}.', data),
    jsonSchema: bulletsSchema,
  };
}

export function draftPrompt(data: { intent: string; recipient?: string; userName: string }): CompleteArgs {
  return {
    system: `${tag('draft')}\n${PERSONA}\nWrite a short, clear message for the user to send. Plain text, no subject line, sign off with the user's first name.`,
    prompt: withData('Return {body}.', data),
    jsonSchema: draftSchema,
  };
}

export function chatPrompt(data: {
  message: string; taskTitles: string[]; policy: { doc: string; text: string }[]; toneAware: boolean;
  mail?: { from: string; subject: string; date: string; snippet: string }[]; events?: { title: string; start: string }[];
}): CompleteArgs {
  const tone = data.toneAware
    ? '\nIf the user seems rude or distressed, stay calm, acknowledge friction without scolding, and offer a pause or a simpler next step. Do not label or score the user. Do not treat profanity as a health signal. Do not diagnose.'
    : '';
  return {
    system: `${tag('chat')}\n${PERSONA}\nAnswer briefly in plain text; short '- ' bullet lists are fine. taskTitles lists ALL of the user's open tasks, newest first. If mail or events are present, they come from the user's connected Gmail (last 48 hours, preview text only) and Google Calendar; use them when asked about email, inbox or schedule. If they are absent and the user asks about email, say Gmail is not connected and can be connected in Apps. When you use a policy excerpt, cite the document name in square brackets, like [incident-escalation].${tone}`,
    prompt: withData('Reply to the user message.', data),
  };
}

export function praisePrompt(data: { title: string; blocker?: string }): CompleteArgs {
  return {
    system: `${tag('praise')}\n${PERSONA}\nWrite one restrained, specific sentence (max 20 words) acknowledging the finished task. No exclamation marks, no streaks.`,
    prompt: withData('Reply with the sentence only.', data),
  };
}
