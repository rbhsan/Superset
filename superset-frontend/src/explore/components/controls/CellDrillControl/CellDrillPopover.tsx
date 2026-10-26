import { ReactNode, useState } from 'react';
import { t } from '@apache-superset/core/translation';
import { Popover } from '@superset-ui/core/components';
import CellDrillPopoverContent from './CellDrillPopoverContent';
import { CellDrillConfig } from './types';

interface Props {
  title: string;
  config?: CellDrillConfig;
  columns: any[];
  metrics: any[];
  datasource?: any;
  onChange: (config: CellDrillConfig) => void;
  children: ReactNode;
}

export default function CellDrillPopover({
  title,
  config,
  columns,
  metrics,
  datasource,
  onChange,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      title={title ?? t('Add new drill-down')}
      destroyTooltipOnHide
      content={
        <CellDrillPopoverContent
          config={config}
          columns={columns}
          metrics={metrics}
          datasource={datasource}
          onChange={next => {
            onChange(next);
            setOpen(false);
          }}
        />
      }
    >
      {children}
    </Popover>
  );
}
