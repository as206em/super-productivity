# Focus Mode Task Remaining Time Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-started Focus Mode sessions use the tracked task's remaining estimate when a task estimate exists.

**Architecture:** Extend the existing `syncTrackingStartToSession$` effect only in the no-active-session auto-spawn branch. Fetch the selected task, compute `Math.max(timeEstimate - timeSpent, 0)` when `timeEstimate > 0`, otherwise keep the current strategy duration.

**Tech Stack:** Angular, NgRx effects, Jasmine/Karma unit tests, project wiki markdown.

---

## File Structure

- Modify: `src/app/features/focus-mode/store/focus-mode.effects.spec.ts` for focused effect tests.
- Modify: `src/app/features/focus-mode/store/focus-mode.effects.ts` for the duration computation.
- Modify: `docs/wiki/4.15-Timers-and-Focus-Mode.md` to document the user-facing behavior.

### Task 1: Effect Tests

**Files:**

- Modify: `src/app/features/focus-mode/store/focus-mode.effects.spec.ts`

- [ ] **Step 1: Write failing tests**

Add tests in `describe('syncTrackingStartToSession$', () => ...)` that override `selectTaskById` for `task-123` and assert:

```ts
expect(action).toEqual(
  actions.startFocusSession({
    duration: 20 * 60 * 1000,
  }),
);
```

for a task with `timeEstimate: 60 * 60 * 1000` and `timeSpent: 40 * 60 * 1000`.

Add a zero remaining test with `timeEstimate: 60 * 60 * 1000` and `timeSpent: 75 * 60 * 1000`, expecting `duration: 0`.

Add a no-estimate test with `timeEstimate: 0`, expecting the existing Pomodoro strategy duration `25 * 60 * 1000`.

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm run test:file src/app/features/focus-mode/store/focus-mode.effects.spec.ts
```

Expected: the new remaining-estimate tests fail because the effect still dispatches the strategy duration.

### Task 2: Minimal Effect Implementation

**Files:**

- Modify: `src/app/features/focus-mode/store/focus-mode.effects.ts`

- [ ] **Step 1: Implement duration computation**

In the auto-spawn branch where `startFocusSession` is dispatched, fetch `selectTaskById` for the new task id and map it to:

```ts
const strategy = this.strategyFactory.getStrategy(mode);
const defaultDuration = strategy.initialSessionDuration;
const duration =
  task && task.timeEstimate > 0
    ? Math.max(task.timeEstimate - task.timeSpent, 0)
    : defaultDuration;
return actions.startFocusSession({ duration });
```

- [ ] **Step 2: Run focused test**

Run:

```bash
npm run test:file src/app/features/focus-mode/store/focus-mode.effects.spec.ts
```

Expected: focused spec passes.

### Task 3: Wiki Update

**Files:**

- Modify: `docs/wiki/4.15-Timers-and-Focus-Mode.md`

- [ ] **Step 1: Update the Focus Mode description**

Add one concise sentence to the time tracking integration section explaining that when Focus Mode auto-starts from a tracked task, an existing task estimate makes the session use the task's remaining estimated time.

### Task 4: Required Checks

**Files:**

- Check: `src/app/features/focus-mode/store/focus-mode.effects.ts`
- Check: `src/app/features/focus-mode/store/focus-mode.effects.spec.ts`
- Build/test: whole project

- [ ] **Step 1: Run per-file checks**

Run:

```bash
npm run checkFile src/app/features/focus-mode/store/focus-mode.effects.ts
npm run checkFile src/app/features/focus-mode/store/focus-mode.effects.spec.ts
```

Expected: both pass.

- [ ] **Step 2: Run full tests**

Run:

```bash
npm test
```

Expected: all unit tests pass.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run dist
```

Expected: project builds successfully.
