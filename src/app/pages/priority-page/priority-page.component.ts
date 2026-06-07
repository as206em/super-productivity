import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslatePipe } from '@ngx-translate/core';

import {
  WorkViewComponent,
  WorkViewTaskList,
} from '../../features/work-view/work-view.component';
import { selectAllProjects } from '../../features/project/store/project.selectors';
import { selectAllSections } from '../../features/section/store/section.selectors';
import {
  selectPriorityTasks,
  selectPriorityTasksWithIncompleteScore,
} from '../../features/tasks/store/task.selectors';
import { T } from '../../t.const';
import { groupPriorityTasks, PriorityGroupMode } from './priority-page.util';

@Component({
  selector: 'priority-page',
  templateUrl: './priority-page.component.html',
  styleUrl: './priority-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    MatSlideToggle,
    TranslatePipe,
    WorkViewComponent,
  ],
})
export class PriorityPageComponent {
  private readonly _store = inject(Store);

  readonly T = T;
  readonly groupMode = signal<PriorityGroupMode>('none');
  readonly isShowIncompleteScoreTasks = signal(false);
  readonly scoredTasks = toSignal(this._store.select(selectPriorityTasks), {
    initialValue: [],
  });
  readonly tasksWithIncompleteScore = toSignal(
    this._store.select(selectPriorityTasksWithIncompleteScore),
    {
      initialValue: [],
    },
  );
  readonly tasks = computed(() =>
    this.isShowIncompleteScoreTasks()
      ? this.tasksWithIncompleteScore()
      : this.scoredTasks(),
  );

  readonly projects = toSignal(this._store.select(selectAllProjects), {
    initialValue: [],
  });
  readonly sections = toSignal(this._store.select(selectAllSections), {
    initialValue: [],
  });
  readonly customizedTasks = computed<WorkViewTaskList>(() => {
    const tasks = this.tasks();
    const groups = groupPriorityTasks(
      tasks,
      this.projects(),
      this.sections(),
      this.groupMode(),
    );

    return {
      list: tasks,
      ...(groups.length
        ? {
            grouped: groups.reduce<Record<string, typeof tasks>>((acc, group) => {
              acc[group.label] = group.tasks;
              return acc;
            }, {}),
          }
        : {}),
    };
  });

  setGroupMode(mode: PriorityGroupMode): void {
    this.groupMode.set(mode);
  }
}
