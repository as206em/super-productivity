import { Task } from '../../tasks/task.model';
import { TaskState } from '../../tasks/task.model';
import { SprintState } from '../sprint.model';
import {
  selectCurrentSprintTasks,
  selectNextSprintTasks,
  selectSprintForTask,
} from './sprint.selectors';

const createTask = (id: string): Task =>
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
});
