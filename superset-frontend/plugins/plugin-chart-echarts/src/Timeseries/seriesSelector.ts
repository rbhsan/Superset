import {
  ensureIsArray,
  getColumnLabel,
  QueryFormColumn,
} from '@superset-ui/core';

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

export function getEffectiveGroupby(formData: AnyFormData): QueryFormColumn[] {
  const groupby = ensureIsArray<QueryFormColumn>(formData.groupby);
  const selector = getSeriesSelectorColumn(formData);
  if (!selector) return groupby;
  const selectorLabel = getColumnLabel(selector);
  return groupby.some(c => getColumnLabel(c) === selectorLabel)
    ? groupby
    : [...groupby, selector];
}

export function getSeriesSelectorIndex(
  effectiveGroupby: QueryFormColumn[],
  selector: QueryFormColumn | undefined,
): number {
  if (!selector) return -1;
  const label = getColumnLabel(selector);
  return effectiveGroupby.findIndex(c => getColumnLabel(c) === label);
}

export function getSeriesSelectorValue(
  seriesName: string,
  labelMap: Record<string, string[]>,
  effectiveGroupbyLength: number,
  selectorIndex: number,
): string | undefined {
  const cols = labelMap[seriesName];
  if (!cols || selectorIndex < 0) return undefined;
  const metricsCount = cols.length - effectiveGroupbyLength;
  if (metricsCount < 0) return undefined;
  const value = cols[metricsCount + selectorIndex];
  return value === undefined || value === null ? undefined : String(value);
}

export function stripSelectorSuffix(name: string, value: string): string {
  const suffix = `, ${value}`;
  return name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}
