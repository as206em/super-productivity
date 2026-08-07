import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { DateService } from '../../core/date/date.service';
import { PlannerActions } from './store/planner.actions';
import { selectTaskFeatureState } from '../tasks/store/task.selectors';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { T } from '../../t.const';
import { msToString } from '../../ui/duration/ms-to-string.pipe';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { PlannerPlanViewComponent } from './planner-plan-view/planner-plan-view.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { PlannerCalendarNavComponent } from './planner-calendar-nav/planner-calendar-nav.component';
import { PlannerService } from './planner.service';
import { LayoutService } from '../../core-ui/layout/layout.service';

@Component({
  selector: 'planner',
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkDropListGroup,
    PlannerPlanViewComponent,
    CdkScrollable,
    PlannerCalendarNavComponent,
  ],
})
export class PlannerComponent {
  private _store = inject(Store);
  private _dateService = inject(DateService);
  private _plannerService = inject(PlannerService);
  layoutService = inject(LayoutService);

  readonly T = T;

  private _days = toSignal(this._plannerService.days$, { initialValue: [] });

  /**
   * The planner's headline and meta line, matching the sticky toolbar every
   * list view carries. Built here rather than in the template so the empty
   * parts drop out instead of printing zeros.
   */
  readonly rangeLabel = computed<string>(() => {
    const days = this._days();
    if (!days.length) {
      return 'This week';
    }
    const fmt = (d: string): string =>
      new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    return `${fmt(days[0].dayDate)} – ${fmt(days[days.length - 1].dayDate)}`;
  });

  readonly rangeMeta = computed<string>(() => {
    const days = this._days();
    const parts: string[] = [];
    const planned = days.reduce((acc, d) => acc + d.tasks.length, 0);
    if (planned) {
      parts.push(`${planned} ${planned === 1 ? 'task' : 'tasks'} planned`);
    }
    const estimate = days.reduce((acc, d) => acc + (d.timeEstimate || 0), 0);
    if (estimate) {
      parts.push(`${msToString(estimate, false, true)} estimated`);
    }
    const freeDays = days.filter((d) => !d.itemsTotal).length;
    if (freeDays) {
      parts.push(`${freeDays} free`);
    }
    return parts.join(' · ');
  });
  private _prevDaysWithTasksKey = '';
  private _prevDaysWithTasks: ReadonlySet<string> = new Set();
  daysWithTasks = computed<ReadonlySet<string>>(() => {
    const days = this._days();
    const dayDates: string[] = [];
    for (const day of days) {
      if (day.tasks.length > 0) {
        dayDates.push(day.dayDate);
      }
    }
    const key = dayDates.join(',');
    if (key === this._prevDaysWithTasksKey) {
      return this._prevDaysWithTasks;
    }
    this._prevDaysWithTasksKey = key;
    this._prevDaysWithTasks = new Set(dayDates);
    return this._prevDaysWithTasks;
  });

  constructor() {
    this._store
      .select(selectTaskFeatureState)
      .pipe(takeUntilDestroyed())
      .subscribe((taskState) => {
        this._store.dispatch(
          PlannerActions.cleanupOldAndUndefinedPlannerTasks({
            today: this._dateService.todayStr(),
            allTaskIds: taskState.ids as string[],
          }),
        );
      });
  }
}
