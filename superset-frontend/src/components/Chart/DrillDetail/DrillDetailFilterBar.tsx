import { useEffect, useMemo, useState } from 'react';
import { t } from '@apache-superset/core/translation';
import {
  BinaryQueryObjectFilterClause,
  Column,
  ensureIsArray,
  QueryFormData,
} from '@superset-ui/core';
import { css, useTheme } from '@apache-superset/core/theme';
import { Button, Select } from '@superset-ui/core/components';
import { Icons } from '@superset-ui/core/components/Icons';
import { Tag } from 'src/components/Tag';
import { getQuerySettings } from 'src/explore/exploreUtils';
import { Dataset } from '../types';
import { getChartDataRequest, handleChartDataResponse } from '../chartAction';
import {
  getDrillByHierarchy,
  orderByHierarchy,
} from '../DrillBy/drillByHierarchy';
import {
  AdhocFilterLike,
  filterKey,
  formatFilterLabel,
} from './useDrillDetailFilters';

const VALUES_LIMIT = 1000;

interface Props {
  formData: QueryFormData;
  dataset?: Dataset;
  lockedFilters: BinaryQueryObjectFilterClause[];
  filters: BinaryQueryObjectFilterClause[];
  adhocFilters: AdhocFilterLike[];
  onAdd: (f: BinaryQueryObjectFilterClause) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
}

export default function DrillDetailFilterBar({
  formData,
  dataset,
  lockedFilters,
  filters,
  adhocFilters,
  onAdd,
  onRemove,
  onClear,
}: Props) {
  const theme = useTheme();
  const [column, setColumn] = useState<string>();
  const [values, setValues] = useState<(string | number)[]>([]);
  const [options, setOptions] = useState<{ label: string; value: any }[]>([]);
  const [loading, setLoading] = useState(false);

  const columnOptions = useMemo(() => {
    const source: Column[] = ensureIsArray(
      dataset?.drillable_columns?.length
        ? dataset.drillable_columns
        : dataset?.columns,
    ).filter(c => (c as any).is_drill_to_detail !== false);
    return orderByHierarchy(source, getDrillByHierarchy(formData)).map(c => ({
      value: c.column_name,
      label: c.verbose_name || c.column_name,
    }));
  }, [dataset?.drillable_columns, dataset?.columns, formData]);

  // Distinct values of the chosen column, narrowed by the current chips.
  useEffect(() => {
    if (!column) {
      setOptions([]);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    const valuesFormData: any = {
      datasource: formData.datasource,
      viz_type: 'table',
      query_mode: 'aggregate',
      groupby: [column],
      metrics: [],
      adhoc_filters: [
        ...ensureIsArray((formData as any).adhoc_filters),
        ...adhocFilters,
      ],
      extra_form_data: (formData as any).extra_form_data,
      time_range: (formData as any).time_range,
      row_limit: VALUES_LIMIT,
      order_desc: false,
      slice_id: 0,
    };
    const [useLegacyApi] = getQuerySettings(valuesFormData);
    getChartDataRequest({ formData: valuesFormData })
      .then(({ response, json }) =>
        handleChartDataResponse(response, json, useLegacyApi),
      )
      .then(result => {
        if (cancelled) return;
        const rows = ensureIsArray(result?.[0]?.data) as Record<string, any>[];
        const seen = new Set<string>();
        const opts: { label: string; value: any }[] = [];
        rows.forEach(r => {
          const v = r[column];
          const k = v === null || v === undefined ? '__null__' : String(v);
          if (!seen.has(k)) {
            seen.add(k);
            opts.push({
              label: v === null ? t('<NULL>') : String(v),
              value: v,
            });
          }
        });
        setOptions(opts);
      })
      .catch(() => !cancelled && setOptions([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [column, formData, adhocFilters]);

  const handleAdd = () => {
    if (!column || values.length === 0) return;
    const nonNull = values.filter(v => v !== null && v !== undefined);
    const f: BinaryQueryObjectFilterClause =
      nonNull.length === 1
        ? {
            col: column,
            op: '==',
            val: nonNull[0],
            formattedVal: String(nonNull[0]),
          }
        : {
            col: column,
            op: 'IN',
            val: nonNull,
            formattedVal: nonNull.join(', '),
          };
    onAdd(f);
    setValues([]);
  };

  return (
    <div
      css={css`
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: ${theme.sizeUnit * 4}px;
        padding: ${theme.sizeUnit}px 0 ${theme.sizeUnit * 2}px;
        border-bottom: 1px solid ${theme.colorBorderSecondary};
        margin-bottom: ${theme.sizeUnit * 2}px;
      `}
      data-test="drill-detail-filter-bar"
    >
      {/* left: chips */}
      <div
        css={css`
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: ${theme.sizeUnit}px;
          min-height: 32px;
          flex: 1 1 auto;
          min-width: 0;
        `}
      >
        {lockedFilters.map(f => (
          <Tag key={`locked-${filterKey(f)}`} name={formatFilterLabel(f)}>
            <Icons.LockOutlined iconSize="s" />
            <span
              css={css`
                margin-left: ${theme.sizeUnit}px;
                color: ${theme.colorTextSecondary};
              `}
            >
              {formatFilterLabel(f)}
            </span>
          </Tag>
        ))}
        {filters.map((f, index) => (
          <Tag
            editable
            key={filterKey(f)}
            index={index}
            id={index}
            name={formatFilterLabel(f)}
            onDelete={() => onRemove(filterKey(f))}
            data-test="drill-detail-filter-chip"
          >
            {formatFilterLabel(f)}
          </Tag>
        ))}
      </div>

      {/* right: column · values · Add · Clear, single line */}
      <div
        css={css`
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: ${theme.sizeUnit * 2}px;
          flex: 0 0 auto;
        `}
      >
        <Select
          ariaLabel={t('Filter column')}
          placeholder={t('Column')}
          options={columnOptions}
          value={column}
          onChange={v => {
            setColumn(v as string);
            setValues([]);
          }}
          showSearch
          allowClear
          css={css`
            width: ${theme.sizeUnit * 40}px;
          `}
        />
        <Select
          ariaLabel={t('Filter values')}
          placeholder={column ? t('Values') : t('Pick a column first')}
          mode="multiple"
          options={options}
          value={values}
          onChange={v => setValues(ensureIsArray(v) as (string | number)[])}
          loading={loading}
          disabled={!column}
          showSearch
          allowNewOptions
          maxTagCount="responsive"
          css={css`
            width: ${theme.sizeUnit * 60}px;
          `}
        />
        <Button
          buttonStyle="primary"
          buttonSize="small"
          disabled={!column || values.length === 0}
          onClick={handleAdd}
        >
          {t('Add')}
        </Button>
        <Button
          buttonStyle="link"
          buttonSize="small"
          disabled={filters.length === 0}
          onClick={onClear}
        >
          {t('Clear')}
        </Button>
      </div>
    </div>
  );
      
}
