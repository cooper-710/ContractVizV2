import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Settings } from 'lucide-react';
import { useContract } from '../narrative/ContractContext';
import { InteractiveChart } from '../narrative/InteractiveChart';
import { StackedBarChart } from '../narrative/StackedBarChart';
import { SBButton } from '../boras/SBButton';
import { SBKpi } from '../boras/SBKpi';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { usePayrollData } from '../../hooks/usePayrollData';

interface ContractArchitectureProps {
  onContinue: () => void;
  onBack: () => void;
}

export function ContractArchitecture({ onContinue, onBack }: ContractArchitectureProps) {
  const { terms, updateTerm, totalValue, guaranteedValue, potentialValue, cbtImpact, yearlyBreakdown } = useContract();
  const { selectedTeamId, setSelectedTeamId, selectedTeamData, availableTeams, loading: payrollLoading } = usePayrollData();
  const [selectedYear, setSelectedYear] = useState<number>(yearlyBreakdown[0]?.year || 2026);

  // Chart data
  const cashFlowData = yearlyBreakdown.map(y => ({
    year: y.year.toString(),
    salary: y.baseSalary + y.bonus,
    deferred: y.deferred,
    total: y.totalCash,
  }));

  // Team payroll visualization - shows base payroll from CSV + player contract
  // Data only goes through 2031, so we'll show 2026-2031 (and handle contract years beyond that)
  const teamPayrollData = useMemo(() => {
    if (!selectedTeamData || payrollLoading) {
      // Fallback to hardcoded data if loading or no data
      return yearlyBreakdown.map(y => ({
        year: y.year.toString(),
        basePayroll: 180,
        playerContract: y.totalCash,
      }));
    }

    // Create a map of payroll by year from CSV data
    const payrollByYearMap = new Map<number, number>();
    selectedTeamData.payrollByYear.forEach(({ year, payroll }) => {
      payrollByYearMap.set(year, payroll);
    });

    // Generate data for contract years (2026-2031 and beyond)
    // For years with missing data, use the last available year's value
    const yearsWithData = Array.from(payrollByYearMap.keys()).sort((a, b) => b - a);
    const lastAvailableYear = yearsWithData[0];
    const lastAvailablePayroll = lastAvailableYear ? payrollByYearMap.get(lastAvailableYear) || 0 : 0;
    
    return yearlyBreakdown.map(y => {
      // Get payroll for this year, or use last available value for missing years
      let basePayroll = payrollByYearMap.get(y.year);
      if (basePayroll === undefined) {
        basePayroll = lastAvailablePayroll;
      }
      return {
        year: y.year.toString(),
        basePayroll,
        playerContract: y.totalCash,
      };
    });
  }, [selectedTeamData, yearlyBreakdown, payrollLoading]);

  // Get values for selected year
  const { basePayroll, playerContract, totalPayroll } = useMemo(() => {
    const yearData = teamPayrollData.find(d => parseInt(d.year) === selectedYear);
    if (!yearData) {
      return { basePayroll: 0, playerContract: 0, totalPayroll: 0 };
    }
    
    return {
      basePayroll: yearData.basePayroll,
      playerContract: yearData.playerContract,
      totalPayroll: yearData.basePayroll + yearData.playerContract,
    };
  }, [teamPayrollData, selectedYear]);

  return (
    <div className="min-h-screen bg-[#0B0B0C] overflow-auto">
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-[#ECEDEF]">Contract Structure</h2>
          </div>
          <div className="flex gap-3">
            <SBButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
              Back
            </SBButton>
            <SBButton onClick={onContinue} icon={<ArrowRight size={18} />} iconPosition="right">
              View Complete Analysis
            </SBButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Extensive Controls */}
          <div className="col-span-1 space-y-4 pr-2">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#17181B]">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="structure">Structure</TabsTrigger>
                <TabsTrigger value="clauses">Clauses</TabsTrigger>
              </TabsList>

              {/* BASIC TAB */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
                  <h3 className="text-[#ECEDEF] mb-6 flex items-center gap-2">
                    <Settings size={16} className="text-[#A8B4BD]" />
                    Base Terms
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-[#A3A8B0] mb-3 block">
                        Contract Length: <span className="text-[#A8B4BD]">{terms.years} years</span>
                      </Label>
                      <Slider 
                        value={[terms.years]} 
                        onValueChange={([val]) => updateTerm('years', val)}
                        min={1} 
                        max={15} 
                        step={1}
                        className="mb-2"
                      />
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="number"
                          value={terms.years}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val >= 1 && val <= 15) updateTerm('years', val);
                          }}
                          min={1}
                          max={15}
                          className="bg-[#121315] border-[rgba(255,255,255,0.14)] text-[#ECEDEF] h-8"
                        />
                      </div>
                      <p className="text-[#A3A8B0] text-xs mt-2">Total commitment duration (1-15 years)</p>
                    </div>

                    <div>
                      <Label className="text-[#A3A8B0] mb-3 block">
                        Base AAV: <span className="text-[#A8B4BD]">${terms.baseAAV}M</span>
                      </Label>
                      <Slider 
                        value={[terms.baseAAV]} 
                        onValueChange={([val]) => updateTerm('baseAAV', val)}
                        min={0} 
                        max={70} 
                        step={1}
                        className="mb-2"
                      />
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="number"
                          value={terms.baseAAV}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0 && val <= 70) updateTerm('baseAAV', val);
                          }}
                          min={0}
                          max={70}
                          step="any"
                          className="bg-[#121315] border-[rgba(255,255,255,0.14)] text-[#ECEDEF] h-8"
                        />
                      </div>
                      <p className="text-[#A3A8B0] text-xs mt-2">Average annual value baseline ($0-70M)</p>
                    </div>

                    <div>
                      <Label className="text-[#A3A8B0] mb-3 block">
                        Signing Bonus: <span className="text-[#A8B4BD]">${terms.signingBonus}M</span>
                      </Label>
                      <Slider 
                        value={[terms.signingBonus]} 
                        onValueChange={([val]) => updateTerm('signingBonus', val)}
                        min={0} 
                        max={75} 
                        step={1}
                        className="mb-2"
                      />
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="number"
                          value={terms.signingBonus}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0 && val <= 75) updateTerm('signingBonus', val);
                          }}
                          min={0}
                          max={75}
                          step="any"
                          className="bg-[#121315] border-[rgba(255,255,255,0.14)] text-[#ECEDEF] h-8"
                        />
                      </div>
                      <p className="text-[#A3A8B0] text-xs mt-2">Upfront payment in Year 1 (up to $75M)</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* STRUCTURE TAB */}
              <TabsContent value="structure" className="space-y-4 mt-4">
                <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
                  <h3 className="text-[#ECEDEF] mb-6">Salary Distribution</h3>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-[#A3A8B0] mb-3 block">Salary Structure</Label>
                      <Select 
                        value={terms.salaryStructure} 
                        onValueChange={(val) => updateTerm('salaryStructure', val)}
                      >
                        <SelectTrigger className="bg-[#121315] border-[rgba(255,255,255,0.14)]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121315] border-[rgba(255,255,255,0.14)]">
                          <SelectItem value="even">Even Distribution</SelectItem>
                          <SelectItem value="front-loaded">Front-Loaded</SelectItem>
                          <SelectItem value="back-loaded">Back-Loaded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {terms.salaryStructure !== 'even' && (
                      <div>
                        <Label className="text-[#A3A8B0] mb-3 block">
                          Load Percentage: <span className="text-[#A8B4BD]">{terms.frontLoadPercent}%</span>
                        </Label>
                        <Slider 
                          value={[terms.frontLoadPercent]} 
                          onValueChange={([val]) => updateTerm('frontLoadPercent', val)}
                          min={5} 
                          max={30} 
                          step={5}
                          className="mb-2"
                        />
                        <p className="text-[#A3A8B0] text-xs">How much to front/back load</p>
                      </div>
                    )}

                    <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
                      <h4 className="text-[#ECEDEF] text-sm mb-4">Deferrals</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-[#A3A8B0] mb-3 block">
                            Deferred Amount: <span className="text-[#A8B4BD]">{terms.deferralPercent}%</span>
                          </Label>
                          <Slider 
                            value={[terms.deferralPercent]} 
                            onValueChange={([val]) => updateTerm('deferralPercent', val)}
                            min={0} 
                            max={60} 
                            step={5}
                            className="mb-2"
                          />
                        </div>

                        {terms.deferralPercent > 0 && (
                          <>
                            <div>
                              <Label className="text-[#A3A8B0] mb-3 block">
                                Deferral Period: <span className="text-[#A8B4BD]">{terms.deferralYears} years</span>
                              </Label>
                              <Slider 
                                value={[terms.deferralYears]} 
                                onValueChange={([val]) => updateTerm('deferralYears', val)}
                                min={5} 
                                max={20} 
                                step={1}
                                className="mb-2"
                              />
                            </div>
                            <div>
                              <Label className="text-[#A3A8B0] mb-3 block">
                                Interest Rate: <span className="text-[#A8B4BD]">{terms.deferralInterest}%</span>
                              </Label>
                              <Slider 
                                value={[terms.deferralInterest]} 
                                onValueChange={([val]) => updateTerm('deferralInterest', Number(val.toFixed(1)))}
                                min={0} 
                                max={8} 
                                step={0.5}
                                className="mb-2"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
                      <h4 className="text-[#ECEDEF] text-sm mb-4">Performance Bonuses</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-[#A3A8B0] mb-3 block">
                            Performance Bonus: <span className="text-[#A8B4BD]">${terms.performanceBonus}M/yr</span>
                          </Label>
                          <Slider 
                            value={[terms.performanceBonus]} 
                            onValueChange={([val]) => updateTerm('performanceBonus', val)}
                            min={0} 
                            max={5} 
                            step={0.5}
                            className="mb-2"
                          />
                          <p className="text-[#A3A8B0] text-xs">HR, RBI, BA thresholds</p>
                        </div>

                        <div>
                          <Label className="text-[#A3A8B0] mb-3 block">
                            Award Bonus: <span className="text-[#A8B4BD]">${terms.awardBonus}M/yr</span>
                          </Label>
                          <Slider 
                            value={[terms.awardBonus]} 
                            onValueChange={([val]) => updateTerm('awardBonus', val)}
                            min={0} 
                            max={3} 
                            step={0.5}
                            className="mb-2"
                          />
                          <p className="text-[#A3A8B0] text-xs">MVP, All-Star, Silver Slugger</p>
                        </div>

                        <div>
                          <Label className="text-[#A3A8B0] mb-3 block">
                            Playing Time Bonus: <span className="text-[#A8B4BD]">${terms.playingTimeBonus}M/yr</span>
                          </Label>
                          <Slider 
                            value={[terms.playingTimeBonus]} 
                            onValueChange={([val]) => updateTerm('playingTimeBonus', val)}
                            min={0} 
                            max={2} 
                            step={0.25}
                            className="mb-2"
                          />
                          <p className="text-[#A3A8B0] text-xs">Plate appearances threshold</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* CLAUSES TAB */}
              <TabsContent value="clauses" className="space-y-4 mt-4">
                <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
                  <h3 className="text-[#ECEDEF] mb-6">Options & Protections</h3>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-[#A3A8B0]">Player Opt-Out</Label>
                        <Switch 
                          checked={terms.optOutYear !== null}
                          onCheckedChange={(checked) => updateTerm('optOutYear', checked ? 4 : null)}
                          className="data-[state=checked]:bg-[#004B73]"
                        />
                      </div>
                      {terms.optOutYear !== null && (
                        <div>
                          <Label className="text-[#A3A8B0] mb-2 block text-xs">
                            Opt-Out After Year: <span className="text-[#A8B4BD]">{terms.optOutYear}</span>
                          </Label>
                          <Slider 
                            value={[terms.optOutYear]} 
                            onValueChange={([val]) => updateTerm('optOutYear', val)}
                            min={3} 
                            max={terms.years - 1} 
                            step={1}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-[#A3A8B0]">Team Option</Label>
                        <Switch 
                          checked={terms.teamOptionYear !== null}
                          onCheckedChange={(checked) => updateTerm('teamOptionYear', checked ? terms.years : null)}
                          className="data-[state=checked]:bg-[#004B73]"
                        />
                      </div>
                      {terms.teamOptionYear !== null && (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-[#A3A8B0] mb-2 block text-xs">
                              Option Value: <span className="text-[#A8B4BD]">${terms.teamOptionValue}M</span>
                            </Label>
                            <Slider 
                              value={[terms.teamOptionValue]} 
                              onValueChange={([val]) => updateTerm('teamOptionValue', val)}
                              min={15} 
                              max={35} 
                              step={5}
                            />
                          </div>
                          <div>
                            <Label className="text-[#A3A8B0] mb-2 block text-xs">
                              Buyout: <span className="text-[#A8B4BD]">${terms.buyoutValue}M</span>
                            </Label>
                            <Slider 
                              value={[terms.buyoutValue]} 
                              onValueChange={([val]) => updateTerm('buyoutValue', val)}
                              min={0} 
                              max={10} 
                              step={1}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
                      <Label className="text-[#A3A8B0] mb-3 block">No-Trade Protection</Label>
                      <Select 
                        value={terms.noTradeClause} 
                        onValueChange={(val: any) => updateTerm('noTradeClause', val)}
                      >
                        <SelectTrigger className="bg-[#121315] border-[rgba(255,255,255,0.14)]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121315] border-[rgba(255,255,255,0.14)]">
                          <SelectItem value="full">Full No-Trade</SelectItem>
                          <SelectItem value="limited">Limited No-Trade</SelectItem>
                          <SelectItem value="none">No Protection</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {terms.noTradeClause === 'limited' && (
                        <div className="mt-3">
                          <Label className="text-[#A3A8B0] mb-2 block text-xs">
                            Can Block: <span className="text-[#A8B4BD]">{terms.limitedNoTradeTeams} teams</span>
                          </Label>
                          <Slider 
                            value={[terms.limitedNoTradeTeams]} 
                            onValueChange={([val]) => updateTerm('limitedNoTradeTeams', val)}
                            min={5} 
                            max={15} 
                            step={1}
                          />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
                      <h4 className="text-[#ECEDEF] text-sm mb-4">Escalators</h4>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-[#A3A8B0]">Enable Escalator</Label>
                        <Switch 
                          checked={terms.hasEscalator}
                          onCheckedChange={(checked) => updateTerm('hasEscalator', checked)}
                          className="data-[state=checked]:bg-[#004B73]"
                        />
                      </div>
                      
                      {terms.hasEscalator && (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-[#A3A8B0] mb-2 block text-xs">
                              Escalator Amount: <span className="text-[#A8B4BD]">{terms.escalatorPercent}%</span>
                            </Label>
                            <Slider 
                              value={[terms.escalatorPercent]} 
                              onValueChange={([val]) => updateTerm('escalatorPercent', val)}
                              min={2} 
                              max={15} 
                              step={1}
                            />
                          </div>
                          <div>
                            <Label className="text-[#A3A8B0] mb-2 block text-xs">Trigger</Label>
                            <Select 
                              value={terms.escalatorTrigger} 
                              onValueChange={(val) => updateTerm('escalatorTrigger', val)}
                            >
                              <SelectTrigger className="bg-[#121315] border-[rgba(255,255,255,0.14)]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#121315] border-[rgba(255,255,255,0.14)]">
                                <SelectItem value="MVP finish">Top-3 MVP Finish</SelectItem>
                                <SelectItem value="All-Star">All-Star Selection</SelectItem>
                                <SelectItem value="40 HR">40+ Home Runs</SelectItem>
                                <SelectItem value="Playoffs">Playoff Appearance</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Visualizations */}
          <div className="col-span-2 space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
              <SBKpi 
                label="Total Value" 
                value={`$${Math.round(totalValue)}M`}
                className="bg-[#17181B] border-2 border-[#004B73]"
              />
              <SBKpi 
                label="Guaranteed" 
                value={`$${Math.round(guaranteedValue)}M`}
                className="bg-[#17181B]"
              />
              <SBKpi 
                label="Max" 
                value={`$${Math.round(potentialValue)}M`}
                className="bg-[#17181B]"
              />
              <SBKpi 
                label="CBT Hit" 
                value={`$${Math.round(cbtImpact)}M/yr`}
                className="bg-[#17181B]"
              />
            </div>

            {/* Annual Cash Flow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
            >
              <h3 className="text-[#ECEDEF] mb-4">Annual Cash Flow Breakdown</h3>
              <InteractiveChart 
                data={cashFlowData}
                type="bar"
                dataKey="total"
                xKey="year"
                color="#A8B4BD"
                height={280}
              />
              <div className="flex gap-4 text-sm mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#A8B4BD]" />
                  <span className="text-[#A3A8B0]">Cash Paid</span>
                </div>
                {terms.deferralPercent > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#60A5FA]" />
                    <span className="text-[#A3A8B0]">Deferred ({terms.deferralPercent}%)</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Team Payroll Impact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#ECEDEF]">Team Payroll</h3>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger className="w-[200px] bg-[#121315] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]">
                    <SelectValue placeholder="Select Team" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121315] border-[rgba(255,255,255,0.14)]">
                    {[...availableTeams].sort((a, b) => a.name.localeCompare(b.name)).map((team) => (
                      <SelectItem key={team.id} value={team.id} className="text-[#ECEDEF]">
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {payrollLoading ? (
                <div className="h-[240px] flex items-center justify-center text-[#A3A8B0] text-sm">
                  Loading payroll data...
                </div>
              ) : teamPayrollData.length > 0 ? (
                <StackedBarChart 
                  data={teamPayrollData}
                  xKey="year"
                  dataKeys={[
                    { key: 'basePayroll', color: '#60A5FA', label: 'Team Payroll' },
                    { key: 'playerContract', color: '#004B73', label: 'Player Contract' }
                  ]}
                  height={240}
                />
              ) : (
                <div className="h-[240px] flex items-center justify-center text-[#A3A8B0] text-sm">
                  No payroll data available. Please ensure mlb_payroll_commitments_2026_2031.csv is in the public folder.
                </div>
              )}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#A3A8B0] text-xs">Year:</span>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-[100px] h-7 bg-[#0B0B0C] border-[rgba(255,255,255,0.14)] text-[#ECEDEF] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                      {yearlyBreakdown.map((y) => (
                        <SelectItem
                          key={y.year}
                          value={y.year.toString()}
                          className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF] text-xs"
                        >
                          {y.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#121315] rounded-lg p-3">
                    <div className="text-[#A3A8B0] mb-1">Base Payroll</div>
                    <div className="text-[#ECEDEF]">${basePayroll.toFixed(1)}M</div>
                  </div>
                  <div className="bg-[#121315] rounded-lg p-3">
                    <div className="text-[#A3A8B0] mb-1">Player $</div>
                    <div className="text-[#ECEDEF]">${playerContract.toFixed(1)}M</div>
                  </div>
                  <div className="bg-[#121315] rounded-lg p-3">
                    <div className="text-[#A3A8B0] mb-1">Total Payroll</div>
                    <div className="text-emerald-400">${totalPayroll.toFixed(1)}M</div>
                  </div>
                </div>
              </div>
              <p className="text-[#A3A8B0] text-xs mt-3 italic">
                * Payroll data may be incomplete for some teams. Missing years use the last available year's value.<br />
                * Player contract values are based on built structure.
              </p>
            </motion.div>

            {/* Contract Summary */}
            <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
              <h3 className="text-[#ECEDEF] mb-4">Contract Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Structure</span>
                    <span className="text-[#ECEDEF] capitalize">{terms.salaryStructure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Signing Bonus</span>
                    <span className="text-[#ECEDEF]">${terms.signingBonus}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Deferrals</span>
                    <span className="text-[#ECEDEF]">{terms.deferralPercent}% over {terms.deferralYears}yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Max Bonuses/yr</span>
                    <span className="text-[#ECEDEF]">${(terms.performanceBonus + terms.awardBonus + terms.playingTimeBonus).toFixed(1)}M</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Opt-Out</span>
                    <span className="text-[#ECEDEF]">{terms.optOutYear ? `Year ${terms.optOutYear}` : 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Team Option</span>
                    <span className="text-[#ECEDEF]">{terms.teamOptionYear ? `$${terms.teamOptionValue}M` : 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">No-Trade</span>
                    <span className="text-[#ECEDEF] capitalize">{terms.noTradeClause}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Escalator</span>
                    <span className="text-[#ECEDEF]">{terms.hasEscalator ? `${terms.escalatorPercent}%` : 'None'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width bottom button */}
        <SBButton 
          size="lg" 
          onClick={onContinue}
          icon={<ArrowRight size={18} />}
          iconPosition="right"
          className="w-full mt-6"
        >
          View Complete Analysis
        </SBButton>
      </div>
    </div>
  );
}
