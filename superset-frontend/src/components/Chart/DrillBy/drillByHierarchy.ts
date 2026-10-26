import { Column, ensureIsArray, isDefined } from '@superset-ui/core';

/** Reads the chart's drill-by hierarchy from snake_case or camelCase form data. */
export const getDrillByHierarchy = (
  formData: Record<string, any> | undefined,
): string[] =>
  ensureIsArray(
    formData?.drill_by_hierarchy ?? formData?.drillByHierarchy ?? [],
  ).map(String);

/** Hierarchy columns first (in order), then every other column as given. */
export const orderByHierarchy = (
  columns: Column[],
  hierarchy: string[],
): Column[] => {
  const byName = new Map(columns.map(col => [col.column_name, col]));
  const first = hierarchy.map(name => byName.get(name)).filter(isDefined);
  const rest = columns.filter(col => !hierarchy.includes(col.column_name));
  return [...first, ...rest];
};

/** First hierarchy column still available; falls back to first available column. */
export const getNextDrillColumn = (
  columns: Column[],
  hierarchy: string[],
  exclude: Column[] = [],
): Column | undefined => {
  const excluded = new Set(exclude.map(col => col.column_name));
  return orderByHierarchy(columns, hierarchy).find(
    col => !excluded.has(col.column_name),
  );
};
