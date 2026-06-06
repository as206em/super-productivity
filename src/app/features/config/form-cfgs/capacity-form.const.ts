import { ConfigFormSection, CapacityConfig } from '../global-config.model';
import { T } from '../../../t.const';

export const CAPACITY_FORM_CFG: ConfigFormSection<CapacityConfig> = {
  title: T.GCF.CAPACITY.TITLE,
  help: T.GCF.CAPACITY.HELP,
  key: 'capacity',
  items: [
    {
      key: 'weekdayCapacity',
      type: 'duration',
      templateOptions: {
        label: T.GCF.CAPACITY.WEEKDAY_CAPACITY,
        description: T.GCF.CAPACITY.ZERO_DISABLES,
        isShowZeroVal: true,
      },
    },
    {
      key: 'weekendCapacity',
      type: 'duration',
      templateOptions: {
        label: T.GCF.CAPACITY.WEEKEND_CAPACITY,
        description: T.GCF.CAPACITY.ZERO_DISABLES,
        isShowZeroVal: true,
      },
    },
    {
      key: 'sprintCapacity',
      type: 'duration',
      templateOptions: {
        label: T.GCF.CAPACITY.SPRINT_CAPACITY,
        description: T.GCF.CAPACITY.ZERO_DISABLES,
        isShowZeroVal: true,
      },
    },
  ],
};
