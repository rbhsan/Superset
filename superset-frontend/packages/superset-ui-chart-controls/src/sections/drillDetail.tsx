import { t } from '@apache-superset/core/translation';
import { ControlPanelsContainerProps, ControlSetRow } from '../types';

// Mirrors DETAIL_VIZ_SPECS in
// src/components/Chart/DrillDetail/vizConverters.ts — keep in sync.
export const DETAIL_VIZ_SLOTS: Record<
  string,
  {
    metrics: 'none' | 'single' | 'multi' | 'xyz';
    showDims: boolean;
    needsX?: boolean;
    needsExtra?: boolean;
  }
> = {
  pie: { metrics: 'single', showDims: true },
  bar: { metrics: 'multi', showDims: true, needsX: true },
  bar_h: { metrics: 'multi', showDims: true, needsX: true },
  line: { metrics: 'multi', showDims: true, needsX: true },
  area: { metrics: 'multi', showDims: true, needsX: true },
  treemap: { metrics: 'single', showDims: true },
  sunburst: { metrics: 'single', showDims: true },
  funnel: { metrics: 'single', showDims: true },
  gauge: { metrics: 'single', showDims: true },
  radar: { metrics: 'multi', showDims: true },
  big_number: { metrics: 'single', showDims: false },
  heatmap: { metrics: 'single', showDims: true, needsX: true },
  bubble: { metrics: 'xyz', showDims: true, needsExtra: true },
  table: { metrics: 'multi', showDims: true },
};

export const DETAIL_VIZ_CHOICES: [string, string][] = [
  ['pie', t('Pie')],
  ['bar', t('Bar')],
  ['bar_h', t('Horizontal bar')],
  ['line', t('Line')],
  ['area', t('Area')],
  ['treemap', t('Treemap')],
  ['sunburst', t('Sunburst')],
  ['funnel', t('Funnel')],
  ['gauge', t('Gauge')],
  ['radar', t('Radar')],
  ['big_number', t('Number')],
  ['heatmap', t('Heatmap')],
  ['bubble', t('Bubble')],
  ['table', t('Table')],
];

const chartOn = ({ controls }: ControlPanelsContainerProps) =>
  Boolean(controls?.drill_detail_chart_enabled?.value);

const specOf = ({ controls }: ControlPanelsContainerProps) =>
  DETAIL_VIZ_SLOTS[String(controls?.drill_detail_chart_type?.value ?? 'pie')] ?? DETAIL_VIZ_SLOTS.pie;

const metricProps = ({ datasource }: any) => ({
  columns: datasource?.columns || [],
  savedMetrics: datasource?.metrics || [],
  datasource,
  datasourceType: datasource?.type,
});

const columnChoices = ({ datasource }: any) => ({
  choices: (datasource?.columns || []).map((c: any) => [
    c.column_name,
    c.verbose_name || c.column_name,
  ]),
});

export const drillDetailSection: ControlSetRow[] = [
  [
    {
      name: 'drill_detail_filters_enabled',
      config: {
        type: 'CheckboxControl',
        label: t('Show filter bar'),
        default: false,
        renderTrigger: true,
        description: t(
          'Shows applied values as chips plus an inline column/values filter in the View Details pop-up.',
        ),
      },
    },
  ],
  [
    {
      name: 'drill_detail_chart_enabled',
      config: {
        type: 'CheckboxControl',
        label: t('Show chart tab'),
        default: false,
        renderTrigger: true,
        description: t('Adds a Chart | Table toggle to the View Details pop-up.'),
      },
    },
  ],
  [
    {
      name: 'drill_detail_chart_type',
      config: {
        type: 'SelectControl',
        label: t('Chart tab type'),
        default: 'pie',
        clearable: false,
        renderTrigger: true,
        choices: DETAIL_VIZ_CHOICES,
        visibility: chartOn,
        description: t('How the Chart tab in the View Details pop-up is drawn.'),
      },
    },
  ],
  [
    {
      name: 'drill_detail_chart_metric',
      config: {
        type: 'MetricsControl',
        multi: false,
        label: t('Metric'),
        renderTrigger: true,
        default: null,
        description: t('Metric for the Chart tab (X metric for Bubble).'),
        visibility: (props: ControlPanelsContainerProps) =>
          chartOn(props) && specOf(props).metrics !== 'multi',
        shouldMapStateToProps: () => true,
        mapStateToProps: metricProps,
      },
    },
  ],
  [
    {
      name: 'drill_detail_chart_metrics',
      config: {
        type: 'MetricsControl',
        multi: true,
        label: t('Metrics'),
        renderTrigger: true,
        default: [],
        description: t('Metrics for the Chart tab.'),
        visibility: (props: ControlPanelsContainerProps) =>
          chartOn(props) && specOf(props).metrics === 'multi',
        shouldMapStateToProps: () => true,
        mapStateToProps: metricProps,
      },
    },
  ],
  [
    {
      name: 'drill_detail_chart_metric_y',
      config: {
        type: 'MetricsControl',
        multi: false,
        label: t('Y metric'),
        renderTrigger: true,
        default: null,
        visibility: (props: ControlPanelsContainerProps) =>
          chartOn(props) && specOf(props).metrics === 'xyz',
        shouldMapStateToProps: () => true,
        mapStateToProps: metricProps,
      },
    },
  ],
  [
    {
      name: 'drill_detail_chart_metric_size',
      config: {
        type: 'MetricsControl',
        multi: false,
        label: t('Bubble size metric'),
        renderTrigger: true,
        default: null,
        visibility: (props: ControlPanelsContainerProps) =>
          chartOn(props) && specOf(props).metrics === 'xyz',
        shouldMapStateToProps: () => true,
        mapStateToProps: metricProps,
      },
    },
  ],
  [
    {
      name: 'drill_detail_chart_dimensions',
      config: {
        type: 'SelectControl',
        multi: true,
        freeForm: false,
        label: t('Dimensions'),
        renderTrigger: true,
        default: [],
        description: t('Columns the Chart tab groups by.'),
        visibility: (props: ControlPanelsContainerProps) =>
          chartOn(props) && specOf(props).showDims,
        shouldMapStateToProps: () => true,
        mapStateToProps: columnChoices,
      },
    },
  ],
  [
    {
      name: 'drill_detail_chart_x',
      config: {
        type: 'SelectControl',
        freeForm: false,
        label: t('X-axis column'),
        renderTrigger: true,
        default: null,
        clearable: true,
        description: t(
          'Column on the X axis. Line and Area need a temporal column.',
        ),
        visibility: (props: ControlPanelsContainerProps) =>
          chartOn(props) && Boolean(specOf(props).needsX),
        shouldMapStateToProps: () => true,
        mapStateToProps: columnChoices,
      },
    },
  ],
  [
    {
      name: 'drill_detail_chart_extra',
      config: {
        type: 'SelectControl',
        freeForm: false,
        label: t('Entity column'),
        renderTrigger: true,
        default: null,
        clearable: true,
        description: t('Column identifying each bubble.'),
        visibility: (props: ControlPanelsContainerProps) =>
          chartOn(props) && Boolean(specOf(props).needsExtra),
        shouldMapStateToProps: () => true,
        mapStateToProps: columnChoices,
      },
    },
  ],
];

export default drillDetailSection;
