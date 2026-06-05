# Global Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a synced global sprint feature with Current Sprint and Next Sprint task lists, menu entries, task context-menu assignment, and close-sprint behavior.

**Architecture:** Add an isolated `sprint` NgRx feature slice with persistent actions and selectors. Register the slice in app-data persistence/sync model configuration, then add route/pages and task menu UI that dispatch only sprint actions.

**Tech Stack:** Angular standalone components, NgRx actions/reducer/selectors, Super Productivity op-log persistence, Angular Material menus/buttons, Jasmine/Karma tests.

---

## File Structure

- Create `src/app/features/sprint/sprint.model.ts` for `SprintState` and `SprintTarget`.
- Create `src/app/features/sprint/store/sprint.actions.ts` for persistent sprint actions.
- Create `src/app/features/sprint/store/sprint.reducer.ts` for state transitions and `loadAllData`.
- Create `src/app/features/sprint/store/sprint.selectors.ts` for ordered task selectors and task membership lookup.
- Create `src/app/features/sprint/store/sprint.reducer.spec.ts` for one-sprint-at-a-time and close-sprint tests.
- Create `src/app/features/sprint/store/sprint.selectors.spec.ts` for order and stale-id filtering.
- Create `src/app/pages/sprint-task-page/sprint-task-page.component.ts|html|scss|spec.ts` for Current/Next Sprint pages.
- Modify `src/app/root-store/feature-stores.module.ts`, `src/app/root-store/root-state.ts`, `src/app/op-log/model/model-config.ts`, `src/app/imex/sync/sync.model.ts`, and `packages/shared-schema/src/entity-types.ts` to persist and sync sprint state.
- Modify `src/app/app.routes.ts` and `src/app/routes/pages.routes.ts` to add `/sprint/current` and `/sprint/next`.
- Modify `src/app/core-ui/magic-side-nav/magic-nav-config.service.ts` to add sidebar entries.
- Modify `src/app/features/tasks/task-context-menu/task-context-menu-inner/task-context-menu-inner.component.ts|html|spec.ts` to add Add to sprint commands.
- Modify `src/app/t.const.ts` and `src/assets/i18n/en.json` for English strings.
- Modify `docs/wiki/3.06-User-Data.md` to document the persisted sprint slice.

## Tasks

### Task 1: Sprint Store

- [ ] Write reducer tests for add/remove/move/close sprint in `src/app/features/sprint/store/sprint.reducer.spec.ts`.
- [ ] Run `npm run test:file src/app/features/sprint/store/sprint.reducer.spec.ts` and verify the tests fail because the sprint store does not exist.
- [ ] Implement `sprint.model.ts`, `sprint.actions.ts`, and `sprint.reducer.ts`.
- [ ] Re-run `npm run test:file src/app/features/sprint/store/sprint.reducer.spec.ts` and verify it passes.
- [ ] Run `npm run checkFile` on the new `.ts` files.

### Task 2: Sprint Selectors

- [ ] Write selector tests in `src/app/features/sprint/store/sprint.selectors.spec.ts` for order preservation, stale-id filtering, and task membership.
- [ ] Run `npm run test:file src/app/features/sprint/store/sprint.selectors.spec.ts` and verify the tests fail because selectors do not exist.
- [ ] Implement `sprint.selectors.ts`.
- [ ] Re-run `npm run test:file src/app/features/sprint/store/sprint.selectors.spec.ts` and verify it passes.
- [ ] Run `npm run checkFile` on selector files.

### Task 3: Persistence And Sync Registration

- [ ] Add sprint to `RootState`, `FeatureStoresModule`, `MODEL_CONFIGS`, legacy sync model types, and shared `ENTITY_TYPES`.
- [ ] Add `loadAllData` handling in `sprint.reducer.ts`.
- [ ] Add or update validation test data helpers if required by app-data validation tests.
- [ ] Run `npm run test:file src/app/op-log/validation/state-validity-after-actions.spec.ts` and `npm run test:file src/app/op-log/model/model-config.spec.ts` if present, otherwise run `npm run test:file src/app/op-log/validation/validate-state.service.spec.ts`.
- [ ] Run `npm run checkFile` on every modified `.ts` file.

### Task 4: Sprint Pages And Routes

- [ ] Write a page/component test for close-sprint confirmation dispatch in `src/app/pages/sprint-task-page/sprint-task-page.component.spec.ts`.
- [ ] Run `npm run test:file src/app/pages/sprint-task-page/sprint-task-page.component.spec.ts` and verify it fails because the page does not exist.
- [ ] Implement the sprint task page component and add `/sprint/current` and `/sprint/next` routes.
- [ ] Add sidebar entries for Current Sprint and Next Sprint.
- [ ] Re-run the page test and route-related check files.
- [ ] Run `npm run checkFile` on modified page, route, and sidebar files.

### Task 5: Task Context Menu

- [ ] Add context-menu component tests for dispatching Current Sprint, Next Sprint, and Remove from sprint.
- [ ] Run `npm run test:file src/app/features/tasks/task-context-menu/task-context-menu-inner/task-context-menu-inner.component.spec.ts` and verify the new tests fail.
- [ ] Add submenu UI and dispatch methods in `task-context-menu-inner`.
- [ ] Re-run the context-menu tests.
- [ ] Run `npm run checkFile` on modified task context-menu files.

### Task 6: Translations And Docs

- [ ] Add new keys in `src/app/t.const.ts` and English strings in `src/assets/i18n/en.json`.
- [ ] Update `docs/wiki/3.06-User-Data.md` to include sprint state in persisted user data.
- [ ] Run `npm run checkFile src/app/t.const.ts`.

### Task 7: Final Verification

- [ ] Run all targeted test files changed by this implementation.
- [ ] Run `npm run checkFile` for every modified `.ts` and `.scss` file.
- [ ] Run `git status --short` and review the final diff.
