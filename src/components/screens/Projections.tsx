import React from 'react';
import { ChartPlaceholder } from '../boras/ChartPlaceholder';

export function Projections() {
  return (
    <div className="h-screen bg-[#0B0B0C] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-[#ECEDEF]">Projections</h2>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
          {/* Aging Curve */}
          <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
            <h3 className="text-[#ECEDEF] mb-4">Aging Curve - WAR Projection</h3>
            <ChartPlaceholder title="WAR Projection with Confidence Bands" type="aging" height={280} />
            <p className="text-[#A3A8B0] text-xs mt-3 italic">
              Projection based on comparable player aging patterns and historical data
            </p>
          </div>
          
          {/* $/WAR Analysis */}
          <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
            <h3 className="text-[#ECEDEF] mb-4">$/WAR Value Over Time</h3>
            <ChartPlaceholder title="Annual $/WAR vs Market Rate" type="cashflow" height={280} />
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-[#121315] rounded-lg p-4">
                <div className="text-[#A3A8B0] text-xs mb-1">Current $/WAR</div>
                <div className="text-[#ECEDEF]">$7.9M</div>
              </div>
              <div className="bg-[#121315] rounded-lg p-4">
                <div className="text-[#A3A8B0] text-xs mb-1">Contract Avg $/WAR</div>
                <div className="text-[#A8B4BD]">$8.6M</div>
              </div>
              <div className="bg-[#121315] rounded-lg p-4">
                <div className="text-[#A3A8B0] text-xs mb-1">Final Year $/WAR</div>
                <div className="text-red-400">$10.5M</div>
              </div>
            </div>
          </div>
          
          {/* Risk Bands */}
          <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
            <h3 className="text-[#ECEDEF] mb-4">Risk Assessment</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-[#A3A8B0] text-sm mb-3">Injury Risk</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#A3A8B0]">Risk Level</span>
                      <span className="text-emerald-400">Low</span>
                    </div>
                    <div className="w-full bg-[#121315] rounded-full h-2">
                      <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  <p className="text-[#A3A8B0] text-xs">
                    Strong durability record with minimal DL time over career. No major injury history.
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-[#A3A8B0] text-sm mb-3">Performance Risk</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#A3A8B0]">Risk Level</span>
                      <span className="text-yellow-400">Medium</span>
                    </div>
                    <div className="w-full bg-[#121315] rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <p className="text-[#A3A8B0] text-xs">
                    Consistent elite performance, but aging curve suggests decline in year 8+.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)]">
              <h4 className="text-[#A3A8B0] text-sm mb-3">Monte Carlo Simulation</h4>
              <ChartPlaceholder title="10,000 Simulations - Contract Value Distribution" type="band" height={200} />
              <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
                <div>
                  <div className="text-[#A3A8B0]">10th Percentile</div>
                  <div className="text-red-400">$150M value</div>
                </div>
                <div>
                  <div className="text-[#A3A8B0]">Median</div>
                  <div className="text-[#ECEDEF]">$205M value</div>
                </div>
                <div>
                  <div className="text-[#A3A8B0]">90th Percentile</div>
                  <div className="text-emerald-400">$250M value</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
