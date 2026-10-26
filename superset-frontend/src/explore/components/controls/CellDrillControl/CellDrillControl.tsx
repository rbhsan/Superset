import { useCallback, useMemo } from 'react';
import { t } from '@apache-superset/core/translation';
import { css, useTheme } from '@apache-superset/core/theme';
import { ensureIsArray } from '@superset-ui/core';
import { Icons } from '@superset-ui/core/components/Icons';
import ControlHeader from 'src/explore/components/ControlHeader';
import CellDrillPopover from './CellDrillPopover';
import { CellDrillConfig } from './types';

interface Props {
  value?: CellDrillConfig[];
  onChange: (value: CellDrillConfig[]) => void;
  datasource?: { columns?: any[]; metrics?: any[] };
  label?: string;
  description?: string;
  [key: string]: any;
}

const metricLabel = (m: any): string =>
  typeof m === 'string' ? m : (m?.label ?? m?.metric_name ?? '');

const describe = (c: CellDrillConfig) => {
  const dims = ensureIsArray(c.dimensions).join(', ');
  return [
    c.column,
    c.chartType,
    metricLabel(ensureIsArray(c.metrics)[0]),
    dims && `by ${dims}`,
  ]
    .filter(Boolean)
    .join(' · ');
};

export default function CellDrillControl({
  value,
  onChange,
  datasource,
  ...props
}: Props) {
  const theme = useTheme();
  const configs = useMemo(() => ensureIsArray(value), [value]);
  const columns = datasource?.columns ?? [];
  const metrics = datasource?.metrics ?? [];

  const upsert = useCallback(
    (next: CellDrillConfig, index?: number) => {
      const list = [...configs];
      if (index === undefined) list.push(next);
      else list[index] = next;
      onChange(list);
    },
    [configs, onChange],
  );

  const remove = useCallback(
    (index: number) => onChange(configs.filter((_, i) => i !== index)),
    [configs, onChange],
  );

  return (
    <div>
      <ControlHeader {...props} />
      {configs.map((config, index) => (
        <div
          key={`${config.column}-${index}`}
          css={css`
            display: flex;
            align-items: center;
            gap: ${theme.sizeUnit * 2}px;
            border: 1px solid ${theme.colorBorder};
            border-radius: ${theme.borderRadius}px;
            padding: ${theme.sizeUnit}px ${theme.sizeUnit * 2}px;
            margin-bottom: ${theme.sizeUnit}px;
            font-size: ${theme.fontSizeSM}px;
          `}
        >
          <CellDrillPopover
            title={t('Edit drill-down')}
            config={config}
            columns={columns}
            metrics={metrics}
            datasource={datasource}
            onChange={next => upsert(next, index)}
          >
            <span
              css={css`
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                cursor: pointer;
              `}
            >
              {describe(config)}
            </span>
          </CellDrillPopover>
          <Icons.CloseOutlined
            iconSize="s"
            role="button"
            aria-label={t('Remove')}
            onClick={() => remove(index)}
            css={css`
              cursor: pointer;
              color: ${theme.colorTextTertiary};
            `}
          />
        </div>
      ))}
      <CellDrillPopover
        title={t('Add new drill-down')}
        columns={columns}
        metrics={metrics}
        datasource={datasource}
        onChange={next => upsert(next)}
      >
        <div
          role="button"
          tabIndex={0}
          css={css`
            display: flex;
            align-items: center;
            justify-content: center;
            gap: ${theme.sizeUnit}px;
            border: 1px dashed ${theme.colorBorder};
            border-radius: ${theme.borderRadius}px;
            padding: ${theme.sizeUnit * 2}px;
            font-size: ${theme.fontSizeSM}px;
            color: ${theme.colorTextSecondary};
            cursor: pointer;
          `}
        >
          <Icons.PlusOutlined iconSize="s" />
          {t('Add new drill-down')}
        </div>
      </CellDrillPopover>
    </div>
  );
}
