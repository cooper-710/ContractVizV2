import React, { useState } from 'react';
import { Printer, Download } from 'lucide-react';
import { SBButton } from '../boras/SBButton';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

export function OfferSheet() {
  const [watermark, setWatermark] = useState(true);

  return (
    <div className="h-screen bg-[#0B0B0C] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <h2 className="text-[#ECEDEF]">Offer Sheet</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                checked={watermark} 
                onCheckedChange={setWatermark}
                className="data-[state=checked]:bg-[#004B73]"
              />
              <Label className="text-[#A3A8B0] text-sm">Watermark</Label>
            </div>
            <SBButton variant="secondary" size="md" icon={<Printer size={16} />}>
              Print
            </SBButton>
            <SBButton variant="primary" size="md" icon={<Download size={16} />}>
              Download PDF
            </SBButton>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#17181B] p-6">
        <div className="max-w-[900px] mx-auto bg-[#0B0B0C] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-12 grain-overlay relative" data-id="offer.yearly">
          {/* Watermark */}
          {watermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <span className="text-[#004B73] transform -rotate-45" style={{ fontSize: '120px', fontWeight: 600 }}>
                BORAS CORP
              </span>
            </div>
          )}
          
          {/* Header */}
          <div className="text-center mb-12 border-b border-[rgba(255,255,255,0.14)] pb-8">
            <div className="text-[#004B73] mb-2">BORAS CORP</div>
            <h1 className="text-[#ECEDEF] mb-2">CONTRACT OFFER</h1>
            <p className="text-[#A3A8B0]">Player • Position</p>
            <p className="text-[#A3A8B0] text-sm mt-2">Prepared: October 29, 2025</p>
          </div>
          
          {/* Summary Block */}
          <div className="mb-8 bg-[#17181B] rounded-lg p-6 border border-[rgba(255,255,255,0.14)]">
            <h3 className="text-[#004B73] mb-4">Contract Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A3A8B0]">Contract Length:</span>
                <span className="text-[#ECEDEF]">7 Years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A3A8B0]">Total Value:</span>
                <span className="text-[#ECEDEF]">$210,000,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A3A8B0]">Average Annual Value:</span>
                <span className="text-[#A8B4BD] font-semibold">$30,000,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A3A8B0]">Guaranteed:</span>
                <span className="text-[#ECEDEF]">$210,000,000 (100%)</span>
              </div>
            </div>
          </div>
          
          {/* Year by Year Table */}
          <div className="mb-8">
            <h3 className="text-[#ECEDEF] mb-4">Year-by-Year Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.14)] text-[#A3A8B0]">
                    <th className="text-left py-3">Year</th>
                    <th className="text-right py-3">Base Salary</th>
                    <th className="text-right py-3">Signing Bonus</th>
                    <th className="text-right py-3">Escalator</th>
                    <th className="text-right py-3">Annual Total</th>
                  </tr>
                </thead>
                <tbody className="text-[#ECEDEF]">
                  {[
                    { year: 2026, base: '$25M', bonus: '$15M', escalator: '-', total: '$40M' },
                    { year: 2027, base: '$32M', bonus: '-', escalator: '-', total: '$32M' },
                    { year: 2028, base: '$32M', bonus: '-', escalator: '-', total: '$32M' },
                    { year: 2029, base: '$30M', bonus: '-', escalator: '-', total: '$30M' },
                    { year: 2030, base: '$28M', bonus: '-', escalator: '$1M', total: '$29M' },
                    { year: 2031, base: '$25M', bonus: '-', escalator: '$1M', total: '$26M' },
                    { year: 2032, base: '$21M', bonus: '-', escalator: '-', total: '$21M' },
                  ].map((row) => (
                    <tr key={row.year} className="border-b border-[rgba(255,255,255,0.08)]">
                      <td className="py-3">{row.year}</td>
                      <td className="text-right">{row.base}</td>
                      <td className="text-right">{row.bonus}</td>
                      <td className="text-right">{row.escalator}</td>
                      <td className="text-right font-semibold">{row.total}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[#004B73]">
                    <td className="py-3 font-semibold text-[#004B73]">TOTAL</td>
                    <td className="text-right"></td>
                    <td className="text-right"></td>
                    <td className="text-right"></td>
                    <td className="text-right font-semibold text-[#004B73]">$210M</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Clauses & Options */}
          <div className="mb-8">
            <h3 className="text-[#ECEDEF] mb-4">Clauses & Options</h3>
            <div className="space-y-3 text-sm text-[#A3A8B0]">
              <div className="flex">
                <span className="w-6">•</span>
                <span>Full no-trade clause throughout contract duration</span>
              </div>
              <div className="flex">
                <span className="w-6">•</span>
                <span>Player opt-out after Year 4 (2029 season)</span>
              </div>
              <div className="flex">
                <span className="w-6">•</span>
                <span>Club option for Year 8 at $22M (2033 season)</span>
              </div>
              <div className="flex">
                <span className="w-6">•</span>
                <span>Limited no-trade clause in final 2 years (12-team list)</span>
              </div>
            </div>
          </div>
          
          {/* Incentives */}
          <div className="mb-8">
            <h3 className="text-[#ECEDEF] mb-4">Performance Incentives</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A3A8B0]">MVP Award</span>
                <span className="text-[#ECEDEF]">$2,000,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A3A8B0]">Silver Slugger Award</span>
                <span className="text-[#ECEDEF]">$500,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A3A8B0]">All-Star Selection</span>
                <span className="text-[#ECEDEF]">$250,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A3A8B0]">Gold Glove Award</span>
                <span className="text-[#ECEDEF]">$500,000</span>
              </div>
              <div className="flex justify-between border-t border-[rgba(255,255,255,0.08)] pt-2 mt-2">
                <span className="text-[#A3A8B0]">Maximum Annual Incentives</span>
                <span className="text-[#A8B4BD]">$3,250,000</span>
              </div>
            </div>
          </div>
          
          {/* Signature Area */}
          <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-[rgba(255,255,255,0.14)]">
            <div>
              <div className="border-b border-[rgba(255,255,255,0.14)] mb-2 pb-8"></div>
              <p className="text-[#A3A8B0] text-sm">Player Signature</p>
              <p className="text-[#A3A8B0] text-xs mt-1">Date: _____________</p>
            </div>
            <div>
              <div className="border-b border-[rgba(255,255,255,0.14)] mb-2 pb-8"></div>
              <p className="text-[#A3A8B0] text-sm">Club Representative</p>
              <p className="text-[#A3A8B0] text-xs mt-1">Date: _____________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
