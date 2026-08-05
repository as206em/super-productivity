import { computed, inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { TaskSharedActions } from '../../root-store/meta/task-shared.actions';
import { TaskWithSubTasks } from './task.model';
import { TaskService } from './task.service';

/**
 * Which tasks are currently multi-selected, and the bulk actions that apply
 * to them.
 *
 * This is ephemeral view state — it is never persisted and never synced, so
 * it lives in a service rather than NgRx. Nothing here survives a reload,
 * which is the correct behaviour: a selection is a gesture in progress.
 *
 * Every bulk action dispatches ONE action carrying every id, using the
 * existing `isBulk` shared actions. Looping N single-task dispatches would
 * write N operations to the log for what the user experienced as one intent,
 * and would need the bulk-dispatch `setTimeout` dance to avoid dropping state.
 */
@Injectable({ providedIn: 'root' })
export class TaskSelectionService {
  private readonly _store = inject(Store);
  private readonly _taskService = inject(TaskService);

  private readonly _selectedIds = signal<ReadonlySet<string>>(new Set());

  /** The id a shift-click measures its range from. */
  private _anchorId: string | null = null;

  readonly selectedIds = this._selectedIds.asReadonly();
  readonly count = computed(() => this._selectedIds().size);

  /**
   * True once more than one task is selected. A single selected task is just
   * the detail panel's subject, so the selection bar stays out of the way
   * until the gesture is actually a multi-selection.
   */
  readonly isMultiSelectActive = computed(() => this._selectedIds().size > 1);

  isSelected(id: string): boolean {
    return this._selectedIds().has(id);
  }

  clear(): void {
    if (this._selectedIds().size) {
      this._selectedIds.set(new Set());
    }
    this._anchorId = null;
  }

  /** Cmd/Ctrl-click: add or remove one task without disturbing the rest. */
  toggle(id: string): void {
    const next = new Set(this._selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      this._anchorId = id;
    }
    this._selectedIds.set(next);
  }

  /**
   * Shift-click: select everything between the anchor and this task, in the
   * order the list is actually rendered. `visibleIds` comes from the list so
   * the range follows what the user can see rather than any underlying order.
   */
  selectRange(id: string, visibleIds: readonly string[]): void {
    const anchor = this._anchorId;
    if (!anchor || anchor === id) {
      this.selectOnly(id);
      return;
    }
    const from = visibleIds.indexOf(anchor);
    const to = visibleIds.indexOf(id);
    if (from === -1 || to === -1) {
      this.selectOnly(id);
      return;
    }
    const [lo, hi] = from < to ? [from, to] : [to, from];
    this._selectedIds.set(new Set(visibleIds.slice(lo, hi + 1)));
  }

  selectOnly(id: string): void {
    this._selectedIds.set(new Set([id]));
    this._anchorId = id;
  }

  /**
   * The ids to act on for a gesture that started on `id`. Dragging or
   * right-clicking a row that is part of the selection acts on the whole
   * selection; doing it on a row outside the selection acts on that row alone,
   * which is what every file manager does.
   */
  idsForGesture(id: string): string[] {
    return this.isSelected(id) ? [...this._selectedIds()] : [id];
  }

  // ---------------------------------------------------------------------------
  // Bulk actions — one dispatch each, carrying every id.
  // ---------------------------------------------------------------------------

  markDone(isDone = true): void {
    const ids = [...this._selectedIds()];
    if (!ids.length) return;
    this._store.dispatch(
      TaskSharedActions.updateTasks({
        tasks: ids.map((id) => ({ id, changes: { isDone } })),
      }),
    );
    this.clear();
  }

  addToToday(): void {
    const ids = [...this._selectedIds()];
    if (!ids.length) return;
    this._store.dispatch(
      TaskSharedActions.planTasksForToday({ taskIds: ids, isShowSnack: true }),
    );
    this.clear();
  }

  removeFromToday(): void {
    const ids = [...this._selectedIds()];
    if (!ids.length) return;
    this._store.dispatch(TaskSharedActions.removeTasksFromTodayTag({ taskIds: ids }));
    this.clear();
  }

  /**
   * `moveToProject` is per-task in the shared actions and needs the resolved
   * task with its subtasks, so this is the one bulk path that fans out. The
   * caller passes the already-resolved tasks; the trailing await drains the
   * queue, per the bulk-dispatch rule in the sync model.
   */
  async moveToProject(
    projectId: string,
    tasks: readonly TaskWithSubTasks[],
  ): Promise<void> {
    const selected = this.resolve(tasks);
    if (!selected.length) return;
    for (const task of selected) {
      this._taskService.moveToProject(task, projectId);
    }
    // Without this a run of rapid dispatches loses state — see
    // docs/sync-and-op-log/contributor-sync-model.md.
    await new Promise((r) => setTimeout(r, 0));
    this.clear();
  }

  delete(): void {
    const ids = [...this._selectedIds()];
    if (!ids.length) return;
    this._store.dispatch(TaskSharedActions.deleteTasks({ taskIds: ids }));
    this.clear();
  }

  /** Selected tasks, resolved for actions that need the whole entity. */
  resolve(all: readonly TaskWithSubTasks[]): TaskWithSubTasks[] {
    const ids = this._selectedIds();
    return all.filter((t) => ids.has(t.id));
  }
}
