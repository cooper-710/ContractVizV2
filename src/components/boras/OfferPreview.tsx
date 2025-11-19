import React from 'react';
import { cn } from '../ui/utils';
import { SBChip } from './SBChip';

interface OfferPreviewProps {
  offer?: {
    years: number;
    aav: string;
    totalValue: string;
    guarantee: string;
    structure: string;
  };
  className?: string;
}

export function OfferPreview({ offer, className }: OfferPreviewProps) {
  if (!offer) {
    return (
      <div className={cn('bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay', className)}>
        <div className="text-center text-[#A3A8B0] py-8">
          No offer data to preview
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[#ECEDEF]">Offer Preview</h3>
        <SBChip type="status" variant="neutral">Draft</SBChip>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-3">
          <span className="text-[#A3A8B0] text-sm">Contract Length</span>
          <span className="text-[#ECEDEF] font-semibold">{offer.years} years</span>
        </div>
        
        <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-3">
          <span className="text-[#A3A8B0] text-sm">Average Annual Value</span>
          <span className="text-[#A8B4BD] font-semibold">{offer.aav}</span>
        </div>
        
        <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-3">
          <span className="text-[#A3A8B0] text-sm">Total Value</span>
          <span className="text-[#ECEDEF] font-semibold">{offer.totalValue}</span>
        </div>
        
        <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-3">
          <span className="text-[#A3A8B0] text-sm">Guaranteed</span>
          <span className="text-[#ECEDEF] font-semibold">{offer.guarantee}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-[#A3A8B0] text-sm">Structure</span>
          <span className="text-[#ECEDEF] text-sm">{offer.structure}</span>
        </div>
      </div>
    </div>
  );
}
