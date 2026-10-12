import type { Effort, SourceCategory, TaskGroup } from '../types';

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === 'string';
const isStrArr = (x: unknown): x is string[] => Array.isArray(x) && x.every(isStr);

export interface Fact {
  ref: string;
  tasks: string[];
  blockers: string[];
  decisions: string[];
  dates: string[];
  shortSummary: string;
}
export interface FactsOut { items: Fact[] }
export const factsSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ref: { type: 'string' },
          tasks: { type: 'array', items: { type: 'string' } },
          blockers: { type: 'array', items: { type: 'string' } },
          decisions: { type: 'array', items: { type: 'string' } },
          dates: { type: 'array', items: { type: 'string' } },
          shortSummary: { type: 'string' },
        },
        required: ['ref', 'tasks', 'blockers', 'decisions', 'dates', 'shortSummary'],
      },
    },
  },
  required: ['items'],
};
export const isFactsOut = (x: unknown): x is FactsOut =>
  isObj(x) && Array.isArray(x.items) &&
  x.items.every((i) => isObj(i) && isStr(i.ref) && isStrArr(i.tasks) && isStrArr(i.blockers) && isStrArr(i.decisions) && isStrArr(i.dates) && isStr(i.shortSummary));

export interface TriageTask {
  title: string;
  project: string;
  estimateMin: number;
  effort: Effort;
  group: TaskGroup;
  urgency: 'low' | 'med' | 'high';
  blocker?: string;
  suggestedHelperId?: string;
  explanation: { sourceCategory: SourceCategory; confidence: number; reason: string };
  provenance?: { source: 'demo-slack' | 'demo-gmail' | 'demo-calendar' | 'policy' | 'manual'; ref: string };
}
export interface TriageOut { tasks: TriageTask[] }
export const triageSchema = {
  type: 'object',
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          project: { type: 'string' },
          estimateMin: { type: 'integer' },
          effort: { type: 'string', enum: ['easy', 'medium', 'deep'] },
          group: { type: 'string', enum: ['easy_wins', 'next_up', 'needs_senior'] },
          urgency: { type: 'string', enum: ['low', 'med', 'high'] },
          blocker: { type: 'string' },
          suggestedHelperId: { type: 'string' },
          explanation: {
            type: 'object',
            properties: {
              sourceCategory: { type: 'string', enum: ['chat', 'email', 'calendar', 'policy', 'manual'] },
              confidence: { type: 'number' },
              reason: { type: 'string' },
            },
            required: ['sourceCategory', 'confidence', 'reason'],
          },
          provenance: {
            type: 'object',
            properties: {
              source: { type: 'string', enum: ['demo-slack', 'demo-gmail', 'demo-calendar', 'policy', 'manual'] },
              ref: { type: 'string' },
            },
            required: ['source', 'ref'],
          },
        },
        required: ['title', 'project', 'estimateMin', 'effort', 'group', 'urgency', 'explanation'],
      },
    },
  },
  required: ['tasks'],
};
export const isTriageOut = (x: unknown): x is TriageOut =>
  isObj(x) && Array.isArray(x.tasks) &&
  x.tasks.every((t) => isObj(t) && isStr(t.title) && isStr(t.project) && typeof t.estimateMin === 'number' && isStr(t.effort) && isStr(t.group) && isStr(t.urgency) &&
    isObj(t.explanation) && isStr(t.explanation.reason) && typeof t.explanation.confidence === 'number');

export interface RoundupLine { text: string; source: 'demo-slack' | 'demo-gmail' | 'demo-calendar' | 'policy' | 'manual'; ref: string; group: TaskGroup }
export interface RoundupOut { lines: RoundupLine[] }
export const roundupSchema = {
  type: 'object',
  properties: {
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          source: { type: 'string', enum: ['demo-slack', 'demo-gmail', 'demo-calendar', 'policy', 'manual'] },
          ref: { type: 'string' },
          group: { type: 'string', enum: ['easy_wins', 'next_up', 'needs_senior'] },
        },
        required: ['text', 'source', 'ref', 'group'],
      },
    },
  },
  required: ['lines'],
};
export const isRoundupOut = (x: unknown): x is RoundupOut =>
  isObj(x) && Array.isArray(x.lines) && x.lines.every((l) => isObj(l) && isStr(l.text) && isStr(l.source) && isStr(l.ref) && isStr(l.group));

export interface HelpDraft { context: string; tried: string[]; ask: string; nextStep: string; timing: string }
export const helpDraftSchema = {
  type: 'object',
  properties: {
    context: { type: 'string' }, tried: { type: 'array', items: { type: 'string' } },
    ask: { type: 'string' }, nextStep: { type: 'string' }, timing: { type: 'string' },
  },
  required: ['context', 'tried', 'ask', 'nextStep', 'timing'],
};
export const isHelpDraft = (x: unknown): x is HelpDraft =>
  isObj(x) && isStr(x.context) && isStrArr(x.tried) && isStr(x.ask) && isStr(x.nextStep) && isStr(x.timing);

export interface CapacityOut { options: { kind: 'split' | 'reduce_scope' | 'new_helper'; text: string }[]; replyDraft: string }
export const capacitySchema = {
  type: 'object',
  properties: {
    options: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['split', 'reduce_scope', 'new_helper'] }, text: { type: 'string' } }, required: ['kind', 'text'] } },
    replyDraft: { type: 'string' },
  },
  required: ['options', 'replyDraft'],
};
export const isCapacityOut = (x: unknown): x is CapacityOut =>
  isObj(x) && isStr(x.replyDraft) && Array.isArray(x.options) && x.options.every((o) => isObj(o) && isStr(o.kind) && isStr(o.text));

export interface StepsOut { steps: string[] }
export const stepsSchema = { type: 'object', properties: { steps: { type: 'array', items: { type: 'string' } } }, required: ['steps'] };
export const isStepsOut = (x: unknown): x is StepsOut => isObj(x) && isStrArr(x.steps);

export interface BulletsOut { bullets: string[] }
export const bulletsSchema = { type: 'object', properties: { bullets: { type: 'array', items: { type: 'string' } } }, required: ['bullets'] };
export const isBulletsOut = (x: unknown): x is BulletsOut => isObj(x) && isStrArr(x.bullets);

export interface DraftOut { subject?: string; body: string }
export const draftSchema = { type: 'object', properties: { body: { type: 'string' } }, required: ['body'] };
export const isDraftOut = (x: unknown): x is DraftOut => isObj(x) && isStr(x.body);
