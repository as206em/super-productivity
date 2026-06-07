import { EntityState } from '@ngrx/entity';
import { WorkContextType } from '../work-context/work-context.model';
import { TaskScoreLevel } from '../tasks/task.model';

export interface Section {
  id: string;
  contextId: string;
  contextType: WorkContextType;
  title: string;
  value?: TaskScoreLevel | null;
  deadlineDay?: string | null;
  isExpanded?: boolean;
  taskIds: string[];
}

export interface SectionState extends EntityState<Section> {
  ids: string[];
}
