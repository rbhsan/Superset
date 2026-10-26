import { ensureIsArray, QueryFormData } from '@superset-ui/core';
import { Dataset } from '../types';
import { AdhocFilterLike } from './useDrillDetailFilters';

export type DetailVizKey =
  | 'pie'
  | 'bar'
  | 'bar_h'
  | 'line'
  | 'area'
  | 'treemap'
  | 'sunburst'
  | 'funnel'
  | 'gauge'
  | 'radar'
  | 'big_number'
  | 'heatmap'
  | 'bubble'
  | 'table';

/** Which slots a type needs. Drives both the settings UI and canConvert. */
export type MetricSlot = 'none' | 'single' | 'multi' | 'xyz';

export interface DetailVizSpec {
  key: DetailVizKey;
  label: string;
  metrics: MetricSlot;
  /** minimum dimensions required (0 = optional, dims control still shown) */
  minDims: number;
  showDims: boolean;
  /** x-axis column slot: 'any' or 'temporal' */
  needsX?: 'any' | 'temporal';
  /** a second single-column slot (heatmap y, bubble entity) */
  needsExtra?: boolean;
  build: (ctx: BuildCtx) => Record<string, any>;
}

interface BuildCtx {
  base: Record<string, any>;
  src: Record<string, any>;
  metrics: any[];
  dims: string[];
  x?: string;
  extra?: string;
  metricY?: any;
  metricSize?: any;
  dataset?: Dataset;
}

const BASE_KEYS = [
  'datasource',
  'time_range',
  'granularity_sqla',
  'extra_form_data',
  'extra_filters',
  'color_scheme',
  'label_colors',
  'shared_label_colors',
  'row_limit',
  'dashboardId',
];

const getSrcMetrics = (fd: any) =>
  ensureIsArray(fd.metrics ?? fd.metric).filter(Boolean);

const getSrcDims = (fd: any): string[] => {
  const g = ensureIsArray(fd.groupby ?? fd.columns).map(String);
  const x = fd.x_axis ? String(fd.x_axis) : undefined;
  return x && !g.includes(x) ? [x, ...g] : g;
};

const getTemporalColumn = (fd: any, dataset?: Dataset): string | undefined =>
  fd.granularity_sqla ||
  dataset?.columns?.find(c => (c as any).is_dttm)?.column_name;

/**
 * Chart-type registry. Add a type by adding one entry here; the settings
 * panel and canConvert pick it up automatically.
 *
 * NOTE: viz_type strings must match this deployment's plugin registry.
 * Verify the viz_type strings against this deployment's plugin registry.
 */
export const DETAIL_VIZ_SPECS: Record<DetailVizKey, DetailVizSpec> = {
  pie: {
    key: 'pie',
    label: 'Pie',
    metrics: 'single',
    minDims: 1,
    showDims: true,
    build: ({ base, metrics, dims }) => ({
      ...base,
      viz_type: 'pie',
      metric: metrics[0],
      groupby: dims,
      show_labels: true,
      labels_outside: true,
      label_type: 'key_value',
      show_legend: true,
    }),
  },
  bar: {
    key: 'bar',
    label: 'Bar',
    metrics: 'multi',
    minDims: 0,
    showDims: true,
    needsX: 'any',
    build: ({ base, metrics, dims, x }) => ({
      ...base,
      viz_type: 'echarts_timeseries_bar',
      metrics,
      x_axis: x ?? dims[0],
      groupby: dims.filter(d => d !== (x ?? dims[0])),
      orientation: 'vertical',
      show_value: true,
      show_legend: dims.length > 1,
      x_axis_sort_asc: true,
    }),
  },
  bar_h: {
    key: 'bar_h',
    label: 'Horizontal bar',
    metrics: 'multi',
    minDims: 0,
    showDims: true,
    needsX: 'any',
    build: ({ base, metrics, dims, x }) => ({
      ...base,
      viz_type: 'echarts_timeseries_bar',
      metrics,
      x_axis: x ?? dims[0],
      groupby: dims.filter(d => d !== (x ?? dims[0])),
      orientation: 'horizontal',
      show_value: true,
      show_legend: dims.length > 1,
      x_axis_sort_asc: true,
    }),
  },
  line: {
    key: 'line',
    label: 'Line',
    metrics: 'multi',
    minDims: 0,
    showDims: true,
    needsX: 'temporal',
    build: ({ base, src, metrics, dims, x, dataset }) => {
      const temporal = x ?? (getTemporalColumn(src, dataset) as string);
      return {
        ...base,
        viz_type: 'echarts_timeseries_line',
        metrics,
        x_axis: temporal,
        time_grain_sqla: src.time_grain_sqla || 'P1D',
        groupby: dims.filter(d => d !== temporal),
        show_legend: true,
      };
    },
  },
  area: {
    key: 'area',
    label: 'Area',
    metrics: 'multi',
    minDims: 0,
    showDims: true,
    needsX: 'temporal',
    build: ({ base, src, metrics, dims, x, dataset }) => {
      const temporal = x ?? (getTemporalColumn(src, dataset) as string);
      return {
        ...base,
        viz_type: 'echarts_area',
        metrics,
        x_axis: temporal,
        time_grain_sqla: src.time_grain_sqla || 'P1D',
        groupby: dims.filter(d => d !== temporal),
        opacity: 0.7,
        show_legend: true,
      };
    },
  },
  treemap: {
    key: 'treemap',
    label: 'Treemap',
    metrics: 'single',
    minDims: 1,
    showDims: true,
    build: ({ base, metrics, dims }) => ({
      ...base,
      viz_type: 'treemap_v2',
      metric: metrics[0],
      groupby: dims,
      show_labels: true,
    }),
  },
  sunburst: {
    key: 'sunburst',
    label: 'Sunburst',
    metrics: 'single',
    minDims: 1,
    showDims: true,
    build: ({ base, metrics, dims }) => ({
      ...base,
      viz_type: 'sunburst_v2',
      metric: metrics[0],
      columns: dims,
      groupby: dims,
small: true,
    }),
  },
  funnel: {
    key: 'funnel',
    label: 'Funnel',
    metrics: 'single',
    minDims: 1,
    showDims: true,
    build: ({ base, metrics, dims }) => ({
      ...base,
      viz_type: 'funnel',
      metric: metrics[0],
      groupby: dims,
      show_labels: true,
      show_legend: true,
    }),
  },
  gauge: {
    key: 'gauge',
    label: 'Gauge',
    metrics: 'single',
    minDims: 0,
    showDims: true,
    build: ({ base, metrics, dims }) => ({
      ...base,
      viz_type: 'gauge_chart',
      metric: metrics[0],
      groupby: dims,
      show_progress: true,
    }),
  },
  radar: {
    key: 'radar',
    label: 'Radar',
    metrics: 'multi',
    minDims: 0,
    showDims: true,
    build: ({ base, metrics, dims }) => ({
      ...base,
      viz_type: 'radar',
      metrics,
      groupby: dims,
      show_labels: true,
      show_legend: true,
    }),
  },
  big_number: {
    key: 'big_number',
    label: 'Number',
    metrics: 'single',
    minDims: 0,
    showDims: false,
    build: ({ base, metrics }) => ({
      ...base,
      viz_type: 'big_number_total',
      metric: metrics[0],
    }),
  },
  heatmap: {
    key: 'heatmap',
    label: 'Heatmap',
    metrics: 'single',
    minDims: 1,
    showDims: true,
    needsX: 'any',
    build: ({ base, metrics, dims, x }) => ({
      ...base,
      viz_type: 'heatmap_v2',
      metric: metrics[0],
      x_axis: x ?? dims[0],
      groupby: dims.filter(d => d !== (x ?? dims[0]))[0] ?? dims[0],
      normalize_across: 'heatmap',
levels: undefined,
    }),
  },
  bubble: {
    key: 'bubble',
    label: 'Bubble',
    metrics: 'xyz',
    minDims: 1,
    showDims: true,
    needsExtra: true,
    build: ({ base, metrics, metricY, metricSize, dims, extra }) => ({
      ...base,
      viz_type: 'bubble_v2',
      x: metrics[0],
      y: metricY,
      size: metricSize,
      entity: extra ?? dims[0],
      series: dims[1],
    }),
  },
  table: {
    key: 'table',
    label: 'Table',
    metrics: 'multi',
    minDims: 0,
    showDims: true,
    build: ({ base, metrics, dims }) => ({
      ...base,
      viz_type: 'table',
      query_mode: 'aggregate',
      metrics,
      groupby: dims,
    }),
  },
};

export const DETAIL_VIZ_CHOICES: [string, string][] = Object.values(
  DETAIL_VIZ_SPECS,
).map(s => [s.key, s.label]);

/** Explicit settings win; otherwise fall back to the source chart's own fields. */
const resolveSlots = (fd: any, dataset?: Dataset) => {
  const explicitMetrics = ensureIsArray(
    fd.drill_detail_chart_metrics ?? fd.drill_detail_chart_metric,
  ).filter(Boolean);
  const explicitDims = ensureIsArray(fd.drill_detail_chart_dimensions).map(
    String,
  );
  return {
    metrics: explicitMetrics.length ? explicitMetrics : getSrcMetrics(fd),
    dims: explicitDims.length ? explicitDims : getSrcDims(fd),
    x: fd.drill_detail_chart_x
      ? String(fd.drill_detail_chart_x)
      : fd.x_axis
        ? String(fd.x_axis)
        : getTemporalColumn(fd, dataset),
    extra: fd.drill_detail_chart_extra
      ? String(fd.drill_detail_chart_extra)
      : undefined,
    metricY: fd.drill_detail_chart_metric_y,
    metricSize: fd.drill_detail_chart_metric_size,
  };
};

export const getSourceDetailViz = (fd: any): DetailVizKey => {
  const v = String(fd.viz_type ?? '');
  if (v === 'pie') return 'pie';
  if (v.includes('bar')) return fd.orientation === 'horizontal' ? 'bar_h' : 'bar';
  if (v.includes('area')) return 'area';
  if (v.includes('line') || v === 'echarts_timeseries') return 'line';
  if (v.startsWith('treemap')) return 'treemap';
  if (v.startsWith('sunburst')) return 'sunburst';
  if (v.startsWith('funnel')) return 'funnel';
  if (v.startsWith('gauge')) return 'gauge';
  if (v.startsWith('radar')) return 'radar';
  if (v.startsWith('heatmap')) return 'heatmap';
  if (v.startsWith('bubble')) return 'bubble';
  if (v.startsWith('big_number')) return 'big_number';
  if (v === 'table') return 'table';
  return 'pie';
};

export const canConvert = (
  key: DetailVizKey,
  fd: QueryFormData,
  dataset?: Dataset,
): boolean => {
  const spec = DETAIL_VIZ_SPECS[key];
  if (!spec) return false;
  const src: any = fd;
  const { metrics, dims, x, extra, metricY, metricSize } = resolveSlots(
    src,
    dataset,
  );
  if (spec.metrics === 'single' || spec.metrics === 'multi') {
    if (metrics.length === 0) return false;
  }
  if (spec.metrics === 'xyz') {
    if (!metrics[0] || !metricY || !metricSize) return false;
    if (!extra && dims.length === 0) return false;
  }
  if (dims.length < spec.minDims) return false;
  if (spec.needsX === 'temporal' && !x) return false;
  return true;
};

export const toFormData = (
  key: DetailVizKey,
  fd: QueryFormData,
  adhocFilters: AdhocFilterLike[],
  dataset?: Dataset,
): QueryFormData => {
  const src: any = fd;
  const spec = DETAIL_VIZ_SPECS[key] ?? DETAIL_VIZ_SPECS.pie;
  const slots = resolveSlots(src, dataset);
  const base: Record<string, any> = {};
  BASE_KEYS.forEach(k => {
    if (src[k] !== undefined) base[k] = src[k];
  });
  base.adhoc_filters = [...ensureIsArray(src.adhoc_filters), ...adhocFilters];
  base.slice_id = 0;

  return spec.build({ base, src, dataset, ...slots }) as QueryFormData;
};
