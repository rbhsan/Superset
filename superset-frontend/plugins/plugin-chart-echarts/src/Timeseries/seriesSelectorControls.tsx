import { t } from '@apache-superset/core/translation';
import {
  ControlPanelSectionConfig,
  ControlPanelsContainerProps,
  sharedControls,
} from '@superset-ui/chart-controls';

const isEnabled = ({ controls }: ControlPanelsContainerProps) =>
  Boolean(controls?.series_selector_enabled?.value);

export const seriesSelectorSection: ControlPanelSectionConfig = {
  label: t('Series selector'),
  expanded: false,
  controlSetRows: [
    [
      {
        name: 'series_selector_enabled',
        config: {
          type: 'CheckboxControl',
          label: t('Show selector in chart'),
          default: false,
          renderTrigger: false,
          description: t(
            'Adds a selector inside the chart. Its options are the distinct values of the chosen column, and only the selected value\'s series are drawn.',
          ),
        },
      },
    ],
    [
      {
        name: 'series_selector_style',
        config: {
          type: 'RadioButtonControl',
          label: t('Selector style'),
          default: 'dropdown',
          renderTrigger: true,
          options: [
            ['dropdown', t('Dropdown')],
            ['tabs', t('Tabs')],
          ],
          visibility: isEnabled,
          resetOnHide: false,
        },
      },
    ],
    [
      {
        name: 'series_selector_column',
        config: {
          ...sharedControls.groupby,
          label: t('Selector column'),
          description: t(
            'Column whose distinct values populate the dropdown (e.g. transformer, feeder, bay).',
          ),
          multi: false,
          default: null,
          renderTrigger: false,
          visibility: isEnabled,
          resetOnHide: false,
        },
      },
    ],
    [
      {
        name: 'series_selector_label',
        config: {
          type: 'TextControl',
          label: t('Selector label'),
          default: '',
          renderTrigger: true,
          visibility: isEnabled,
          resetOnHide: false,
        },
      },
    ],
  ],
};
