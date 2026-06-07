import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectAllProjects } from '../../project/store/project.selectors';
import { selectAllSections } from '../../section/store/section.selectors';
import { selectTodayStr } from '../../../root-store/app-state/app-state.selectors';
import { WorkContextType } from '../../work-context/work-context.model';
import { WorkContextService } from '../../work-context/work-context.service';
import { Task } from '../task.model';
import {
  buildTaskScoreContextByTaskId,
  calculateTaskScoreWithContext,
  TaskScoreResult,
} from './task-score.util';

@Injectable({ providedIn: 'root' })
export class TaskScoreService {
  private readonly _store = inject(Store);
  private readonly _workContextService = inject(WorkContextService);
  private readonly _projects = toSignal(this._store.select(selectAllProjects), {
    initialValue: [],
  });
  private readonly _sections = toSignal(this._store.select(selectAllSections), {
    initialValue: [],
  });
  private readonly _today = toSignal(this._store.select(selectTodayStr), {
    initialValue: undefined,
  });

  getScoreResult(
    task: Pick<Task, 'id' | 'projectId' | 'effort' | 'value' | 'dueDay' | 'deadlineDay'>,
  ): TaskScoreResult | undefined {
    const neutralProjectId =
      this._workContextService.activeWorkContextType === WorkContextType.PROJECT
        ? this._workContextService.activeWorkContextId
        : undefined;
    const contextByTaskId = buildTaskScoreContextByTaskId(
      [task],
      this._projects(),
      this._sections(),
      this._today(),
      neutralProjectId,
    );
    const context = contextByTaskId.get(task.id);
    return calculateTaskScoreWithContext({
      ...context,
      effort: task.effort,
      value: task.value,
      dueDay: task.dueDay,
      deadlineDay: task.deadlineDay,
    });
  }

  getScoreTooltip(result: TaskScoreResult | undefined): string {
    if (!result) return '';
    return result.parts.map((part) => `${part.label}: ${part.value}`).join('\n');
  }
}
