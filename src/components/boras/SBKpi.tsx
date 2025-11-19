import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../ui/utils';

interface SBKpiProps {
  label: string;
  value: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  className?: string;
  'data-id'?: string;
}

export function SBKpi({ label, value, delta, deltaType, className, 'data-id': dataId }: SBKpiProps) {
  return (
    <div className={cn('bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay', className)} data-id={dataId}>
      <div className="text-[#A3A8B0] text-sm mb-2">{label}</div>
      <div className="text-[#ECEDEF] font-semibold mb-1">{value}</div>
      {delta && (
        <div className={cn(
          'flex items-center gap-1 text-xs',
          deltaType === 'positive' && 'text-emerald-400',
          deltaType === 'negative' && 'text-red-400',
          deltaType === 'neutral' && 'text-[#A3A8B0]'
        )}>
          {deltaType === 'positive' && <TrendingUp size={14} />}
          {deltaType === 'negative' && <TrendingDown size={14} />}
          {delta}
        </div>
      )}
    </div>
  );
}
