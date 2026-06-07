import {
  calculateTaskScore,
  compareTasksByScore,
  compareTasksByScoreDesc,
  hasTaskScore,
  TASK_EFFORT_LABELS,
  TASK_VALUE_LABELS,
} from './task-score.util';

describe('task-score.util', () => {
  it('calculates score from effort and value weights', () => {
    expect(calculateTaskScore('xhigh', 'xhigh')).toBe(5);
    expect(calculateTaskScore('high', 'high')).toBe(8);
    expect(calculateTaskScore('mid', 'mid')).toBe(6);
    expect(calculateTaskScore('low', 'low')).toBe(4);
  });

  it('returns undefined when effort or value is missing', () => {
    expect(calculateTaskScore(undefined, 'high')).toBeUndefined();
    expect(calculateTaskScore('high', undefined)).toBeUndefined();
  });

  it('identifies tasks with both score fields', () => {
    expect(hasTaskScore({ effort: 'high', value: 'low' })).toBe(true);
    expect(hasTaskScore({ effort: 'high' })).toBe(false);
    expect(hasTaskScore({ value: 'low' })).toBe(false);
  });

  it('sorts scored tasks first by descending score', () => {
    const sorted = [
      { id: 'missing-effort', value: 'xhigh', created: 1 },
      { id: 'best', effort: 'low', value: 'xhigh', created: 2 },
      { id: 'middle', effort: 'high', value: 'high', created: 3 },
      { id: 'missing-value', effort: 'low', created: 4 },
      { id: 'low', effort: 'xhigh', value: 'low', created: 5 },
    ] as const;

    const result = [...sorted].sort(compareTasksByScoreDesc);

    expect(result.map((task) => task.id)).toEqual([
      'best',
      'middle',
      'low',
      'missing-effort',
      'missing-value',
    ]);
  });

  it('keeps tasks missing score data at the end for ascending sort', () => {
    const sorted = [
      { id: 'missing-effort', value: 'xhigh', created: 1 },
      { id: 'best', effort: 'low', value: 'xhigh', created: 2 },
      { id: 'middle', effort: 'high', value: 'high', created: 3 },
      { id: 'missing-value', effort: 'low', created: 4 },
      { id: 'low', effort: 'xhigh', value: 'low', created: 5 },
    ] as const;

    const result = [...sorted].sort((a, b) => compareTasksByScore(a, b, 'ASC'));

    expect(result.map((task) => task.id)).toEqual([
      'low',
      'middle',
      'best',
      'missing-effort',
      'missing-value',
    ]);
  });

  it('exposes labels for the task badges and menus', () => {
    expect(TASK_EFFORT_LABELS.xhigh).toBe('xhigh');
    expect(TASK_VALUE_LABELS.low).toBe('low');
  });
});
