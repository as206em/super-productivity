import { FormlyFieldConfig } from '@ngx-formly/core';
import { T } from '../../../t.const';
import { WORK_CONTEXT_THEME_CONFIG_FORM_CONFIG } from '../work-context.const';
import { TASK_SCORE_LEVELS, TASK_VALUE_LABELS } from '../../tasks/util/task-score.util';

const PROJECT_VALUE_OPTIONS = [
  { value: null, label: '-' },
  ...TASK_SCORE_LEVELS.map((value) => ({
    value,
    label: TASK_VALUE_LABELS[value],
  })),
];

export const buildWorkContextSettingsFormCfg = (
  isProject: boolean,
): FormlyFieldConfig[] => {
  const basicFields: FormlyFieldConfig[] = [
    {
      key: 'title',
      type: 'input',
      templateOptions: {
        required: true,
        label: isProject ? T.F.PROJECT.FORM_BASIC.L_TITLE : T.F.TAG.FORM_BASIC.L_TITLE,
      },
    },
    {
      key: 'icon',
      type: 'icon',
      templateOptions: {
        label: T.F.TAG.FORM_BASIC.L_ICON,
        description: T.G.ICON_INP_DESCRIPTION,
      },
    },
  ];

  if (!isProject) {
    basicFields.push({
      key: 'color',
      type: 'color',
      templateOptions: {
        label: T.F.TAG.FORM_BASIC.L_COLOR,
      },
    });
  }

  if (isProject) {
    basicFields.push(
      {
        key: 'value',
        type: 'select',
        templateOptions: {
          label: T.F.PROJECT.FORM_BASIC.L_VALUE,
          options: PROJECT_VALUE_OPTIONS,
        },
      },
      {
        key: 'deadlineDay',
        type: 'date',
        templateOptions: {
          label: T.F.PROJECT.FORM_BASIC.L_DEADLINE,
        },
      },
      {
        key: 'isEnableBacklog',
        type: 'checkbox',
        templateOptions: {
          label: T.F.PROJECT.FORM_BASIC.L_ENABLE_BACKLOG,
        },
      },
      {
        key: 'isHiddenFromMenu',
        type: 'checkbox',
        templateOptions: {
          label: T.F.PROJECT.FORM_BASIC.L_IS_HIDDEN_FROM_MENU,
        },
      },
    );
  }

  const sharedItems = WORK_CONTEXT_THEME_CONFIG_FORM_CONFIG.items!;
  const colorFields = sharedItems.slice(0, 3).map((field, index) =>
    !isProject && index === 0
      ? {
          ...field,
          templateOptions: {
            ...field.templateOptions,
            description: T.F.TAG.FORM_BASIC.D_COLOR,
          },
        }
      : field,
  );
  const remainingFields = sharedItems.slice(3);

  const themeFields: FormlyFieldConfig[] = [
    {
      fieldGroupClassName: 'formly-row',
      fieldGroup: colorFields,
    },
    ...remainingFields,
  ];

  return [
    ...basicFields,
    {
      key: 'theme',
      fieldGroup: themeFields,
    },
  ];
};
