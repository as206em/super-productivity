import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
  effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatIcon } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TaskService } from '../../features/tasks/task.service';
import { LayoutService } from '../layout/layout.service';
import { showFocusOverlay } from '../../features/focus-mode/store/focus-mode.actions';
import { SyncWrapperService } from '../../imex/sync/sync-wrapper.service';
import { Task } from '../../features/tasks/task.model';
import { NavigateToTaskService } from '../../core-ui/navigate-to-task/navigate-to-task.service';

interface PaletteCommand {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly keys: string;
  readonly run: () => void;
}

/**
 * The command palette. 560px overlay at 96px from the top, an `Actions`
 * section then `Tasks`, over a blurred scrim.
 *
 * This is where the header's removed icon buttons live. Keyboard is an
 * accelerator here, not the interface — every action in this list is also
 * reachable by mouse from the rail or the Display menu, and the shortcut
 * hints are shown but never required.
 */
@Component({
  selector: 'command-palette',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  private readonly _router = inject(Router);
  private readonly _store = inject(Store);
  private readonly _taskService = inject(TaskService);
  private readonly _layoutService = inject(LayoutService);
  private readonly _syncWrapperService = inject(SyncWrapperService);
  private readonly _navigateToTaskService = inject(NavigateToTaskService);

  readonly isOpen = signal(false);
  readonly query = signal('');

  private readonly _inputEl = viewChild<ElementRef<HTMLInputElement>>('paletteInput');

  private readonly _allTasks = toSignal(
    this._taskService.allTasks$.pipe(map((tasks) => tasks ?? [])),
    { initialValue: [] as Task[] },
  );

  constructor() {
    // Focus the input as soon as the overlay exists, so typing works without
    // a click — but the palette is still fully operable with the mouse.
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => this._inputEl()?.nativeElement.focus());
      }
    });
  }

  readonly commands = computed<readonly PaletteCommand[]>(() => {
    const q = this.query().trim().toLowerCase();
    const all: PaletteCommand[] = [
      {
        id: 'new-task',
        icon: 'add',
        label: 'New task',
        keys: 'N',
        run: () => this._layoutService.showAddTaskBar(),
      },
      {
        id: 'focus',
        icon: 'center_focus_strong',
        label: 'Enter focus mode',
        keys: 'F',
        run: () => this._store.dispatch(showFocusOverlay()),
      },
      {
        id: 'sync',
        icon: 'sync',
        label: 'Sync now',
        keys: '',
        run: () => {
          void this._syncWrapperService.sync();
        },
      },
      {
        id: 'planner',
        icon: 'edit_calendar',
        label: 'Open planner',
        keys: '',
        run: () => {
          void this._router.navigate(['/planner']);
        },
      },
      {
        id: 'schedule',
        icon: 'schedule',
        label: 'Open schedule',
        keys: '',
        run: () => {
          void this._router.navigate(['/schedule']);
        },
      },
      {
        id: 'boards',
        icon: 'view_kanban',
        label: 'Open boards',
        keys: '',
        run: () => {
          void this._router.navigate(['/boards']);
        },
      },
      {
        id: 'settings',
        icon: 'settings',
        label: 'Open settings',
        keys: '',
        run: () => {
          void this._router.navigate(['/config']);
        },
      },
    ];
    return q ? all.filter((c) => c.label.toLowerCase().includes(q)) : all;
  });

  readonly results = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) {
      return [];
    }
    return this._allTasks()
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.issueId || '').toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        ref: t.issueId || '',
        title: t.title,
        statusIcon: t.isDone ? 'check_circle' : 'radio_button_unchecked',
        isDone: t.isDone,
      }));
  });

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(ev: KeyboardEvent): void {
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      this.isOpen.update((v) => !v);
      return;
    }
    if (ev.key === 'Escape' && this.isOpen()) {
      ev.preventDefault();
      this.close();
    }
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.query.set('');
  }

  onQuery(ev: Event): void {
    this.query.set((ev.target as HTMLInputElement).value);
  }

  runCommand(cmd: PaletteCommand): void {
    this.close();
    cmd.run();
  }

  openTask(id: string): void {
    this.close();
    void this._navigateToTaskService.navigate(id);
  }
}
