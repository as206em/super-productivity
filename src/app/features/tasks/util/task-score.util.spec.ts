import {
  calculateTaskScoreWithContext,
  calculateTaskScore,
  compareTasksByScore,
  compareTasksByScoreWithContext,
  compareTasksByScoreDesc,
  hasTaskScore,
  TASK_EFFORT_LABELS,
  TASK_VALUE_LABELS,
  TaskScoreContext,
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

  it('calculates context-aware score with project, section, due, and deadline inputs', () => {
    const result = calculateTaskScoreWithContext({
      effort: 'high',
      value: 'high',
      dueDay: '2026-06-08',
      deadlineDay: '2026-06-09',
      projectValue: 'xhigh',
      projectDeadlineDay: '2026-06-10',
      sectionValue: 'low',
      sectionDeadlineDay: '2026-06-11',
      today: '2026-06-07',
    });

    expect(result?.baseScore).toBe(8);
    expect(result?.score).toBe(13.79);
    expect(result?.parts).toEqual([
      { label: 'Task', value: '8' },
      { label: 'Project value', value: 'xhigh x1.4' },
      { label: 'Section value', value: 'low x0.85' },
      { label: 'Planned', value: 'tomorrow x1.15' },
      { label: 'Task deadline', value: 'this week x1.08' },
      { label: 'Project deadline', value: 'this week x1.08' },
      { label: 'Section deadline', value: 'this week x1.08' },
    ]);
  });

  it('keeps missing context neutral for context-aware score', () => {
    expect(
      calculateTaskScoreWithContext({
        effort: 'high',
        value: 'high',
        today: '2026-06-07',
      })?.score,
    ).toBe(calculateTaskScore('high', 'high'));
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

  it('sorts by context-aware score when task context is provided', () => {
    const sorted = [
      { id: 'missing-effort', value: 'xhigh', created: 1 },
      { id: 'base-best', effort: 'low', value: 'xhigh', created: 2 },
      { id: 'context-best', effort: 'low', value: 'high', created: 3 },
    ] as const;
    const contextByTaskId = new Map<string, TaskScoreContext>([
      [
        'context-best',
        {
          projectValue: 'xhigh',
          sectionValue: 'high',
          deadlineDay: '2026-06-08',
          today: '2026-06-07',
        },
      ],
    ]);

    const result = [...sorted].sort((a, b) =>
      compareTasksByScoreWithContext(a, b, 'DESC', contextByTaskId),
    );

    expect(result.map((task) => task.id)).toEqual([
      'context-best',
      'base-best',
      'missing-effort',
    ]);
  });

  it('exposes labels for the task badges and menus', () => {
    expect(TASK_EFFORT_LABELS.xhigh).toBe('xhigh');
    expect(TASK_VALUE_LABELS.low).toBe('low');
  });
});
