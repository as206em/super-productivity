export type SprintTarget = 'CURRENT' | 'NEXT';

export interface SprintState {
  currentTaskIds: string[];
  nextTaskIds: string[];
}
