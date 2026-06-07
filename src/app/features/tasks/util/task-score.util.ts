import { Task, TaskScoreLevel } from '../task.model';

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

export const calculateTaskScore = (
  effort: TaskScoreLevel | undefined,
  value: TaskScoreLevel | undefined,
): number | undefined =>
  effort && value ? EFFORT_WEIGHTS[effort] * VALUE_WEIGHTS[value] : undefined;

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
