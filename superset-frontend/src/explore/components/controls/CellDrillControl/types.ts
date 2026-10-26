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
  /** which of the clicked row's columns become filters; empty = all */
  filterColumns?: string[];
}
