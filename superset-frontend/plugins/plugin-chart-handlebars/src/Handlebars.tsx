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
import { styled } from '@apache-superset/core/theme';
import { createRef } from 'react';
import { HandlebarsViewer } from './components/Handlebars/HandlebarsViewer';
import { HandlebarsProps, HandlebarsStylesProps } from './types';
import { ensureIsArray } from '@superset-ui/core';

const DRILL_LINK_HEIGHT = 20;

const Styles = styled.div<HandlebarsStylesProps>`
  display: flex;
  flex-direction: column;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  overflow: auto;
`;

const Scroller = styled.div<{ reserve: number }>`
  flex: 1 1 auto;
  min-height: 0;
  height: ${({ reserve }) => `calc(100% - ${reserve}px)`};
  overflow: auto;
  padding: 0.3rem;
  box-sizing: border-box;
`;

const DrillLinkRow = styled.div`
  flex: 0 0 ${DRILL_LINK_HEIGHT}px;
  height: ${DRILL_LINK_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
  box-sizing: border-box;
`;

const DrillLink = styled.a`
  color: #2563eb;
  font-size: 11px;
  font-weight: 400;
  line-height: 1;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export default function Handlebars(props: HandlebarsProps) {
  const { data, height, width, formData, onDrillToDetail, onCellDrill } = props;
  const styleTemplateSource = formData.styleTemplate
    ? `<style>${formData.styleTemplate}</style>`
    : '';
  const handlebarTemplateSource = formData.handlebarsTemplate
    ? formData.handlebarsTemplate
    : '{{data}}';
  const templateSource = `${handlebarTemplateSource}\n${styleTemplateSource} `;

  const rootElem = createRef<HTMLDivElement>();
  const showDrillLink = Boolean(onDrillToDetail && formData.showDrillLink);

  return (
    <Styles ref={rootElem} height={height} width={width}>
      <Scroller reserve={showDrillLink ? DRILL_LINK_HEIGHT : 0}>
        <HandlebarsViewer
          data={{ data }}
          templateSource={templateSource}
          drillColumns={[
            ...ensureIsArray((formData as any).groupby),
            ...ensureIsArray((formData as any).allColumns),
          ].map(String)}
          onDrillToDetail={onDrillToDetail}
          onCellDrill={onCellDrill}
          cellDrillColumns={ensureIsArray(
            (formData as any).drillDetailCellConfigs ??
              (formData as any).drill_detail_cell_configs,
          ).map((c: any) => String(c.column))}
          cellDrillFilterColumns={Object.fromEntries(
            ensureIsArray(
              (formData as any).drillDetailCellConfigs ??
                (formData as any).drill_detail_cell_configs,
            ).map((c: any) => [
              String(c.column),
              ensureIsArray(c.filterColumns).map(String),
            ]),
          )}
        />
      </Scroller>
      {showDrillLink && (
        <DrillLinkRow>
          <DrillLink
             href="#"
             onClick={e => {
               e.preventDefault();
               onDrillToDetail?.([]);
             }}
          >
            {formData.drillLinkLabel || 'View Details →'}
          </DrillLink>
        </DrillLinkRow>
      )}
    </Styles>
  );
}
