import { Task } from '../../tasks/task.model';
import { TaskState } from '../../tasks/task.model';
import { SprintState } from '../sprint.model';
import {
  selectCurrentSprintTasks,
  selectCurrentSprintCapacityStats,
  selectNextSprintTasks,
  selectNextSprintCapacityStats,
  selectSprintForTask,
} from './sprint.selectors';
import { CapacityConfig } from '../../config/global-config.model';

const HOUR = 60 * 60 * 1000;

const capacityConfig: CapacityConfig = {
  weekdayCapacity: 2 * HOUR,
  weekendCapacity: 6 * HOUR,
  sprintCapacity: 22 * HOUR,
};

const createTask = (id: string, overrides: Partial<Task> = {}): Task =>
  ({
    id,
    projectId: 'project-1',
    title: id,
    isDone: false,
    subTaskIds: [],
    tagIds: [],
    timeEstimate: 0,
    timeSpent: 0,
    timeSpentOnDay: {},
    attachments: [],
    created: 1,
    ...overrides,
  }) as Task;

describe('sprint selectors', () => {
  const sprintState: SprintState = {
    currentTaskIds: ['task-2', 'missing-task', 'task-1'],
    nextTaskIds: ['task-3'],
  };
  const taskEntities: Record<string, Task | undefined> = {
    ['task-1']: createTask('task-1'),
    ['task-2']: createTask('task-2'),
    ['task-3']: createTask('task-3'),
  };
  const taskState = {
    ids: Object.keys(taskEntities),
    entities: taskEntities,
    currentTaskId: null,
    selectedTaskId: null,
    lastCurrentTaskId: null,
    isDataLoaded: true,
  } as TaskState;

  it('should select current sprint tasks in sprint order and filter missing ids', () => {
    const result = selectCurrentSprintTasks.projector(
      sprintState,
      taskEntities,
      taskState,
    );

    expect(result.map((task) => task.id)).toEqual(['task-2', 'task-1']);
  });

  it('should select next sprint tasks in sprint order', () => {
    const result = selectNextSprintTasks.projector(sprintState, taskEntities, taskState);

    expect(result.map((task) => task.id)).toEqual(['task-3']);
  });

  it('should identify current sprint membership for a task', () => {
    const selector = selectSprintForTask('task-1');

    expect(selector.projector(sprintState)).toBe('CURRENT');
  });

  it('should identify next sprint membership for a task', () => {
    const selector = selectSprintForTask('task-3');

    expect(selector.projector(sprintState)).toBe('NEXT');
  });

  it('should return null when the task is not in a sprint', () => {
    const selector = selectSprintForTask('task-4');

    expect(selector.projector(sprintState)).toBe(null);
  });

  it('should calculate current sprint capacity stats from raw task estimates', () => {
    const tasks = [
      { ...createTask('task-1', { timeEstimate: HOUR, isDone: true }), subTasks: [] },
      { ...createTask('task-2', { timeEstimate: 2 * HOUR }), subTasks: [] },
    ];

    const result = selectCurrentSprintCapacityStats.projector(tasks, capacityConfig);

    expect(result.estimate).toBe(3 * HOUR);
    expect(result.capacity).toBe(22 * HOUR);
    expect(result.progressPercentage).toBe((3 / 22) * 100);
  });

  it('should calculate next sprint capacity stats from raw task estimates', () => {
    const tasks = [
      { ...createTask('task-3', { timeEstimate: 11 * HOUR }), subTasks: [] },
    ];

    const result = selectNextSprintCapacityStats.projector(tasks, capacityConfig);

    expect(result.estimate).toBe(11 * HOUR);
    expect(result.capacity).toBe(22 * HOUR);
    expect(result.progressPercentage).toBe(50);
  });
});
