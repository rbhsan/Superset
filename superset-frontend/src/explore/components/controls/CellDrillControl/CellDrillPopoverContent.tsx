import { useCallback, useEffect, useMemo, useState } from 'react';
import { t } from '@apache-superset/core/translation';
import { css, useTheme } from '@apache-superset/core/theme';
import { Button, Select } from '@superset-ui/core/components';
import { sections } from '@superset-ui/chart-controls';
import { Input } from 'antd';
import { CellDrillConfig } from './types';
import MetricsControl from 'src/explore/components/controls/MetricControl/MetricsControl';
import { ensureIsArray } from '@superset-ui/core';

interface Props {
  config?: CellDrillConfig;
  columns: { column_name: string; verbose_name?: string }[];
  metrics: { metric_name: string; verbose_name?: string }[];
  datasource?: any;
  onChange: (config: CellDrillConfig) => void;
}

const { DETAIL_VIZ_CHOICES, DETAIL_VIZ_SLOTS } = sections;

const EMPTY: CellDrillConfig = { column: '', chartType: 'pie' };

export default function CellDrillPopoverContent({
  config,
  columns,
  metrics,
  datasource,
  onChange,
}: Props) {
  const theme = useTheme();
  const [draft, setDraft] = useState<CellDrillConfig>(config ?? EMPTY);

  useEffect(() => setDraft(config ?? EMPTY), [config]);

  const slots = DETAIL_VIZ_SLOTS[draft.chartType] ?? DETAIL_VIZ_SLOTS.pie;

  const columnOptions = useMemo(
    () =>
      columns.map(c => ({
        value: c.column_name,
        label: c.verbose_name || c.column_name,
      })),
    [columns],
  );
  const metricOptions = useMemo(
    () =>
      metrics.map(m => ({
        value: m.metric_name,
        label: m.verbose_name || m.metric_name,
      })),
    [metrics],
  );

  const set = useCallback(
    (patch: Partial<CellDrillConfig>) =>
      setDraft(prev => ({ ...prev, ...patch })),
    [],
  );

  // Mirrors canConvert: Apply stays disabled until the type's slots are filled.
  const isValid = (() => {
    if (!draft.column || !draft.chartType) return false;
    const m = draft.metrics ?? [];
    if (slots.metrics === 'single' || slots.metrics === 'multi') {
      if (m.length === 0) return false;
    }
    if (slots.metrics === 'xyz') {
      if (!m[0] || !draft.metricY || !draft.metricSize) return false;
      if (!draft.extra && (draft.dimensions ?? []).length === 0) return false;
    }
    if (slots.showDims && (draft.dimensions ?? []).length === 0) {
      // dimensions optional for types that don't require them
      if (['pie', 'treemap', 'sunburst', 'funnel', 'heatmap'].includes(draft.chartType))
        return false;
    }
    return true;
  })();

  const field = (label: string, node: JSX.Element) => (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        gap: ${theme.sizeUnit}px;
      `}
    >
      <span
        css={css`
          font-size: ${theme.fontSizeSM}px;
          color: ${theme.colorTextSecondary};
        `}
      >
        {label}
      </span>
      {node}
    </div>
  );
  
  const metricField = (
    label: string,
    value: any,
    onPick: (v: any) => void,
    multi = false,
  ) => (
    <MetricsControl
      name={`cell-drill-${label}`}
      label={label}
      multi={multi}
      value={value}
      onChange={onPick}
      columns={columns}
      savedMetrics={metrics}
      datasource={datasource}
      datasourceType={datasource?.type}
      clearable
    />
  );

  return (
    <div
      css={css`
        width: ${theme.sizeUnit * 110}px;
        display: flex;
        flex-direction: column;
        gap: ${theme.sizeUnit * 3}px;
      `}
      data-test="cell-drill-popover"
    >
      <div
        css={css`
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: ${theme.sizeUnit * 3}px;
        `}
      >
        {field(
          t('Column'),
          <Select
            ariaLabel={t('Column')}
            options={columnOptions}
            value={draft.column || undefined}
            onChange={v => set({ column: v as string })}
            showSearch
          />,
        )}
        {field(
          t('Chart type'),
          <Select
            ariaLabel={t('Chart type')}
            options={DETAIL_VIZ_CHOICES.map(([value, label]) => ({
              value,
              label,
            }))}
            value={draft.chartType}
            onChange={v =>
              set({
                chartType: v as string,
                // clear slots that don't exist on the new type
                x: undefined,
                extra: undefined,
                metricY: undefined,
                metricSize: undefined,
              })
            }
          />,
        )}

        {slots.metrics === 'single' &&
          metricField(t('Metric'), draft.metrics?.[0], v =>
            set({ metrics: v ? [v] : [] }),
          )}
        {slots.metrics === 'multi' &&
          metricField(
            t('Metrics'),
            draft.metrics ?? [],
            v => set({ metrics: ensureIsArray(v) }),
            true,
          )}
        {slots.metrics === 'xyz' && (
          <>
            {metricField(t('X metric'), draft.metrics?.[0], v =>
              set({ metrics: v ? [v] : [] }),
            )}
            {metricField(t('Y metric'), draft.metricY, v =>
              set({ metricY: v }),
            )}
            {metricField(t('Bubble size metric'), draft.metricSize, v =>
              set({ metricSize: v }),
            )}
          </>
        )}

        {slots.showDims &&
          field(
            t('Dimensions'),
            <Select
              ariaLabel={t('Dimensions')}
              mode="multiple"
              options={columnOptions}
              value={draft.dimensions ?? []}
              onChange={v => set({ dimensions: v as string[] })}
              showSearch
            />,
          )}
	 {field(
          t('Filter by columns'),
          <Select
            ariaLabel={t('Filter by columns')}
            mode="multiple"
            options={columnOptions}
            value={draft.filterColumns ?? []}
            onChange={v => set({ filterColumns: v as string[] })}
            showSearch
            placeholder={t('All columns of the clicked row')}
          />,
        )}
        {slots.needsX &&
          field(
            t('X-axis column'),
            <Select
              ariaLabel={t('X-axis column')}
              options={columnOptions}
              value={draft.x}
              onChange={v => set({ x: v as string })}
              showSearch
              allowClear
            />,
          )}
        {slots.needsExtra &&
          field(
            t('Entity column'),
            <Select
              ariaLabel={t('Entity column')}
              options={columnOptions}
              value={draft.extra}
              onChange={v => set({ extra: v as string })}
              showSearch
              allowClear
            />,
          )}
      </div>

      {field(
        t('Pop-up title (optional)'),
        <Input
          value={draft.title ?? ''}
          placeholder={t('Defaults to the column name')}
          onChange={e => set({ title: e.target.value })}
        />,
      )}

      <div
        css={css`
          display: flex;
          justify-content: flex-end;
        `}
      >
        <Button
          buttonStyle="primary"
          buttonSize="small"
          disabled={!isValid}
          onClick={() => onChange(draft)}
        >
          {t('Apply')}
        </Button>
      </div>
    </div>
  );
}
