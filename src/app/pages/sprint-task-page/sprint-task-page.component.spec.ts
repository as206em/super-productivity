import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SprintTaskPageComponent } from './sprint-task-page.component';
import { closeSprint } from '../../features/sprint/store/sprint.actions';
import { TaskWithSubTasks } from '../../features/tasks/task.model';

@Component({
  selector: 'work-view',
  template: '',
  standalone: true,
})
class WorkViewStubComponent {
  undoneTasks = input.required<TaskWithSubTasks[]>();
  doneTasks = input.required<TaskWithSubTasks[]>();
  backlogTasks = input.required<TaskWithSubTasks[]>();
  isShowBacklog = input<boolean>(false);
  isStandaloneTaskList = input<boolean>(false);
  mainListModelId = input<string>('UNDONE');
  isMainListSortingDisabled = input<boolean>(false);
}

const createTask = (id: string, isDone: boolean): TaskWithSubTasks =>
  ({
    id,
    projectId: 'project-1',
    title: id,
    isDone,
    subTaskIds: [],
    tagIds: [],
    timeEstimate: 0,
    timeSpent: 0,
    timeSpentOnDay: {},
    attachments: [],
    created: 1,
    subTasks: [],
  }) as TaskWithSubTasks;

describe('SprintTaskPageComponent', () => {
  let fixture: ComponentFixture<SprintTaskPageComponent>;
  let component: SprintTaskPageComponent;
  let dispatchSpy: jasmine.Spy;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(true),
    } as ReturnType<MatDialog['open']>);

    await TestBed.configureTestingModule({
      imports: [SprintTaskPageComponent, TranslateModule.forRoot()],
      providers: [
        provideMockStore({
          initialState: {
            sprint: { currentTaskIds: ['task-1', 'task-2'], nextTaskIds: [] },
            tasks: {
              ids: ['task-1', 'task-2'],
              entities: {
                ['task-1']: createTask('task-1', false),
                ['task-2']: createTask('task-2', true),
              },
              currentTaskId: null,
              selectedTaskId: null,
              lastCurrentTaskId: null,
              isDataLoaded: true,
            },
            projects: {
              ids: ['project-1'],
              entities: { ['project-1']: { id: 'project-1', isArchived: false } },
            },
          },
        }),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { sprint: 'CURRENT' } } },
        },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    }).compileComponents();
    TestBed.overrideComponent(SprintTaskPageComponent, {
      set: {
        imports: [TranslatePipe, WorkViewStubComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      },
    });

    fixture = TestBed.createComponent(SprintTaskPageComponent);
    component = fixture.componentInstance;
    dispatchSpy = spyOn(component.store, 'dispatch');
    fixture.detectChanges();
  });

  it('should dispatch closeSprint after confirmation', () => {
    component.closeSprint();

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(closeSprint());
  });

  it('should not dispatch closeSprint when confirmation is cancelled', () => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(false),
    } as ReturnType<MatDialog['open']>);

    component.closeSprint();

    expect(dispatchSpy).not.toHaveBeenCalledWith(closeSprint());
  });

  it('should render sprint tasks through the shared work view', () => {
    const workView = fixture.debugElement.children.find(
      (child) => child.componentInstance instanceof WorkViewStubComponent,
    )?.componentInstance as WorkViewStubComponent | undefined;

    expect(workView).toBeTruthy();
    expect(workView?.undoneTasks().map((task) => task.id)).toEqual(['task-1']);
    expect(workView?.doneTasks().map((task) => task.id)).toEqual(['task-2']);
    expect(workView?.backlogTasks()).toEqual([]);
    expect(workView?.isShowBacklog()).toBe(false);
    expect(workView?.isStandaloneTaskList()).toBe(true);
    expect(workView?.mainListModelId()).toBe('SPRINT_CURRENT');
    expect(workView?.isMainListSortingDisabled()).toBe(true);
  });
});
