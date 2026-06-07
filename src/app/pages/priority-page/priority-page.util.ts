import { Project } from '../../features/project/project.model';
import { Section } from '../../features/section/section.model';
import { TaskWithSubTasks } from '../../features/tasks/task.model';

export type PriorityGroupMode = 'none' | 'project' | 'project-section';

export interface PriorityTaskGroup {
  label: string;
  tasks: TaskWithSubTasks[];
}

const FALLBACK_PROJECT_TITLE = 'Inbox';
const FALLBACK_SECTION_TITLE = 'No section';

export const groupPriorityTasks = (
  tasks: TaskWithSubTasks[],
  projects: Project[],
  sections: Section[],
  mode: PriorityGroupMode,
): PriorityTaskGroup[] => {
  if (mode === 'none') {
    return [];
  }

  const projectTitleById = new Map(
    projects.map((project) => [project.id, project.title]),
  );
  const sectionByTaskId = new Map<string, Section>();
  sections.forEach((section) => {
    section.taskIds.forEach((taskId) => sectionByTaskId.set(taskId, section));
  });

  const groups = new Map<string, TaskWithSubTasks[]>();
  tasks.forEach((task) => {
    const projectTitle =
      projectTitleById.get(task.projectId) || task.projectId || FALLBACK_PROJECT_TITLE;
    const section = sectionByTaskId.get(task.id);
    const label =
      mode === 'project-section'
        ? `${projectTitle} - ${section?.title || FALLBACK_SECTION_TITLE}`
        : projectTitle;

    const group = groups.get(label);
    if (group) {
      group.push(task);
    } else {
      groups.set(label, [task]);
    }
  });

  return [...groups.entries()].map(([label, groupTasks]) => ({
    label,
    tasks: groupTasks,
  }));
};
