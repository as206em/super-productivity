import { loadAllData } from '../../../root-store/meta/load-all-data.action';
import {
  addTaskToSprint,
  closeSprint,
  moveTaskInSprint,
  removeTaskFromSprint,
} from './sprint.actions';
import { initialSprintState, sprintReducer } from './sprint.reducer';

describe('sprintReducer', () => {
  it('should add a task to current sprint and remove it from next sprint', () => {
    const state = {
      currentTaskIds: ['current-1'],
      nextTaskIds: ['task-1', 'next-1'],
    };

    const result = sprintReducer(
      state,
      addTaskToSprint({ taskId: 'task-1', sprint: 'CURRENT' }),
    );

    expect(result.currentTaskIds).toEqual(['current-1', 'task-1']);
    expect(result.nextTaskIds).toEqual(['next-1']);
  });

  it('should add a task to next sprint and remove it from current sprint', () => {
    const state = {
      currentTaskIds: ['current-1', 'task-1'],
      nextTaskIds: ['next-1'],
    };

    const result = sprintReducer(
      state,
      addTaskToSprint({ taskId: 'task-1', sprint: 'NEXT' }),
    );

    expect(result.currentTaskIds).toEqual(['current-1']);
    expect(result.nextTaskIds).toEqual(['next-1', 'task-1']);
  });

  it('should remove a task from both sprint lists', () => {
    const state = {
      currentTaskIds: ['current-1', 'task-1'],
      nextTaskIds: ['task-1', 'next-1'],
    };

    const result = sprintReducer(state, removeTaskFromSprint({ taskId: 'task-1' }));

    expect(result.currentTaskIds).toEqual(['current-1']);
    expect(result.nextTaskIds).toEqual(['next-1']);
  });

  it('should move a task after an anchor in the selected sprint', () => {
    const state = {
      currentTaskIds: ['task-1', 'task-2', 'task-3'],
      nextTaskIds: ['next-1'],
    };

    const result = sprintReducer(
      state,
      moveTaskInSprint({
        sprint: 'CURRENT',
        taskId: 'task-1',
        afterTaskId: 'task-2',
      }),
    );

    expect(result.currentTaskIds).toEqual(['task-2', 'task-1', 'task-3']);
    expect(result.nextTaskIds).toEqual(['next-1']);
  });

  it('should close sprint by appending next to current and clearing next', () => {
    const state = {
      currentTaskIds: ['current-1', 'shared-task'],
      nextTaskIds: ['next-1', 'shared-task', 'next-2'],
    };

    const result = sprintReducer(state, closeSprint());

    expect(result.currentTaskIds).toEqual([
      'current-1',
      'shared-task',
      'next-1',
      'next-2',
    ]);
    expect(result.nextTaskIds).toEqual([]);
  });

  it('should load persisted sprint data', () => {
    const appDataComplete = {
      sprint: {
        currentTaskIds: ['current-1'],
        nextTaskIds: ['next-1'],
      },
    };

    const result = sprintReducer(
      initialSprintState,
      loadAllData({
        appDataComplete,
      } as unknown as Parameters<typeof loadAllData>[0]),
    );

    expect(result).toEqual(appDataComplete.sprint);
  });
});
