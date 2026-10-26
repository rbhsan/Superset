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
import { t } from '@apache-superset/core/translation';
import { css, styled } from '@apache-superset/core/theme';
import { SafeMarkdown } from '@superset-ui/core/components';
import { extendedDayjs as dayjs } from '@superset-ui/core/utils/dates';
import Handlebars from 'handlebars';
import { useMemo, useState, useCallback, useRef } from 'react';
import { isPlainObject } from 'lodash';
import Helpers from 'just-handlebars-helpers';
import HandlebarsGroupBy from 'handlebars-group-by';
import {
  BinaryQueryObjectFilterClause,
  ensureIsArray,
} from '@superset-ui/core';

// The {{drillAttr}} helper runs inside Handlebars' render, which has no access
// to React props, so the active chart's groupby columns are parked here right
// before each render. Renders are synchronous, so there is no interleaving.
let activeDrillColumns: string[] = [];

// Columns with a configured drill-down; {{drillCell}} emits nothing for others.
let activeCellDrillColumns: string[] = [];

let activeCellDrillFilterColumns: Record<string, string[]> = {};

export interface HandlebarsViewerProps {
  templateSource: string;
  data: any;
  /** groupby columns of the chart — used by the {{drillAttr}} helper */
  drillColumns?: string[];
  /** opens View Details filtered to the clicked row */
  onDrillToDetail?: (filters?: BinaryQueryObjectFilterClause[]) => void;
  onCellDrill?: (
    filters: BinaryQueryObjectFilterClause[],
    column: string,
  ) => void;
  /** columns that have a drill-down configured */
  cellDrillColumns?: string[];
  /** per column: which row columns become filters; empty = all */
  cellDrillFilterColumns?: Record<string, string[]>;
}

export const HandlebarsViewer = ({
  templateSource,
  data,
  drillColumns,
  onDrillToDetail,
  onCellDrill,
  cellDrillColumns,
  cellDrillFilterColumns
}: HandlebarsViewerProps) => {
  const [renderedTemplate, setRenderedTemplate] = useState('');
  const [error, setError] = useState('');
  const appContainer = document.getElementById('app');
  const { common } = JSON.parse(
    appContainer?.getAttribute('data-bootstrap') || '{}',
  );
  const htmlSanitization = common?.conf?.HTML_SANITIZATION ?? true;
  const htmlSchemaOverrides =
    common?.conf?.HTML_SANITIZATION_SCHEMA_EXTENSIONS || {};

//  useMemo(() => {
  //  try {
  //    const template = Handlebars.compile(templateSource);
    //  const result = template(data);
    //  setRenderedTemplate(result);
    //  setError('');
  //  } catch (error) {
    //  setRenderedTemplate('');
    //  setError(error.message);
   // }
 // }, [templateSource, data]);
 
   useMemo(() => {
    try {
      activeDrillColumns = ensureIsArray(drillColumns).map(String);
      activeCellDrillColumns = ensureIsArray(cellDrillColumns).map(String);
      activeCellDrillFilterColumns = cellDrillFilterColumns ?? {};
      const template = Handlebars.compile(templateSource);
      const result = template(data);
      setRenderedTemplate(result);
      setError('');
    } catch (error) {
      setRenderedTemplate('');
      setError(error.message);
    }
  }, [templateSource, data, drillColumns, cellDrillColumns, cellDrillFilterColumns]);

  const containerRef = useRef<HTMLDivElement>(null);

  // One delegated listener for every [data-drill] element the template
  // rendered, so templates need no JavaScript of their own.
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const cell = (event.target as HTMLElement)?.closest?.('[data-drill-col]');
      if (cell && onCellDrill) {
        const column = cell.getAttribute('data-drill-col') || '';
        let payload: Record<string, unknown> = {};
        try {
          payload = JSON.parse(cell.getAttribute('data-drill') || '{}');
        } catch {
          payload = {};
        }
        const filters: BinaryQueryObjectFilterClause[] = Object.entries(payload)
          .filter(([, val]) => val !== undefined)
          .map(([col, val]) => ({
            col,
            op: val === null ? ('IS NULL' as any) : '==',
            val: val as any,
            formattedVal: val === null ? '<NULL>' : String(val),
          }));
        event.preventDefault();
        event.stopPropagation();
        onCellDrill(filters, column);
        return;
      }
      if (!onDrillToDetail && !onCellDrill) return;
      const target = (event.target as HTMLElement)?.closest?.('[data-drill]');
      if (!target) return;
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(target.getAttribute('data-drill') || '{}');
      } catch {
        return;
      }
      const filters: BinaryQueryObjectFilterClause[] = Object.entries(payload)
        .filter(([, val]) => val !== undefined)
        .map(([col, val]) => ({
          col,
          op: val === null ? ('IS NULL' as any) : '==',
          val: val as any,
          formattedVal: val === null ? '<NULL>' : String(val),
        }));
      if (filters.length === 0) return;
      event.preventDefault();
      event.stopPropagation();
      onDrillToDetail(filters);
    },
    [onDrillToDetail, onCellDrill],
  );

  const Error = styled.pre`
    white-space: pre-wrap;
  `;

  if (error) {
    return <Error>{error}</Error>;
  }

 /* if (renderedTemplate) {
    return (
      <SafeMarkdown
        source={renderedTemplate}
        htmlSanitization={htmlSanitization}
        htmlSchemaOverrides={htmlSchemaOverrides}
      />
    );
  }*/
  
  if (renderedTemplate) {
    return (
      <div
        ref={containerRef}
        onClick={handleClick}
        css={css`
          [data-drill],
          [data-drill-col] {
            cursor: pointer;
          }
        `}
      >
        <SafeMarkdown
          source={renderedTemplate}
          htmlSanitization={htmlSanitization}
          htmlSchemaOverrides={htmlSchemaOverrides}
        />
      </div>
    );
  }
  
  return <p>{t('Loading...')}</p>;
};

//  usage: {{ dateFormat my_date format="MMMM YYYY" }}
Handlebars.registerHelper('dateFormat', function (context, block) {
  const f = block.hash.format || 'YYYY-MM-DD';
  return dayjs(context).format(f);
});

// usage: {{  }}
Handlebars.registerHelper('stringify', (obj: any, obj2: any) => {
  // calling without an argument
  if (obj2 === undefined)
    throw new Error('Please call with an object. Example: `stringify myObj`');
  return isPlainObject(obj) ? JSON.stringify(obj) : String(obj);
});

Handlebars.registerHelper(
  'formatNumber',
  function (number: any, locale = 'en-US') {
    if (typeof number !== 'number') {
      return number;
    }
    return number.toLocaleString(locale);
  },
);

// usage: {{parseJson jsonString}}
Handlebars.registerHelper('parseJson', (jsonString: string) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    if (error instanceof Error) {
      error.message = `Invalid JSON string: ${error.message}`;
      throw error;
    }
    throw new Error(`Invalid JSON string: ${String(error)}`);
  }
});

/**
 * usage inside {{#each data}}: <div {{drillAttr this}}>…</div>
 * Emits data-drill='{"col":"value",…}' for the chart's groupby columns, which
 * the delegated click handler turns into View Details filters.
 * With explicit args — {{drillAttr this "zone" "circle"}} — only those columns
 * are used.
 */
Handlebars.registerHelper('drillAttr', function (row: any, ...args: any[]) {
  if (!row || typeof row !== 'object') {
    return new Handlebars.SafeString('');
  }
  const explicit = args
    .slice(0, -1)
    .filter(a => typeof a === 'string') as string[];
  const cols = explicit.length ? explicit : activeDrillColumns;
  const payload: Record<string, unknown> = {};
  cols.forEach(col => {
    if (Object.prototype.hasOwnProperty.call(row, col)) {
      payload[col] = row[col];
    }
  });
  if (Object.keys(payload).length === 0) {
    return new Handlebars.SafeString('');
  }
  const json = JSON.stringify(payload)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return new Handlebars.SafeString(`data-drill='${json}'`);
});

/**
 * usage: <td {{drillCell this "ZONE"}}>{{this.ZONE}}</td>
 * Emits the row's dimension values plus data-drill-col, but only when that
 * column has a drill-down configured in the chart settings.
 */
Handlebars.registerHelper('drillCell', function (row: any, column: string) {
  if (
    !row ||
    typeof row !== 'object' ||
    typeof column !== 'string' ||
    !activeCellDrillColumns.includes(column)
  ) {
    return new Handlebars.SafeString('');
  }

  // When the config names filter columns, only those become filters — otherwise
  // a raw-mode row would contribute every column (timestamp, the value itself)
  // and narrow the pop-up query to the single clicked point.
  const only = activeCellDrillFilterColumns[column] ?? [];
  const payload: Record<string, unknown> = {};
  if (only.length) {
    only.forEach(col => {
      if (Object.prototype.hasOwnProperty.call(row, col)) {
        payload[col] = row[col];
      }
    });
  } else {
    activeDrillColumns.forEach(col => {
      if (Object.prototype.hasOwnProperty.call(row, col)) {
        payload[col] = row[col];
      }
    });
    if (
      !Object.prototype.hasOwnProperty.call(payload, column) &&
      Object.prototype.hasOwnProperty.call(row, column)
    ) {
      payload[column] = row[column];
    }
  }  

  const json = JSON.stringify(payload)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const col = String(column)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return new Handlebars.SafeString(
    `data-drill='${json}' data-drill-col='${col}'`,
  );
});

Helpers.registerHelpers(Handlebars);
HandlebarsGroupBy.register(Handlebars);
