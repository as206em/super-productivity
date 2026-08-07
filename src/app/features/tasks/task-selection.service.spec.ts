import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideMockStore } from '@ngrx/store/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { TaskSelectionService } from './task-selection.service';
import { TaskService } from './task.service';
import { GlobalConfigService } from '../config/global-config.service';

describe('TaskSelectionService', () => {
  let service: TaskSelectionService;
  let taskService: jasmine.SpyObj<TaskService>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let cfg: ReturnType<typeof signal>;

  const openReturning = (result: boolean | undefined): void => {
    matDialog.open.and.returnValue({ afterClosed: () => of(result) } as never);
  };

  beforeEach(() => {
    taskService = jasmine.createSpyObj('TaskService', [
      'removeMultipleTasks',
      'moveToProject',
    ]);
    matDialog = jasmine.createSpyObj('MatDialog', ['open']);
    cfg = signal({ tasks: { isConfirmBeforeDelete: true } });

    TestBed.configureTestingModule({
      providers: [
        provideMockStore(),
        { provide: TaskService, useValue: taskService },
        { provide: MatDialog, useValue: matDialog },
        { provide: GlobalConfigService, useValue: { cfg } },
      ],
    });
    service = TestBed.inject(TaskSelectionService);
  });

  describe('delete', () => {
    beforeEach(() => {
      service.toggle('a');
      service.toggle('b');
    });

    it('should confirm before deleting a selection', async () => {
      openReturning(true);

      await service.delete();

      expect(matDialog.open).toHaveBeenCalled();
      expect(taskService.removeMultipleTasks).toHaveBeenCalledWith(['a', 'b']);
    });

    it('should delete nothing when the confirmation is cancelled', async () => {
      openReturning(false);

      const wasDeleted = await service.delete();

      expect(wasDeleted).toBe(false);
      expect(taskService.removeMultipleTasks).not.toHaveBeenCalled();
      // A cancelled delete has to leave the selection alone so the user can
      // try again without re-picking every row.
      expect(service.count()).toBe(2);
    });

    it('should skip the prompt when isConfirmBeforeDelete is off', async () => {
      cfg.set({ tasks: { isConfirmBeforeDelete: false } });

      await service.delete();

      expect(matDialog.open).not.toHaveBeenCalled();
      expect(taskService.removeMultipleTasks).toHaveBeenCalledWith(['a', 'b']);
    });

    it('should route through removeMultipleTasks so the delete sidecars are filled', async () => {
      openReturning(true);

      await service.delete();

      // Dispatching `deleteTasks` directly would strand linked issues and
      // time blocks: `deleteIssueOnBulkTaskDelete$` reads the sidecar that
      // only `removeMultipleTasks` populates.
      expect(taskService.removeMultipleTasks).toHaveBeenCalledTimes(1);
    });

    it('should do nothing without a selection', async () => {
      service.clear();

      const wasDeleted = await service.delete();

      expect(wasDeleted).toBe(false);
      expect(matDialog.open).not.toHaveBeenCalled();
      expect(taskService.removeMultipleTasks).not.toHaveBeenCalled();
    });
  });

  describe('idsForGesture', () => {
    it('should return the whole selection for a row inside it', () => {
      service.toggle('a');
      service.toggle('b');

      expect(service.idsForGesture('a')).toEqual(['a', 'b']);
    });

    it('should return only the row when it is outside the selection', () => {
      service.toggle('a');
      service.toggle('b');

      expect(service.idsForGesture('zzz')).toEqual(['zzz']);
    });
  });
});
