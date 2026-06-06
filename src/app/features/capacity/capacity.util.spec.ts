import {
  getCapacityProgressPercentage,
  getCapacityProgressState,
  getDayCapacity,
  getRawTaskEstimateTotal,
} from './capacity.util';
import { CapacityConfig } from '../config/global-config.model';
import { Task } from '../tasks/task.model';

const HOUR = 60 * 60 * 1000;

const capacityConfig: CapacityConfig = {
  weekdayCapacity: 2 * HOUR,
  weekendCapacity: 6 * HOUR,
  sprintCapacity: 22 * HOUR,
};

const createTask = (id: string, timeEstimate: number, isDone = false): Task =>
  ({
    id,
    projectId: 'project-1',
    title: id,
    isDone,
    subTaskIds: [],
    tagIds: [],
    timeEstimate,
    timeSpent: isDone ? timeEstimate : 0,
    timeSpentOnDay: {},
    attachments: [],
    created: 1,
  }) as Task;

describe('capacity utils', () => {
  it('should use weekday capacity for weekdays', () => {
    expect(getDayCapacity('2026-06-05', capacityConfig)).toBe(2 * HOUR);
  });

  it('should use weekend capacity for weekends', () => {
    expect(getDayCapacity('2026-06-06', capacityConfig)).toBe(6 * HOUR);
  });

  it('should count raw estimates for all tasks including completed tasks', () => {
    const result = getRawTaskEstimateTotal([
      createTask('open', HOUR),
      createTask('done', 2 * HOUR, true),
    ]);

    expect(result).toBe(3 * HOUR);
  });

  it('should calculate progress percentage from estimate and capacity', () => {
    expect(getCapacityProgressPercentage(3 * HOUR, 6 * HOUR)).toBe(50);
  });

  it('should disable progress when capacity is zero', () => {
    expect(getCapacityProgressPercentage(HOUR, 0)).toBeUndefined();
  });

  it('should classify progress with warning and danger thresholds', () => {
    expect(getCapacityProgressState(79)).toBe('success');
    expect(getCapacityProgressState(80)).toBe('warning');
    expect(getCapacityProgressState(100)).toBe('warning');
    expect(getCapacityProgressState(101)).toBe('danger');
  });
});
