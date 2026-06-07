import { Task, TaskScoreLevel } from '../task.model';
import type { Project } from '../../project/project.model';
import type { Section } from '../../section/section.model';

export const TASK_SCORE_LEVELS: readonly TaskScoreLevel[] = [
  'xhigh',
  'high',
  'mid',
  'low',
];

export const TASK_EFFORT_LABELS: Record<TaskScoreLevel, string> = {
  xhigh: 'xhigh',
  high: 'high',
  mid: 'mid',
  low: 'low',
};

export const TASK_VALUE_LABELS: Record<TaskScoreLevel, string> = {
  xhigh: 'xhigh',
  high: 'high',
  mid: 'mid',
  low: 'low',
};

const EFFORT_WEIGHTS: Record<TaskScoreLevel, number> = {
  xhigh: 1,
  high: 2,
  mid: 3,
  low: 4,
};

const VALUE_WEIGHTS: Record<TaskScoreLevel, number> = {
  xhigh: 5,
  high: 4,
  mid: 2,
  low: 1,
};

const CONTEXT_VALUE_MODIFIERS: Record<TaskScoreLevel, number> = {
  xhigh: 1.4,
  high: 1.2,
  mid: 1,
  low: 0.85,
};

const DATE_MODIFIER_MIN = 0.6;
const DATE_MODIFIER_MAX = 1.8;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface TaskScorePart {
  label: string;
  value: string;
}

export interface TaskScoreResult {
  score: number;
  baseScore: number;
  parts: TaskScorePart[];
}

export interface TaskScoreContext {
  effort?: TaskScoreLevel;
  value?: TaskScoreLevel;
  dueDay?: string | null;
  deadlineDay?: string | null;
  projectValue?: TaskScoreLevel | null;
  projectDeadlineDay?: string | null;
  sectionValue?: TaskScoreLevel | null;
  sectionDeadlineDay?: string | null;
  today?: string;
}

export type TaskScoreContextByTaskId = ReadonlyMap<string, TaskScoreContext>;

export const buildTaskScoreContextByTaskId = (
  tasks: readonly Pick<Task, 'id' | 'projectId' | 'dueDay' | 'deadlineDay'>[],
  projects: readonly Project[] = [],
  sections: readonly Section[] = [],
  today?: string,
  neutralProjectId?: string | null,
): Map<string, TaskScoreContext> => {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const sectionByTaskId = new Map<string, Section>();
  sections.forEach((section) =>
    section.taskIds.forEach((taskId) => sectionByTaskId.set(taskId, section)),
  );

  return new Map(
    tasks.map((task) => {
      const project =
        neutralProjectId && neutralProjectId === task.projectId
          ? undefined
          : projectById.get(task.projectId);
      const section = sectionByTaskId.get(task.id);
      return [
        task.id,
        {
          projectValue: project?.value,
          projectDeadlineDay: project?.deadlineDay,
          sectionValue: section?.value,
          sectionDeadlineDay: section?.deadlineDay,
          today,
        },
      ];
    }),
  );
};

export const calculateTaskScore = (
  effort: TaskScoreLevel | undefined,
  value: TaskScoreLevel | undefined,
): number | undefined =>
  effort && value ? EFFORT_WEIGHTS[effort] * VALUE_WEIGHTS[value] : undefined;

const _roundScore = (score: number): number => Math.round(score * 100) / 100;

const _parseDay = (day: string): number | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return undefined;
  const [, year, month, date] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(date));
};

const _getDateModifier = (
  day: string | null | undefined,
  today: string | undefined,
): { label: string; modifier: number } | undefined => {
  if (!day || !today) return undefined;
  const dayTime = _parseDay(day);
  const todayTime = _parseDay(today);
  if (dayTime === undefined || todayTime === undefined) return undefined;

  const diffDays = Math.round((dayTime - todayTime) / DAY_MS);
  const overdueDays = Math.abs(diffDays);
  if (diffDays < 0 && overdueDays <= 2) {
    return { label: 'overdue 1-2 days', modifier: 1.25 };
  }
  if (diffDays < 0 && overdueDays <= 7) {
    return { label: 'overdue 3-7 days', modifier: 1.12 };
  }
  if (diffDays < 0 && overdueDays <= 14) {
    return { label: 'overdue 8-14 days', modifier: 1 };
  }
  if (diffDays < 0 && overdueDays <= 30) {
    return { label: 'overdue 15-30 days', modifier: 0.9 };
  }
  if (diffDays < 0) return { label: 'overdue 31+ days', modifier: 0.75 };
  if (diffDays === 0) return { label: 'today', modifier: 1.22 };
  if (diffDays === 1) return { label: 'tomorrow', modifier: 1.18 };
  if (diffDays <= 3) return { label: 'next 2-3 days', modifier: 1.14 };
  if (diffDays <= 7) return { label: 'this week', modifier: 1.08 };
  if (diffDays <= 14) return { label: 'next week', modifier: 1.04 };
  if (diffDays <= 21) return { label: 'after two weeks', modifier: 0.95 };
  return { label: 'later', modifier: 0.95 };
};

const _applyDateModifier = (
  parts: TaskScorePart[],
  label: string,
  day: string | null | undefined,
  today: string | undefined,
): number => {
  const dateModifier = _getDateModifier(day, today);
  if (!dateModifier) return 1;
  parts.push({
    label,
    value: `${dateModifier.label} x${dateModifier.modifier}`,
  });
  return dateModifier.modifier;
};

const _capDateModifier = (modifier: number): number =>
  Math.min(DATE_MODIFIER_MAX, Math.max(DATE_MODIFIER_MIN, modifier));

const _appendDateCapPart = (parts: TaskScorePart[], rawModifier: number): number => {
  const cappedModifier = _capDateModifier(rawModifier);
  if (cappedModifier !== rawModifier) {
    parts.push({ label: 'Dates cap', value: `x${cappedModifier}` });
  }
  return cappedModifier;
};

const _applyContextValueModifier = (
  score: number,
  parts: TaskScorePart[],
  label: string,
  value: TaskScoreLevel | null | undefined,
): number => {
  if (!value) return score;
  const modifier = CONTEXT_VALUE_MODIFIERS[value];
  parts.push({ label, value: `${value} x${modifier}` });
  return score * modifier;
};

export const calculateTaskScoreWithContext = (
  context: TaskScoreContext,
): TaskScoreResult | undefined => {
  const baseScore = calculateTaskScore(context.effort, context.value);
  if (baseScore === undefined) return undefined;

  const parts: TaskScorePart[] = [{ label: 'Task', value: `${baseScore}` }];
  let score = baseScore;

  score = _applyContextValueModifier(score, parts, 'Project value', context.projectValue);
  score = _applyContextValueModifier(score, parts, 'Section value', context.sectionValue);
  let dateModifier = 1;
  dateModifier *= _applyDateModifier(parts, 'Planned', context.dueDay, context.today);
  dateModifier *= _applyDateModifier(
    parts,
    'Task deadline',
    context.deadlineDay,
    context.today,
  );
  dateModifier *= _applyDateModifier(
    parts,
    'Project deadline',
    context.projectDeadlineDay,
    context.today,
  );
  dateModifier *= _applyDateModifier(
    parts,
    'Section deadline',
    context.sectionDeadlineDay,
    context.today,
  );
  score *= _appendDateCapPart(parts, dateModifier);

  return {
    score: _roundScore(score),
    baseScore,
    parts,
  };
};

export const hasTaskScore = (
  task: Pick<Task, 'effort' | 'value'>,
): task is Pick<Task, 'effort' | 'value'> & {
  effort: TaskScoreLevel;
  value: TaskScoreLevel;
} => calculateTaskScore(task.effort, task.value) !== undefined;

export const compareTasksByScoreDesc = (
  a: Pick<Task, 'effort' | 'value' | 'created'>,
  b: Pick<Task, 'effort' | 'value' | 'created'>,
): number => compareTasksByScore(a, b, 'DESC');

export const compareTasksByScore = (
  a: Pick<Task, 'effort' | 'value' | 'created'>,
  b: Pick<Task, 'effort' | 'value' | 'created'>,
  order: 'ASC' | 'DESC',
): number => {
  const scoreA = calculateTaskScore(a.effort, a.value);
  const scoreB = calculateTaskScore(b.effort, b.value);

  if (scoreA !== undefined && scoreB !== undefined) {
    const scoreDiff = order === 'ASC' ? scoreA - scoreB : scoreB - scoreA;
    return scoreDiff || a.created - b.created;
  }
  if (scoreA === undefined && scoreB === undefined) {
    return a.created - b.created;
  }
  return scoreA === undefined ? 1 : -1;
};

export const compareTasksByScoreWithContext = (
  a: Pick<Task, 'id' | 'effort' | 'value' | 'created' | 'dueDay' | 'deadlineDay'>,
  b: Pick<Task, 'id' | 'effort' | 'value' | 'created' | 'dueDay' | 'deadlineDay'>,
  order: 'ASC' | 'DESC',
  contextByTaskId: TaskScoreContextByTaskId = new Map(),
): number => {
  const contextA = contextByTaskId.get(a.id);
  const contextB = contextByTaskId.get(b.id);
  const scoreA = calculateTaskScoreWithContext({
    ...contextA,
    effort: a.effort,
    value: a.value,
    dueDay: a.dueDay,
    deadlineDay: a.deadlineDay,
  })?.score;
  const scoreB = calculateTaskScoreWithContext({
    ...contextB,
    effort: b.effort,
    value: b.value,
    dueDay: b.dueDay,
    deadlineDay: b.deadlineDay,
  })?.score;

  if (scoreA !== undefined && scoreB !== undefined) {
    const scoreDiff = order === 'ASC' ? scoreA - scoreB : scoreB - scoreA;
    return scoreDiff || a.created - b.created;
  }
  if (scoreA === undefined && scoreB === undefined) {
    return a.created - b.created;
  }
  return scoreA === undefined ? 1 : -1;
};
