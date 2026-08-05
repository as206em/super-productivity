import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { T } from '../../../t.const';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { WorkContextService } from '../../../features/work-context/work-context.service';
import { TaskViewCustomizerService } from '../../../features/task-view-customizer/task-view-customizer.service';
import { GlobalConfigService } from '../../../features/config/global-config.service';
import { KeyboardConfig } from '../../../features/config/keyboard-config.model';
import { ProjectService } from '../../../features/project/project.service';
import { isTaskViewCustomizerRoute } from '../../../features/task-view-customizer/is-task-view-customizer-route.util';
import { TODAY_TAG } from '../../../features/tag/tag.const';
import { INBOX_PROJECT } from '../../../features/project/project.const';
import { WorkContextType } from '../../../features/work-context/work-context.model';
import { DateService } from '../../../core/date/date.service';

@Component({
  selector: 'page-title',
  standalone: true,
  imports: [RouterLink, MatTooltip, MatIcon, TranslatePipe],
  template: `
    @if (activeWorkContextTypeAndId() || isSpecialSection()) {
      <!-- Breadcrumb: icon · bold title · slash · quiet tail. Exactly two
           levels, and the tail is the part that truncates first. -->
      <div class="breadcrumb">
        <mat-icon class="breadcrumb-icon">{{ breadcrumbIcon() }}</mat-icon>
        <a
          class="breadcrumb-title"
          [matTooltip]="T.MH.GO_TO_TASK_LIST | translate"
          routerLink="/active/tasks"
          >{{ displayTitle() }}</a
        >
        @if (breadcrumbTail(); as tail) {
          <span
            aria-hidden="true"
            class="breadcrumb-sep"
            >/</span
          >
          <span class="breadcrumb-tail">{{ tail }}</span>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: var(--space-5);
        min-width: 0;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
      }

      .breadcrumb-icon {
        flex: 0 0 17px;
        width: 17px;
        height: 17px;
        font-size: 17px;
        line-height: 1;
        color: var(--icon-meta);
      }

      .breadcrumb-title {
        font-weight: var(--weight-semibold);
        font-size: var(--text-base);
        color: var(--text-title);
        text-decoration: none;
        flex: 0 0 auto;

        &:focus {
          outline: none;
        }
      }

      .breadcrumb-sep {
        color: var(--neutral-200);
        flex: 0 0 auto;
      }

      /* The tail gives up its space first — the title always survives. */
      .breadcrumb-tail {
        color: var(--text-meta);
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageTitleComponent {
  private _breakpointObserver = inject(BreakpointObserver);
  private _router = inject(Router);
  private _workContextService = inject(WorkContextService);
  private _projectService = inject(ProjectService);
  readonly taskViewCustomizerService = inject(TaskViewCustomizerService);
  private readonly _configService = inject(GlobalConfigService);
  private _translateService = inject(TranslateService);
  private _dateService = inject(DateService);

  readonly T = T;

  // Get data directly from services instead of inputs
  activeWorkContextTitle = toSignal(this._workContextService.activeWorkContextTitle$);
  activeWorkContextTypeAndId = toSignal(
    this._workContextService.activeWorkContextTypeAndId$,
  );
  private _activeProject = toSignal(this._projectService.currentProject$, {
    initialValue: null,
  });

  // Single source for the current URL path — all route-derived signals compute off this.
  // Query and fragment are stripped so end-anchored matchers work for e.g. `/config#plugins`.
  private _url$ = this._router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects.split(/[?#]/, 1)[0]),
  );
  private _url = toSignal(this._url$, {
    initialValue: this._router.url.split(/[?#]/, 1)[0],
  });

  // Routes that get their own title and have no work-context menu.
  // Order is irrelevant — patterns are mutually exclusive end-anchors.
  private static readonly _ROUTE_TITLE_KEYS: ReadonlyArray<readonly [RegExp, string]> = [
    [/schedule$/, T.MH.SCHEDULE],
    [/planner$/, T.MH.PLANNER],
    [/priority$/, T.MH.PRIORITY],
    [/boards$/, T.MH.BOARDS],
    [/habits$/, T.MH.HABITS],
    [/search$/, T.MH.SEARCH],
    [/sprint\/current$/, T.SPRINT.CURRENT],
    [/sprint\/next$/, T.SPRINT.NEXT],
    [/scheduled-list$/, T.MH.ALL_PLANNED_LIST],
    [/donate$/, T.MH.DONATE],
    [/config$/, T.PS.GLOBAL_SETTINGS],
    [/archived-projects$/, T.MH.ARCHIVED_PROJECTS],
  ];

  private _routeTitleKey = computed(
    () => PageTitleComponent._ROUTE_TITLE_KEYS.find(([re]) => re.test(this._url()))?.[1],
  );

  isSpecialSection = computed(() => !!this._routeTitleKey());
  isWorkViewPage = computed(() => /tasks$/.test(this._url()));
  isTaskViewCustomizerPage = computed(() => isTaskViewCustomizerRoute(this._url()));

  displayTitle = computed(() => {
    const key = this._routeTitleKey();
    return key ? this._translateService.instant(key) : this.activeWorkContextTitle();
  });

  // The design system's standing icon vocabulary, keyed by route. Anything not
  // listed falls back to the work-context glyph below.
  private static readonly _ROUTE_ICONS: ReadonlyArray<readonly [RegExp, string]> = [
    [/schedule$/, 'schedule'],
    [/planner$/, 'edit_calendar'],
    [/priority$/, 'hotel_class'],
    [/boards$/, 'view_kanban'],
    [/habits$/, 'favorite'],
    [/search$/, 'search'],
    [/sprint\/current$/, 'flag'],
    [/sprint\/next$/, 'outlined_flag'],
    [/scheduled-list$/, 'list'],
    [/donate$/, 'volunteer_activism'],
    [/config$/, 'settings'],
    [/archived-projects$/, 'inventory_2'],
  ];

  readonly breadcrumbIcon = computed(() => {
    const routeIcon = PageTitleComponent._ROUTE_ICONS.find(([re]) =>
      re.test(this._url()),
    )?.[1];
    if (routeIcon) {
      return routeIcon;
    }
    const ctx = this.activeWorkContextTypeAndId();
    if (ctx?.activeId === TODAY_TAG.id) {
      return 'wb_sunny';
    }
    if (ctx?.activeId === INBOX_PROJECT.id) {
      return 'inbox';
    }
    return ctx?.activeType === WorkContextType.TAG ? 'label' : 'radio_button_checked';
  });

  /**
   * The breadcrumb's second level. Only rendered when there is something true
   * to say — an absent tail collapses the slash with it rather than showing an
   * em dash or a blank.
   */
  readonly breadcrumbTail = computed(() => {
    if (this.isSpecialSection()) {
      return null;
    }
    const ctx = this.activeWorkContextTypeAndId();
    if (!ctx) {
      return null;
    }
    if (ctx.activeId === TODAY_TAG.id) {
      // My day is the one view that is genuinely about a date, so it says which.
      // Recomputed from the logical today so it rolls over with the app's own
      // day boundary rather than midnight.
      return new Date(this._dateService.todayStr()).toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
    const project = this._activeProject();
    if (project?.isArchived) {
      return this._translateService.instant(T.MH.ARCHIVED_PROJECTS);
    }
    return null;
  });

  activeProjectMeta = computed(() => {
    if (this.isSpecialSection()) return null;
    const project = this._activeProject();
    if (!project?.deadlineDay && !project?.value) return null;
    return {
      value: project.value,
      deadlineDay: project.deadlineDay,
    };
  });

  private _isXxxs$ = this._breakpointObserver.observe('(max-width: 350px)');
  isXxxs = toSignal(this._isXxxs$.pipe(map((result) => result.matches)), {
    initialValue: false,
  });

  get kb(): KeyboardConfig {
    return (this._configService.cfg()?.keyboard as KeyboardConfig) || {};
  }
}
