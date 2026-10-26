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

import { useCallback, useContext, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { t } from '@apache-superset/core/translation';
import {
  BinaryQueryObjectFilterClause,
  QueryFormData,
} from '@superset-ui/core';
import { css, useTheme } from '@apache-superset/core/theme';
import { Button, Modal } from '@superset-ui/core/components';
import { Radio } from '@superset-ui/core/components/Radio';
import { useSelector } from 'react-redux';
import { DashboardPageIdContext } from 'src/dashboard/containers/DashboardPage';
import { isEmbedded } from 'src/dashboard/util/isEmbedded';
import { Slice } from 'src/types/Chart';
import { RootState } from 'src/dashboard/types';
import { findPermission } from 'src/utils/findPermission';
import { Dataset, DrillByType } from '../types';
import DrillDetailPane from './DrillDetailPane';
import DrillDetailChart from './DrillDetailChart';
import DrillDetailFilterBar from './DrillDetailFilterBar';
import {
  getLockedFilters,
  useDrillDetailFilters,
} from './useDrillDetailFilters';
import {
  canConvert,
  DetailVizKey,
  getSourceDetailViz,
} from './vizConverters';

interface ModalFooterProps {
  canExplore: boolean;
  closeModal?: () => void;
  exploreChart: () => void;
}

const ModalFooter = ({
  canExplore,
  closeModal,
  exploreChart,
}: ModalFooterProps) => {
  const theme = useTheme();

  return (
    <>
      {!isEmbedded() && (
        <Button
          buttonStyle="secondary"
          buttonSize="small"
          onClick={exploreChart}
          disabled={!canExplore}
          tooltip={
            !canExplore
              ? t('You do not have sufficient permissions to edit the chart')
              : undefined
          }
        >
          {t('Edit chart')}
        </Button>
      )}
      <Button
        buttonStyle="primary"
        buttonSize="small"
        onClick={closeModal}
        data-test="close-drilltodetail-modal"
        css={css`
          margin-left: ${theme.sizeUnit * 2}px;
        `}
      >
        {t('Close')}
      </Button>
    </>
  );
};

interface DrillDetailModalProps {
  chartId: number;
  formData: QueryFormData;
  initialFilters: BinaryQueryObjectFilterClause[];
  showModal: boolean;
  onHideModal: () => void;
  dataset?: Dataset;
}

export default function DrillDetailModal({
  chartId,
  formData,
  initialFilters,
  showModal,
  onHideModal,
  dataset,
}: DrillDetailModalProps) {
  const theme = useTheme();
  const history = useHistory();
  const dashboardPageId = useContext(DashboardPageIdContext);
  const { slice_name: chartName } = useSelector(
    (state: { sliceEntities: { slices: Record<number, Slice> } }) =>
      state.sliceEntities?.slices?.[chartId] || {},
  );
  const canExplore = useSelector((state: RootState) =>
    findPermission('can_explore', 'Superset', state.user?.roles),
  );

  const exploreUrl = useMemo(
    () => `/explore/?dashboard_page_id=${dashboardPageId}&slice_id=${chartId}`,
    [chartId, dashboardPageId],
  );

  const exploreChart = useCallback(() => {
    history.push(exploreUrl);
  }, [exploreUrl, history]);

  // ---- per-chart settings (Customize → View Details pop-up) ----
  const fd: any = formData;
  const showFilterBar = Boolean(fd.drill_detail_filters_enabled);
  const showChartTab = Boolean(fd.drill_detail_chart_enabled);
  const configuredViz = fd.drill_detail_chart_type as
    | DetailVizKey
    | 'same'
    | undefined;

  const vizKey: DetailVizKey = useMemo(() => {
    const wanted =
      !configuredViz || configuredViz === 'same'
        ? getSourceDetailViz(formData)
        : configuredViz;
    return canConvert(wanted, formData, dataset)
      ? wanted
      : getSourceDetailViz(formData);
  }, [configuredViz, formData, dataset]);

  // ---- shared filter state (chips) ----
  const { filters, setFilters, add, remove, clear, adhocFilters } =
    useDrillDetailFilters(initialFilters);
  const lockedFilters = useMemo(() => getLockedFilters(formData), [formData]);

  // ---- view state ----
  const [mode, setMode] = useState<DrillByType>(DrillByType.Table);
  const effectiveMode = showChartTab ? mode : DrillByType.Table;

  return (
    <Modal
      show={showModal}
      onHide={onHideModal ?? (() => null)}
      css={css`
        .ant-modal-body {
          display: flex;
          flex-direction: column;
        }
      `}
      name={t('View Details: %s', chartName)}
      title={t('View Details: %s', chartName)}
      footer={
        <ModalFooter exploreChart={exploreChart} canExplore={canExplore} />
      }
      responsive
      resizable
      resizableConfig={{
        minHeight: theme.sizeUnit * 128,
        minWidth: theme.sizeUnit * 128,
        defaultSize: {
          width: 'auto',
          height: '75vh',
        },
      }}
      draggable
      destroyOnHidden
      maskClosable={false}
    >
      {showFilterBar && (
        <DrillDetailFilterBar
          formData={formData}
          dataset={dataset}
          lockedFilters={lockedFilters}
          filters={filters}
          adhocFilters={adhocFilters}
          onAdd={add}
          onRemove={remove}
          onClear={clear}
        />
      )}

      {showChartTab && (
        <div
          css={css`
            margin-bottom: ${theme.sizeUnit * 3}px;
          `}
        >
          <Radio.GroupWrapper
            value={mode}
            onChange={({ target: { value } }) =>
              setMode(value as DrillByType)
            }
            options={[
              { label: t('Chart'), value: DrillByType.Chart },
              { label: t('Table'), value: DrillByType.Table },
            ]}
            optionType="button"
            buttonStyle="outline"
            data-test="drill-detail-display-toggle"
          />
        </div>
      )}

      {effectiveMode === DrillByType.Table ? (
        <DrillDetailPane
          formData={formData}
          filters={filters}
          setFilters={setFilters}
          showChips={!showFilterBar}
          dataset={dataset}
          chartName={chartName}
        />
      ) : (
        <DrillDetailChart
          formData={formData}
          dataset={dataset}
          adhocFilters={adhocFilters}
          vizKey={vizKey}
        />
      )}
    </Modal>
  );
}
