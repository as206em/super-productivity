import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, tap } from 'rxjs/operators';
import { SprintTarget } from '../../features/sprint/sprint.model';
import {
  selectCurrentSprintTasks,
  selectNextSprintTasks,
} from '../../features/sprint/store/sprint.selectors';
import { closeSprint } from '../../features/sprint/store/sprint.actions';
import { DialogConfirmComponent } from '../../ui/dialog-confirm/dialog-confirm.component';
import { T } from '../../t.const';
import { WorkViewComponent } from '../../features/work-view/work-view.component';

@Component({
  selector: 'sprint-task-page',
  templateUrl: './sprint-task-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, TranslatePipe, WorkViewComponent],
})
export class SprintTaskPageComponent {
  readonly store = inject(Store);
  private readonly _route = inject(ActivatedRoute);
  private readonly _matDialog = inject(MatDialog);

  readonly T = T;
  readonly sprint = this._route.snapshot.data['sprint'] as SprintTarget;
  readonly isCurrentSprint = this.sprint === 'CURRENT';
  readonly listModelId = `SPRINT_${this.sprint}`;

  readonly tasks = toSignal(
    this.store.select(
      this.isCurrentSprint ? selectCurrentSprintTasks : selectNextSprintTasks,
    ),
    { initialValue: [] },
  );
  readonly undoneTasks = computed(() => this.tasks().filter((task) => !task.isDone));
  readonly doneTasks = computed(() => this.tasks().filter((task) => task.isDone));

  closeSprint(): void {
    this._matDialog
      .open(DialogConfirmComponent, {
        data: {
          title: T.SPRINT.CLOSE_CONFIRM_TITLE,
          message: T.SPRINT.CLOSE_CONFIRM_MSG,
          okTxt: T.SPRINT.CLOSE_CONFIRM_OK,
        },
        restoreFocus: true,
      })
      .afterClosed()
      .pipe(
        filter((isConfirm) => isConfirm === true),
        tap(() => this.store.dispatch(closeSprint())),
      )
      .subscribe();
  }
}
