import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BinaryQueryObjectFilterClause,
  ensureIsArray,
  isAdhocColumn,
  QueryFormData,
} from '@superset-ui/core';

export type AdhocFilterLike = Record<string, any>;

/** Stable key for a filter: one chip per column. */
export const filterKey = (f: BinaryQueryObjectFilterClause): string =>
  isAdhocColumn(f.col) ? String(f.col.label) : String(f.col);

/** Convert a drill filter into a SIMPLE adhoc filter for chart/data queries. */
export const filterToAdhoc = (
  f: BinaryQueryObjectFilterClause,
): AdhocFilterLike => {
  const subject = filterKey(f);
  const base = {
    expressionType: 'SIMPLE',
    clause: 'WHERE',
    subject,
    isExtra: false,
    filterOptionName: `drill-detail-${subject}`,
  };
  if (f.op === 'IN' || Array.isArray(f.val)) {
    return {
      ...base,
      operator: 'IN',
      operatorId: 'IN',
      comparator: ensureIsArray(f.val),
    };
  }
  if (f.val === null || f.val === undefined) {
    return { ...base, operator: 'IS NULL', operatorId: 'IS_NULL', comparator: null };
  }
  return { ...base, operator: '==', operatorId: 'EQUALS', comparator: f.val };
};

/** Human label for a chip. */
export const formatFilterLabel = (f: BinaryQueryObjectFilterClause): string => {
  const col = filterKey(f);
  if (Array.isArray(f.val)) {
    return `${col} in (${f.formattedVal ?? f.val.join(', ')})`;
  }
  if (f.val === null || f.val === undefined) {
    return `${col} is null`;
  }
  return `${col} = ${f.formattedVal ?? String(f.val)}`;
};

/** Dashboard native filters already applied to the chart — shown as locked chips. */
export const getLockedFilters = (
  formData: QueryFormData,
): BinaryQueryObjectFilterClause[] =>
  ensureIsArray((formData as any).extra_form_data?.filters).map((f: any) => ({
    col: f.col,
    op: f.op,
    val: f.val,
  })) as BinaryQueryObjectFilterClause[];

export const useDrillDetailFilters = (
  initialFilters: BinaryQueryObjectFilterClause[],
) => {
  const [filters, setFilters] =
    useState<BinaryQueryObjectFilterClause[]>(initialFilters);

  // The modal component stays mounted between opens; a new click gives a new
  // initialFilters array, so resync.
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const add = useCallback((f: BinaryQueryObjectFilterClause) => {
    setFilters(prev => [...prev.filter(p => filterKey(p) !== filterKey(f)), f]);
  }, []);

  const remove = useCallback((key: string) => {
    setFilters(prev => prev.filter(p => filterKey(p) !== key));
  }, []);

  const clear = useCallback(() => setFilters([]), []);

  const adhocFilters = useMemo(() => filters.map(filterToAdhoc), [filters]);

  return { filters, setFilters, add, remove, clear, adhocFilters };
};
