import { isTaskViewCustomizerRoute } from './is-task-view-customizer-route.util';

describe('isTaskViewCustomizerRoute', () => {
  it('returns true for regular task list routes', () => {
    expect(isTaskViewCustomizerRoute('/active/tasks')).toBe(true);
    expect(isTaskViewCustomizerRoute('/project/abc/tasks?focus=1')).toBe(true);
  });

  it('returns true for sprint task list routes', () => {
    expect(isTaskViewCustomizerRoute('/sprint/current')).toBe(true);
    expect(isTaskViewCustomizerRoute('/sprint/next')).toBe(true);
  });

  it('returns false for non-task-list routes', () => {
    expect(isTaskViewCustomizerRoute('/config')).toBe(false);
    expect(isTaskViewCustomizerRoute('/scheduled-list')).toBe(false);
  });
});
