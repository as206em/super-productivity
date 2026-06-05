import { createActionGroup } from '@ngrx/store';
import { PersistentActionMeta } from '../../../op-log/core/persistent-action.interface';
import { OpType } from '../../../op-log/core/operation.types';
import { SprintTarget } from '../sprint.model';

export const SprintActions = createActionGroup({
  source: 'Sprint',
  events: {
    addTaskToSprint: (props: { taskId: string; sprint: SprintTarget }) => ({
      ...props,
      meta: {
        isPersistent: true,
        entityType: 'SPRINT',
        entityId: 'GLOBAL',
        opType: OpType.Update,
      } satisfies PersistentActionMeta,
    }),
    removeTaskFromSprint: (props: { taskId: string }) => ({
      ...props,
      meta: {
        isPersistent: true,
        entityType: 'SPRINT',
        entityId: 'GLOBAL',
        opType: OpType.Update,
      } satisfies PersistentActionMeta,
    }),
    moveTaskInSprint: (props: {
      sprint: SprintTarget;
      taskId: string;
      afterTaskId: string | null;
    }) => ({
      ...props,
      meta: {
        isPersistent: true,
        entityType: 'SPRINT',
        entityId: 'GLOBAL',
        opType: OpType.Move,
      } satisfies PersistentActionMeta,
    }),
    closeSprint: () => ({
      meta: {
        isPersistent: true,
        entityType: 'SPRINT',
        entityId: 'GLOBAL',
        opType: OpType.Update,
      } satisfies PersistentActionMeta,
    }),
  },
});

export const { addTaskToSprint, closeSprint, moveTaskInSprint, removeTaskFromSprint } =
  SprintActions;
