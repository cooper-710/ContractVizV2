import React from 'react';
import { BarChart3, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { cn } from '../ui/utils';

interface ChartPlaceholderProps {
  title: string;
  type?: 'band' | 'cashflow' | 'aging' | 'tornado';
  height?: number;
  className?: string;
  'data-id'?: string;
}

export function ChartPlaceholder({ title, type = 'band', height = 240, className, 'data-id': dataId }: ChartPlaceholderProps) {
  const icons = {
    band: BarChart3,
    cashflow: TrendingUp,
    aging: Activity,
    tornado: AlertTriangle,
  };
  
  const Icon = icons[type];
  
  return (
    <div 
      className={cn('bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay', className)}
      style={{ height }}
      data-id={dataId}
    >
      <h4 className="text-[#ECEDEF] mb-4">{title}</h4>
      <div className="flex items-center justify-center h-[calc(100%-2rem)] text-[#A3A8B0]">
        <div className="text-center">
          <Icon size={48} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">{title} visualization</p>
        </div>
      </div>
    </div>
  );
}
