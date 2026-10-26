import { useEffect, useMemo, useState } from 'react';
import { t } from '@apache-superset/core/translation';
import { QueryData, QueryFormData, ensureIsArray } from '@superset-ui/core';
import { Alert } from '@apache-superset/core/components';
import { css } from '@apache-superset/core/theme';
import { Loading, EmptyState } from '@superset-ui/core/components';
import { getQuerySettings } from 'src/explore/exploreUtils';
import { Dataset } from '../types';
import DrillByChart from '../DrillBy/DrillByChart';
import { getChartDataRequest, handleChartDataResponse } from '../chartAction';
import { AdhocFilterLike } from './useDrillDetailFilters';
import { canConvert, DetailVizKey, toFormData } from './vizConverters';

interface Props {
  formData: QueryFormData;
  dataset?: Dataset;
  adhocFilters: AdhocFilterLike[];
  vizKey: DetailVizKey;
}

const NOOP = () => {};

export default function DrillDetailChart({
  formData,
  dataset,
  adhocFilters,
  vizKey,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<QueryData[]>();
  const [error, setError] = useState(false);

  const chartFormData = useMemo(
    () => toFormData(vizKey, formData, adhocFilters, dataset),
    [vizKey, formData, adhocFilters, dataset],
  );

  const isConfigured = useMemo(
    () => canConvert(vizKey, formData, dataset),
    [vizKey, formData, dataset],
  );

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    const [useLegacyApi] = getQuerySettings(chartFormData);
    setLoading(true);
    setError(false);
    setResult(undefined);
    getChartDataRequest({ formData: chartFormData })
      .then(({ response, json }) =>
        handleChartDataResponse(response, json, useLegacyApi),
      )
      .then(res => !cancelled && setResult(res))
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [chartFormData, isConfigured]);

  return (
    <div
      css={css`
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
      `}
      data-test="drill-detail-chart"
    > 
      {!isConfigured && (
        <EmptyState
          size="large"
          image="chart.svg"
          title={t('No metric configured')}
          description={t(
            'Set a Chart tab metric in the chart settings to use this tab.',
          )}
        />
      )}
      {isConfigured && loading && <Loading />}
      {isConfigured && !loading && error && (
        <Alert
          type="error"
          message={t('There was an error loading the chart data')}
        />
      )}
      {isConfigured && !loading && result && (
        <DrillByChart
          key={`${vizKey}-${result.length}`}
          dataset={(dataset ?? {}) as Dataset}
          formData={chartFormData}
          result={result}
          onContextMenu={NOOP}
          inContextMenu={false}
        />
      )}
    </div>
  );
}
