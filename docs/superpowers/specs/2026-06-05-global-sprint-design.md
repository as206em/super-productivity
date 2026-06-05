# Global Sprint Design

## Goal

Add a global sprint planning concept with two independent task lists: Current Sprint and Next Sprint. Sprint membership is only planning metadata and must not change existing task, project, tag, backlog, Today/My Day, due date, reminder, archive, or time-tracking behavior.

## Behavior

- The app has exactly two global sprint lists:
  - Current Sprint
  - Next Sprint
- A task can be in only one sprint list at a time.
- Adding a task to Current Sprint removes it from Next Sprint first.
- Adding a task to Next Sprint removes it from Current Sprint first.
- Removing a task from sprint removes it from both sprint lists.
- Closing the sprint appends the Next Sprint task ids after the existing Current Sprint task ids, removes duplicates defensively, and clears Next Sprint.
- Sprint list ordering is independent from all existing task ordering.
- Deleted or archived tasks must not break sprint views. Selectors should ignore task ids that are not present in the active task entity state.

## Architecture

Add a new global `sprint` store slice instead of storing sprint membership on tasks or using tags.

```ts
interface SprintState {
  currentTaskIds: string[];
  nextTaskIds: string[];
}
```

This keeps sprint state isolated from synced task/project/tag reducers and avoids accidental changes to existing workflows. Sprint actions should update only the sprint slice.

Expected actions:

- `addTaskToSprint({ taskId, sprint })`
- `removeTaskFromSprint({ taskId })`
- `moveTaskInSprint({ sprint, taskId, afterTaskId })`
- `closeSprint()`

Expected selectors:

- `selectCurrentSprintTasks`
- `selectNextSprintTasks`
- `selectSprintForTask(taskId)`

Sprint state must use the same persistence, backup/import, and sync infrastructure as other app data. Sprint actions should be persistent and replayable, and remote replay must only update sprint arrays. The sprint slice should be part of exported and imported app data once it is added to the persisted model. Data repair and import handling should tolerate stale task ids.

## UI

Add two global menu entries:

- Current Sprint
- Next Sprint

Each entry opens a sprint task page showing active tasks from the matching sprint list in sprint order.

Add a task context-menu submenu:

- Add to sprint
  - Current Sprint
  - Next Sprint
  - Remove from sprint, shown or enabled when the task is already in either sprint

Add a Close Sprint button to the Current Sprint page. It should confirm before dispatching the close action because it changes a whole sprint list.

## Documentation

Update English translations only for new UI strings.

Because this adds a user-facing feature and a new persisted app-data shape, update the wiki note that documents user data, export, or backup/import behavior.

## Testing

Add focused tests for:

- Adding to Current Sprint removes the task from Next Sprint.
- Adding to Next Sprint removes the task from Current Sprint.
- Removing from sprint removes the task from both lists.
- Closing sprint appends Next Sprint after Current Sprint and clears Next Sprint.
- Closing sprint de-duplicates task ids defensively.
- Sprint selectors preserve sprint order and filter missing active task ids.
- Context-menu actions dispatch the correct sprint assignment or removal action.
- The Current Sprint page close button dispatches the close action after confirmation.
