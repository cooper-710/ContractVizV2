import React from 'react';
import { cn } from '../ui/utils';

interface SBChipProps {
  type?: 'tag' | 'delta' | 'status';
  variant?: 'default' | 'positive' | 'negative' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export function SBChip({ type = 'tag', variant = 'default', children, className }: SBChipProps) {
  const baseStyles = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium';
  
  const variants = {
    default: 'bg-[#17181B] text-[#A3A8B0] border border-[rgba(255,255,255,0.14)]',
    positive: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    negative: 'bg-red-500/10 text-red-400 border border-red-500/20',
    neutral: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)}>
      {children}
    </span>
  );
}
