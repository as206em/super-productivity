# Focus Mode Task Remaining Time Design

## Goal

When the user starts time tracking for a task and Focus Mode auto-start is enabled, the new focus session should use the task's remaining estimate instead of the focus mode's standard duration.

## Behavior

- If Focus Mode is disabled, nothing changes.
- If `autoStartFocusOnPlay` is disabled, nothing changes.
- If there is already an active or paused focus session, existing resume, pause, and break-sync behavior is unchanged.
- If no focus session is active and a task starts tracking from the main Focus Mode screen, auto-start a focus session as today.
- If the tracked task has no estimate (`timeEstimate <= 0`), use the current Focus Mode strategy duration as today.
- If the tracked task has an estimate, use `Math.max(task.timeEstimate - task.timeSpent, 0)` as the session duration.
- If the remaining estimate is `0`, preserve the existing zero-duration behavior: the session completes immediately on the next tick and shows the session-complete screen.

## Architecture

Keep the change inside `FocusModeEffects.syncTrackingStartToSession$`, where task tracking already starts or resumes focus sessions. The effect will fetch the selected task only for the auto-spawn branch, compute an optional duration override, and dispatch the existing `startFocusSession` action.

No new actions, reducer fields, settings, or UI components are required.

## Documentation

Update the Focus Mode wiki note to describe that auto-started focus sessions use a task's remaining estimate when one exists.

## Testing

Add focused effect tests for:

- Auto-start uses positive task remaining estimate.
- Auto-start uses `0` when an estimated task is already at or over its estimate.
- Auto-start falls back to the strategy duration when the task has no estimate.
