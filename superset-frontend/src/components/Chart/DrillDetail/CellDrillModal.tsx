import { useMemo } from 'react';
import { t } from '@apache-superset/core/translation';
import {
  BinaryQueryObjectFilterClause,
  ensureIsArray,
  QueryFormData,
} from '@superset-ui/core';
import { css, useTheme } from '@apache-superset/core/theme';
import { Button, Modal } from '@superset-ui/core/components';
import { Dataset } from '../types';
import DrillDetailChart from './DrillDetailChart';
import DrillDetailFilterBar from './DrillDetailFilterBar';
import {
  getLockedFilters,
  useDrillDetailFilters,
} from './useDrillDetailFilters';
import { DetailVizKey } from './vizConverters';

export interface CellDrillConfig {
  column: string;
  chartType: string;
  title?: string;
  metrics?: any[];
  dimensions?: string[];
  x?: string;
  extra?: string;
  metricY?: any;
  metricSize?: any;
}

interface Props {
  formData: QueryFormData;
  dataset?: Dataset;
  config: CellDrillConfig;
  initialFilters: BinaryQueryObjectFilterClause[];
  onHideModal: () => void;
}

export default function CellDrillModal({
  formData,
  dataset,
  config,
  initialFilters,
  onHideModal,
}: Props) {
  const theme = useTheme();
  const { filters, add, remove, clear, adhocFilters } =
    useDrillDetailFilters(initialFilters);
  const lockedFilters = useMemo(() => getLockedFilters(formData), [formData]);

  // The pop-up queries the DATASET, not the host chart's query: no inherited
  // query_mode, columns, adhoc_filters or row_limit. Only dashboard-level
  // context (native filters, time range) carries over.
  const chartFormData = useMemo(
    () =>
      ({
        datasource: formData.datasource,
        extra_form_data: (formData as any).extra_form_data,
        extra_filters: (formData as any).extra_filters,
        time_range: (formData as any).time_range,
        granularity_sqla: (formData as any).granularity_sqla,
        adhoc_filters: [],
        row_limit: 10000,
        slice_id: 0,
        drill_detail_chart_metric: ensureIsArray(config.metrics)[0],
        drill_detail_chart_metrics: ensureIsArray(config.metrics),
        drill_detail_chart_dimensions: ensureIsArray(config.dimensions),
        drill_detail_chart_x: config.x,
        drill_detail_chart_extra: config.extra,
        drill_detail_chart_metric_y: config.metricY,
        drill_detail_chart_metric_size: config.metricSize,
      }) as QueryFormData,
    [formData, config],
  );

  return (
    <Modal
      show
      onHide={onHideModal}
      css={css`
        .ant-modal-body {
          display: flex;
          flex-direction: column;
        }
      `}
      name={config.title || config.column}
      title={config.title || t('Details: %s', config.column)}
      footer={
        <Button buttonStyle="primary" buttonSize="small" onClick={onHideModal}>
          {t('Close')}
        </Button>
      }
      responsive
      resizable
      resizableConfig={{
        minHeight: theme.sizeUnit * 110,
        minWidth: theme.sizeUnit * 120,
        defaultSize: { width: 'auto', height: '65vh' },
      }}
      draggable
      destroyOnHidden
      maskClosable={false}
    >
      <DrillDetailFilterBar
        formData={chartFormData}
        dataset={dataset}
        lockedFilters={lockedFilters}
        filters={filters}
        adhocFilters={adhocFilters}
        onAdd={add}
        onRemove={remove}
        onClear={clear}
      />
      <DrillDetailChart
        formData={chartFormData}
        dataset={dataset}
        adhocFilters={adhocFilters}
        vizKey={config.chartType as DetailVizKey}
      />
    </Modal>
  );
}
