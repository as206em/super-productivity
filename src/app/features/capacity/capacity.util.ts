import { CapacityConfig } from '../config/global-config.model';
import { Task } from '../tasks/task.model';
import { dateStrToUtcDate } from '../../util/date-str-to-utc-date';

export type CapacityProgressState = 'success' | 'warning' | 'danger';

export interface CapacityStats {
  estimate: number;
  capacity: number;
  progressPercentage?: number;
}

export const getRawTaskEstimateTotal = (tasks: readonly Task[]): number =>
  tasks.reduce((acc, task) => acc + (task.timeEstimate || 0), 0);

export const getDayCapacity = (
  dayDate: string,
  capacityConfig: CapacityConfig,
): number => {
  const day = dateStrToUtcDate(dayDate).getDay();
  const isWeekend = day === 0 || day === 6;
  return isWeekend ? capacityConfig.weekendCapacity : capacityConfig.weekdayCapacity;
};

export const getCapacityProgressPercentage = (
  estimate: number,
  capacity: number,
): number | undefined => (capacity > 0 ? (estimate / capacity) * 100 : undefined);

export const getCapacityProgressState = (
  percentage: number | undefined,
): CapacityProgressState => {
  if (percentage === undefined || percentage < 80) {
    return 'success';
  }
  return percentage > 100 ? 'danger' : 'warning';
};

export const getCapacityStats = (estimate: number, capacity: number): CapacityStats => ({
  estimate,
  capacity,
  progressPercentage: getCapacityProgressPercentage(estimate, capacity),
});
