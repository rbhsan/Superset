import { getColumnLabel, QueryFormColumn } from '@superset-ui/core';

type AnyFormData = Record<string, any>;

export function getSeriesSelectorColumn(
  formData: AnyFormData,
): QueryFormColumn | undefined {
  const enabled =
    formData.series_selector_enabled ?? formData.seriesSelectorEnabled;
  if (!enabled) return undefined;
  const col = formData.series_selector_column ?? formData.seriesSelectorColumn;
  if (col === undefined || col === null || col === '') return undefined;
  return Array.isArray(col) ? col[0] : col;
}

export function appendSelectorColumn(
  columns: QueryFormColumn[],
  selector: QueryFormColumn | undefined,
): QueryFormColumn[] {
  if (!selector) return columns;
  const label = getColumnLabel(selector);
  return columns.some(c => getColumnLabel(c) === label)
    ? columns
    : [...columns, selector];
}
