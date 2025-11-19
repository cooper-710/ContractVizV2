import React from 'react';
import { cn } from '../ui/utils';

interface ToolbarProps {
  primaryLeft?: React.ReactNode;
  filtersCenter?: React.ReactNode;
  secondaryRight?: React.ReactNode;
  className?: string;
}

export function Toolbar({ primaryLeft, filtersCenter, secondaryRight, className }: ToolbarProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 bg-[#121315] border-b border-[rgba(255,255,255,0.14)] px-6 py-4', className)}>
      <div className="flex items-center gap-3">
        {primaryLeft}
      </div>
      <div className="flex items-center gap-3">
        {filtersCenter}
      </div>
      <div className="flex items-center gap-3">
        {secondaryRight}
      </div>
    </div>
  );
}
