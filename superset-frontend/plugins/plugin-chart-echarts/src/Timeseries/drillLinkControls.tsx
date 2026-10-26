import { t } from '@apache-superset/core/translation';
import {
  ControlSetRow,
  ControlPanelsContainerProps,
} from '@superset-ui/chart-controls';

export const drillLinkSection: ControlSetRow[] = [
  [
    {
      name: 'show_drill_link',
      config: {
        type: 'CheckboxControl',
        label: t('Show "View details" link'),
        renderTrigger: true,
        default: false,
        description: t('Shows a link that opens the drill-to-detail table.'),
      },
    },
  ],
  [
    {
      name: 'drill_link_label',
      config: {
        type: 'TextControl',
        label: t('Link text'),
        renderTrigger: true,
        default: 'View Details →',
        visibility: ({ controls }: ControlPanelsContainerProps) =>
          Boolean(controls?.show_drill_link?.value),
      },
    },
  ],
];
