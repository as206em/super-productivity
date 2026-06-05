import { createSelector, MemoizedSelector } from '@ngrx/store';
import { Task, TaskState, TaskWithSubTasks } from '../../tasks/task.model';
import { selectTaskEntitiesInActiveProjects } from '../../tasks/store/task.selectors';
import { selectTaskFeatureState } from '../../tasks/store/task.selectors';
import { SprintTarget } from '../sprint.model';
import { selectSprintFeatureState } from './sprint.reducer';

const mapSprintTasks = (
  taskIds: string[],
  taskEntities: Record<string, Task | undefined>,
  taskState: TaskState,
): TaskWithSubTasks[] =>
  taskIds
    .map((taskId) => taskEntities[taskId])
    .filter((task): task is Task => !!task)
    .map((task) => ({
      ...task,
      subTasks: task.subTaskIds
        .map((subTaskId) => taskState.entities[subTaskId])
        .filter((subTask): subTask is Task => !!subTask),
    }));

export const selectCurrentSprintTaskIds = createSelector(
  selectSprintFeatureState,
  (state) => state.currentTaskIds,
);

export const selectNextSprintTaskIds = createSelector(
  selectSprintFeatureState,
  (state) => state.nextTaskIds,
);

export const selectCurrentSprintTasks = createSelector(
  selectSprintFeatureState,
  selectTaskEntitiesInActiveProjects,
  selectTaskFeatureState,
  (state, taskEntities, taskState): TaskWithSubTasks[] =>
    mapSprintTasks(
      state.currentTaskIds,
      taskEntities as Record<string, Task | undefined>,
      taskState,
    ),
);

export const selectNextSprintTasks = createSelector(
  selectSprintFeatureState,
  selectTaskEntitiesInActiveProjects,
  selectTaskFeatureState,
  (state, taskEntities, taskState): TaskWithSubTasks[] =>
    mapSprintTasks(
      state.nextTaskIds,
      taskEntities as Record<string, Task | undefined>,
      taskState,
    ),
);

export const selectSprintForTask = (
  taskId: string,
): MemoizedSelector<object, SprintTarget | null> =>
  createSelector(selectSprintFeatureState, (state): SprintTarget | null => {
    if (state.currentTaskIds.includes(taskId)) {
      return 'CURRENT';
    }
    if (state.nextTaskIds.includes(taskId)) {
      return 'NEXT';
    }
    return null;
  });
