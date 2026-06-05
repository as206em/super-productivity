import { createFeatureSelector, createReducer, on } from '@ngrx/store';
import { loadAllData } from '../../../root-store/meta/load-all-data.action';
import { unique } from '../../../util/unique';
import { moveItemAfterAnchor } from '../../work-context/store/work-context-meta.helper';
import { SprintState } from '../sprint.model';
import {
  addTaskToSprint,
  closeSprint,
  moveTaskInSprint,
  removeTaskFromSprint,
} from './sprint.actions';

export const SPRINT_FEATURE_NAME = 'sprint';

export const initialSprintState: SprintState = {
  currentTaskIds: [],
  nextTaskIds: [],
};

export const selectSprintFeatureState =
  createFeatureSelector<SprintState>(SPRINT_FEATURE_NAME);

const removeTaskId = (taskIds: string[], taskId: string): string[] =>
  taskIds.filter((id) => id !== taskId);

const isSprintState = (value: unknown): value is SprintState =>
  !!value &&
  typeof value === 'object' &&
  Array.isArray((value as SprintState).currentTaskIds) &&
  Array.isArray((value as SprintState).nextTaskIds);

export const sprintReducer = createReducer<SprintState>(
  initialSprintState,

  on(loadAllData, (_state, { appDataComplete }) => {
    const sprint = (appDataComplete as { sprint?: unknown }).sprint;
    return isSprintState(sprint) ? sprint : initialSprintState;
  }),

  on(addTaskToSprint, (state, { taskId, sprint }) => {
    const currentTaskIds = removeTaskId(state.currentTaskIds, taskId);
    const nextTaskIds = removeTaskId(state.nextTaskIds, taskId);

    return sprint === 'CURRENT'
      ? {
          currentTaskIds: [...currentTaskIds, taskId],
          nextTaskIds,
        }
      : {
          currentTaskIds,
          nextTaskIds: [...nextTaskIds, taskId],
        };
  }),

  on(removeTaskFromSprint, (state, { taskId }) => ({
    currentTaskIds: removeTaskId(state.currentTaskIds, taskId),
    nextTaskIds: removeTaskId(state.nextTaskIds, taskId),
  })),

  on(moveTaskInSprint, (state, { sprint, taskId, afterTaskId }) =>
    sprint === 'CURRENT'
      ? {
          ...state,
          currentTaskIds: moveItemAfterAnchor(taskId, afterTaskId, state.currentTaskIds),
        }
      : {
          ...state,
          nextTaskIds: moveItemAfterAnchor(taskId, afterTaskId, state.nextTaskIds),
        },
  ),

  on(closeSprint, (state) => ({
    currentTaskIds: unique([...state.currentTaskIds, ...state.nextTaskIds]),
    nextTaskIds: [],
  })),
);
