/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  ControlPanelConfig,
  getStandardizedControls,
  ControlPanelsContainerProps,
  sections,
} from '@superset-ui/chart-controls';
import { t } from '@apache-superset/core/translation';
import { allColumnsControlSetItem } from './controls/columns';
import { groupByControlSetItem } from './controls/groupBy';
import { handlebarsTemplateControlSetItem } from './controls/handlebarTemplate';
import { includeTimeControlSetItem } from './controls/includeTime';
import {
  rowLimitControlSetItem,
  timeSeriesLimitMetricControlSetItem,
} from './controls/limits';
import {
  metricsControlSetItem,
  percentMetricsControlSetItem,
  showTotalsControlSetItem,
} from './controls/metrics';
import {
  orderByControlSetItem,
  orderDescendingControlSetItem,
} from './controls/orderBy';
import { queryModeControlSetItem } from './controls/queryMode';
import { styleControlSetItem } from './controls/style';

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [queryModeControlSetItem],
        [groupByControlSetItem],
        [metricsControlSetItem, allColumnsControlSetItem],
        [percentMetricsControlSetItem],
        [timeSeriesLimitMetricControlSetItem, orderByControlSetItem],
        [orderDescendingControlSetItem],
        [rowLimitControlSetItem],
        [includeTimeControlSetItem],
        [showTotalsControlSetItem],
        ['adhoc_filters'],
      ],
    },
    {
      label: t('Options'),
      expanded: true,
      controlSetRows: [
        [handlebarsTemplateControlSetItem],
        [styleControlSetItem],
        [
          {
            name: 'show_drill_link',
            config: {
              type: 'CheckboxControl',
              label: t('Show "View details" link'),
              renderTrigger: true,
              default: false,
              description: t(
                'Shows a link at the bottom of the chart that opens the drill-to-detail table.',
              ),
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
      ],
    },
    {
      label: t('View Details pop-up'),
      expanded: false,
      controlSetRows: [
        ...sections.drillDetailSection,
        [
          {
            name: 'drill_detail_cell_configs',
            config: {
              type: 'CellDrillControl',
              label: t('Cell drill-downs'),
              renderTrigger: true,
              default: [],
              description: t(
                'Per-column pop-up charts. Mark the cell in the template with {{drillCell this "COLUMN"}}; only configured columns are clickable.',
              ),
              shouldMapStateToProps: () => true,
              mapStateToProps: ({ datasource }: any) => ({ datasource }),
            },
          },
        ],
      ],
    },
  ],
  formDataOverrides: formData => ({
    ...formData,
    groupby: getStandardizedControls().popAllColumns(),
    metrics: getStandardizedControls().popAllMetrics(),
  }),
};

export default config;
