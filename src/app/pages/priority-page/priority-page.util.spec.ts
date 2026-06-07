import { Project } from '../../features/project/project.model';
import { Section } from '../../features/section/section.model';
import { TaskWithSubTasks } from '../../features/tasks/task.model';
import { WorkContextType } from '../../features/work-context/work-context.model';
import { groupPriorityTasks } from './priority-page.util';

const task = (id: string, projectId: string): TaskWithSubTasks =>
  ({
    id,
    title: id,
    projectId,
    tagIds: [],
    created: 1,
    isDone: false,
    subTaskIds: [],
    subTasks: [],
    attachments: [],
    timeEstimate: 0,
    timeSpent: 0,
    timeSpentOnDay: {},
  }) as TaskWithSubTasks;

describe('groupPriorityTasks', () => {
  const projects = [
    { id: 'p1', title: 'Project 1' },
    { id: 'p2', title: 'Project 2' },
  ] as Project[];
  const sections = [
    {
      id: 's1',
      contextId: 'p1',
      contextType: WorkContextType.PROJECT,
      title: 'Section 1',
      taskIds: ['t1'],
    },
  ] as Section[];
  const tasks = [task('t1', 'p1'), task('t2', 'p1'), task('t3', 'p2')];

  it('returns no groups for none mode', () => {
    expect(groupPriorityTasks(tasks, projects, sections, 'none')).toEqual([]);
  });

  it('groups by project', () => {
    expect(groupPriorityTasks(tasks, projects, sections, 'project')).toEqual([
      { label: 'Project 1', tasks: [tasks[0], tasks[1]] },
      { label: 'Project 2', tasks: [tasks[2]] },
    ]);
  });

  it('groups by project and section', () => {
    expect(groupPriorityTasks(tasks, projects, sections, 'project-section')).toEqual([
      { label: 'Project 1 - Section 1', tasks: [tasks[0]] },
      { label: 'Project 1 - No section', tasks: [tasks[1]] },
      { label: 'Project 2 - No section', tasks: [tasks[2]] },
    ]);
  });
});
