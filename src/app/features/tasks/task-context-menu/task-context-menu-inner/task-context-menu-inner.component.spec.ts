import { TaskContextMenuInnerComponent } from './task-context-menu-inner.component';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TaskService } from '../../task.service';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TaskRepeatCfgService } from '../../../task-repeat-cfg/task-repeat-cfg.service';
import { MatDialog } from '@angular/material/dialog';
import { IssueService } from '../../../issue/issue.service';
import { SnackService } from '../../../../core/snack/snack.service';
import { ProjectService } from '../../../project/project.service';
import { GlobalConfigService } from '../../../config/global-config.service';
import { TagService } from '../../../tag/tag.service';
import { TranslateModule } from '@ngx-translate/core';
import { WorkContextService } from '../../../work-context/work-context.service';
import { TaskFocusService } from '../../task-focus.service';
import { LocaleDatePipe } from 'src/app/ui/pipes/locale-date.pipe';
import { DateAdapter } from '@angular/material/core';
import { of } from 'rxjs';
import { selectTaskByIdWithSubTaskData } from '../../store/task.selectors';
import { addSubTask } from '../../store/task.actions';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  addTaskToSprint,
  removeTaskFromSprint,
} from '../../../sprint/store/sprint.actions';

describe('TaskContextMenuInnerComponent', () => {
  let component: TaskContextMenuInnerComponent;
  let fixture: ComponentFixture<TaskContextMenuInnerComponent>;
  let taskService: jasmine.SpyObj<TaskService>;
  let store: MockStore;

  beforeEach(async () => {
    taskService = jasmine.createSpyObj('TaskService', [
      'add',
      'createNewTaskWithDefaults',
      'currentTaskId',
    ]);
    taskService.currentTaskId.and.returnValue('some-id');

    await TestBed.configureTestingModule({
      imports: [
        TaskContextMenuInnerComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideMockStore(),
        { provide: TaskService, useValue: taskService },
        {
          provide: TaskRepeatCfgService,
          useValue: { getTaskRepeatCfgById$: () => of(null) },
        },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of() }) } },
        {
          provide: IssueService,
          useValue: { issueLink: () => Promise.resolve('') },
        },
        { provide: SnackService, useValue: {} },
        {
          provide: ProjectService,
          useValue: {
            getProjectsWithoutIdSorted$: () => of([]),
            getByIdOnce$: () => of({}),
          },
        },
        {
          provide: GlobalConfigService,
          useValue: {
            appFeatures: () => ({
              isFocusModeEnabled: true,
              isTimeTrackingEnabled: true,
            }),
            cfg: () => ({ reminder: {}, tasks: {} }),
          },
        },
        { provide: TagService, useValue: { tagsNoMyDayAndNoListSorted: signal([]) } },
        { provide: WorkContextService, useValue: { activeWorkContext$: of({}) } },
        {
          provide: TaskFocusService,
          useValue: {
            focusedTaskId: { set: () => {} },
            isTaskContextMenuOpen: { set: () => {} },
          },
        },
        { provide: LocaleDatePipe, useValue: {} },
        { provide: DateAdapter, useValue: { getFirstDayOfWeek: () => 0 } },
      ],
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(TaskContextMenuInnerComponent);
    component = fixture.componentInstance;
    component.task = {
      id: 'TASK_ID',
      title: 'Task',
      projectId: 'P1',
      tagIds: [],
      subTaskIds: [],
      timeEstimate: 0,
    } as any;
    store = TestBed.inject(MockStore);
  });

  afterEach(() => {
    selectTaskByIdWithSubTaskData.release();
    store.resetSelectors();
  });

  describe('sprint actions', () => {
    beforeEach(() => {
      component.task = {
        id: 'TASK_ID',
        title: 'Task',
        projectId: 'P1',
        tagIds: [],
        subTaskIds: [],
      } as any;
      spyOn(store, 'dispatch');
    });

    it('should dispatch addTaskToSprint for current sprint', () => {
      component.addToSprint('CURRENT');

      expect(store.dispatch).toHaveBeenCalledWith(
        addTaskToSprint({ taskId: 'TASK_ID', sprint: 'CURRENT' }),
      );
    });

    it('should dispatch addTaskToSprint for next sprint', () => {
      component.addToSprint('NEXT');

      expect(store.dispatch).toHaveBeenCalledWith(
        addTaskToSprint({ taskId: 'TASK_ID', sprint: 'NEXT' }),
      );
    });

    it('should dispatch removeTaskFromSprint', () => {
      component.removeFromSprint();

      expect(store.dispatch).toHaveBeenCalledWith(
        removeTaskFromSprint({ taskId: 'TASK_ID' }),
      );
    });
  });

  describe('duplicate()', () => {
    it('should duplicate subtasks with timeEstimate and notes', fakeAsync(() => {
      const mockTask = {
        id: 'PARENT_ID',
        title: 'Parent Task',
        projectId: 'P1',
        tagIds: [],
        subTaskIds: ['SUB_ID'],
      } as any;

      const mockSubTask = {
        id: 'SUB_ID',
        title: 'Sub Task',
        isDone: true,
        projectId: 'P1',
        timeEstimate: 3600000,
        notes: 'Some notes',
      };

      const mockTaskWithSubTasks = {
        ...mockTask,
        subTasks: [mockSubTask],
      };

      component.task = mockTask;
      taskService.add.and.returnValue('NEW_PARENT_ID');
      taskService.createNewTaskWithDefaults.and.returnValue({
        id: 'NEW_SUB_ID',
      } as any);

      store.overrideSelector(selectTaskByIdWithSubTaskData, mockTaskWithSubTasks);
      spyOn(store, 'dispatch');

      component.duplicate();
      tick(50); // for the delay(50) in _getTaskWithSubtasks

      expect(taskService.add).toHaveBeenCalledWith(
        'Parent Task (copy)',
        false,
        jasmine.objectContaining({ projectId: 'P1' }),
        false,
      );

      expect(taskService.createNewTaskWithDefaults).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Sub Task',
          additional: jasmine.objectContaining({
            timeEstimate: 3600000,
            notes: 'Some notes',
            isDone: true,
            projectId: 'P1',
          }),
        }),
      );

      expect(store.dispatch).toHaveBeenCalledWith(
        addSubTask({
          task: { id: 'NEW_SUB_ID' } as any,
          parentId: 'NEW_PARENT_ID',
        }),
      );
    }));

    it('should duplicate parent task with notes', fakeAsync(() => {
      const mockTask = {
        id: 'PARENT_ID',
        title: 'Parent Task',
        projectId: 'P1',
        tagIds: [],
        subTaskIds: [],
        notes: 'My important notes',
      } as any;

      component.task = mockTask;
      taskService.add.and.returnValue('NEW_PARENT_ID');

      component.duplicate();
      tick(50);

      expect(taskService.add).toHaveBeenCalledWith(
        'Parent Task (copy)',
        false,
        jasmine.objectContaining({ notes: 'My important notes' }),
        false,
      );
    }));

    it('should not include notes when parent task has no notes', fakeAsync(() => {
      const mockTask = {
        id: 'PARENT_ID',
        title: 'Parent Task',
        projectId: 'P1',
        tagIds: [],
        subTaskIds: [],
        notes: '',
      } as any;

      component.task = mockTask;
      taskService.add.and.returnValue('NEW_PARENT_ID');

      component.duplicate();
      tick(50);

      const callArgs = taskService.add.calls.mostRecent().args[2] as any;
      expect(callArgs.notes).toBeUndefined();
    }));
  });

  describe('getElementById for task ID lookup', () => {
    it('should use getElementById for task ID in focusRelatedTaskOrNext', fakeAsync(() => {
      component.task = {
        id: 'task-with-{special}-chars',
        title: 'Test',
        projectId: 'P1',
        tagIds: [],
        subTaskIds: [],
      } as any;

      const getByIdSpy = spyOn(document, 'getElementById').and.returnValue(null);

      component.focusRelatedTaskOrNext();
      tick(100);

      expect(getByIdSpy).toHaveBeenCalledWith('t-task-with-{special}-chars');
    }));
  });

  describe('quick shortcut options', () => {
    it('uses four estimate shortcuts from 30 minutes to 4 hours', () => {
      expect(component.estimateShortcutOptions.map((option) => option.ms)).toEqual([
        30 * 60 * 1000,
        60 * 60 * 1000,
        2 * 60 * 60 * 1000,
        4 * 60 * 60 * 1000,
      ]);
    });

    it('uses four score shortcuts for value and effort', () => {
      expect(component.scoreShortcutLevels).toEqual(['xhigh', 'high', 'mid', 'low']);
    });
  });

  describe('template layout', () => {
    const getMenuItems = (): HTMLElement[] =>
      Array.from(document.querySelectorAll('.cdk-overlay-container [mat-menu-item]'));
    const getQuickAccessRows = (): HTMLElement[] =>
      Array.from(document.querySelectorAll('.cdk-overlay-container .quick-access'));

    const getMenuItemTexts = (): string[] =>
      getMenuItems()
        .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '')
        .filter(Boolean);
    const getMenuContentChildTexts = (): string[] =>
      Array.from(
        document.querySelectorAll('.cdk-overlay-container .mat-mdc-menu-content > *'),
      ).map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
    const getQuickAccessIcons = (row: HTMLElement): string[] =>
      Array.from(row.querySelectorAll('button')).map(
        (button) => button.querySelector('mat-icon')?.textContent?.trim() ?? '',
      );

    const openMenu = (): void => {
      component.contextMenuTrigger()?.openMenu();
      fixture.detectChanges();
    };

    beforeEach(() => {
      component.task = {
        id: 'TASK_ID',
        title: 'Task',
        projectId: 'P1',
        tagIds: [],
        subTaskIds: [],
        timeEstimate: 0,
      } as any;
      fixture.componentRef.setInput('isAdvancedControls', true);
      fixture.detectChanges();
    });

    afterEach(fakeAsync(() => {
      component.contextMenuTrigger()?.closeMenu();
      tick();
    }));

    it('shows sprint actions directly after the schedule shortcuts', fakeAsync(() => {
      openMenu();
      tick();
      const rows = getQuickAccessRows();

      expect(getQuickAccessIcons(rows[1])).toEqual([
        'flag',
        'outlined_flag',
        'flag_circle',
      ]);
    }));

    it('does not show submenu trigger items for sprint, estimate, value, or effort', fakeAsync(() => {
      openMenu();
      tick();
      const texts = getMenuItemTexts();

      expect(texts).not.toContain('SPRINT.ADD_TO_SPRINT');
      expect(texts.filter((text) => text.includes('F.TASK.CMP.ESTIMATE'))).toEqual([]);
      expect(texts.filter((text) => text.includes('F.TASK.CMP.VALUE'))).toEqual([]);
      expect(texts.filter((text) => text.includes('F.TASK.CMP.EFFORT'))).toEqual([]);
    }));

    it('shows estimate, value, and effort before focus session', fakeAsync(() => {
      openMenu();
      tick();
      // The axis rows are found by their leading icon: the names moved into
      // that icon's tooltip, so they are no longer rendered as row text.
      const texts = getMenuContentChildTexts();
      const estimateIndex = texts.findIndex((text) => text.includes('hourglass_empty'));
      const valueIndex = texts.findIndex((text) => text.includes('hotel_class'));
      const effortIndex = texts.findIndex((text) => text.includes('fitness_center'));
      const focusIndex = texts.findIndex((text) =>
        text.includes('F.TASK.CMP.FOCUS_SESSION'),
      );

      expect(estimateIndex).toBeGreaterThan(-1);
      expect(valueIndex).toBeGreaterThan(-1);
      expect(effortIndex).toBeGreaterThan(-1);
      expect(focusIndex).toBeGreaterThan(-1);
      expect(estimateIndex).toBeLessThan(focusIndex);
      expect(valueIndex).toBeLessThan(focusIndex);
      expect(effortIndex).toBeLessThan(focusIndex);
    }));

    it('moves duplicate after tags and project management actions', fakeAsync(() => {
      openMenu();
      tick();
      const texts = getMenuItemTexts();
      const duplicateIndex = texts.findIndex((text) =>
        text.includes('F.TASK.CMP.DUPLICATE'),
      );
      const toggleTagsIndex = texts.findIndex((text) =>
        text.includes('F.TASK.CMP.TOGGLE_TAGS'),
      );

      expect(duplicateIndex).toBeGreaterThan(toggleTagsIndex);
    }));
  });
});
