import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ChartPlaceholder } from '../boras/ChartPlaceholder';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';

export function ValuationComps() {
  return (
    <div className="h-screen bg-[#0B0B0C] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-[#ECEDEF]">Valuation & Comps</h2>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1200px] mx-auto">
          <Tabs defaultValue="model" className="w-full">
            <TabsList className="bg-[#17181B] border border-[rgba(255,255,255,0.14)]">
              <TabsTrigger value="model" className="data-[state=active]:bg-[#004B73] data-[state=active]:text-[#ECEDEF]">
                Model Output
              </TabsTrigger>
              <TabsTrigger value="comps" className="data-[state=active]:bg-[#004B73] data-[state=active]:text-[#ECEDEF]">
                Player Comps
              </TabsTrigger>
              <TabsTrigger value="sensitivity" className="data-[state=active]:bg-[#004B73] data-[state=active]:text-[#ECEDEF]">
                Sensitivity
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="model" className="space-y-6 mt-6">
              <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
                <h3 className="text-[#ECEDEF] mb-4">Valuation Model</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#A3A8B0]">Point Estimate</span>
                    <span className="text-[#A8B4BD] font-semibold">$30.0M AAV</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#A3A8B0]">Range</span>
                    <span className="text-[#ECEDEF]">$25M - $32M</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
                <h4 className="text-[#ECEDEF] mb-4">Top Value Drivers</h4>
                <div className="space-y-3">
                  {[
                    { driver: 'HR Production (53, 46, 46)', impact: '+$8M' },
                    { driver: 'RBI Consistency', impact: '+$5M' },
                    { driver: 'Market Inflation', impact: '+$4M' },
                    { driver: 'Position Premium (1B)', impact: '+$3M' },
                    { driver: 'Durability Record', impact: '+$3M' },
                    { driver: 'Rookie of Year Pedigree', impact: '+$2M' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-[#A3A8B0]">{item.driver}</span>
                      <span className="text-emerald-400">{item.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="comps" className="space-y-6 mt-6">
              <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
                <h3 className="text-[#ECEDEF] mb-4">Comparable Players</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.08)] text-[#A3A8B0] text-sm">
                        <th className="text-left py-2">Player</th>
                        <th className="text-right py-2">Year</th>
                        <th className="text-right py-2">Years</th>
                        <th className="text-right py-2">AAV</th>
                        <th className="text-right py-2">Total</th>
                        <th className="text-right py-2">WAR Window</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#ECEDEF]">
                      {[
                        { player: 'Freddie Freeman', year: 2022, years: 6, aav: '$27.0M', total: '$162M', war: '4.8' },
                        { player: 'Matt Olson', year: 2022, years: 8, aav: '$21.0M', total: '$168M', war: '5.1' },
                        { player: 'Paul Goldschmidt', year: 2019, years: 5, aav: '$26.0M', total: '$130M', war: '5.5' },
                        { player: 'Anthony Rizzo', year: 2022, years: 2, aav: '$20.0M', total: '$40M', war: '3.2' },
                        { player: 'Jose Abreu', year: 2020, years: 3, aav: '$16.7M', total: '$50M', war: '3.8' },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.02)] cursor-pointer">
                          <td className="py-3">{row.player}</td>
                          <td className="text-right">{row.year}</td>
                          <td className="text-right">{row.years}</td>
                          <td className="text-right text-[#A8B4BD]">{row.aav}</td>
                          <td className="text-right">{row.total}</td>
                          <td className="text-right">{row.war}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sensitivity" className="space-y-6 mt-6">
              <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay space-y-6">
                <div>
                  <Label className="text-[#A3A8B0]">WAR Projection: 6.0</Label>
                  <Slider defaultValue={[6]} min={3} max={9} step={0.5} className="mt-2" />
                </div>
                <div>
                  <Label className="text-[#A3A8B0]">Inflation Rate: 5%</Label>
                  <Slider defaultValue={[5]} min={0} max={10} step={0.5} className="mt-2" />
                </div>
                <div>
                  <Label className="text-[#A3A8B0]">Risk Factor: Medium</Label>
                  <Slider defaultValue={[50]} min={0} max={100} step={10} className="mt-2" />
                </div>
              </div>
              
              <ChartPlaceholder title="Tornado Chart - Sensitivity Analysis" type="tornado" height={320} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
