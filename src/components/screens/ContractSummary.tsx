import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Home, ArrowLeft, Activity } from 'lucide-react';
import { useContract } from '../narrative/ContractContext';
import { InteractiveChart } from '../narrative/InteractiveChart';
import { StackedBarChart } from '../narrative/StackedBarChart';
import { SBButton } from '../boras/SBButton';
import { SBKpi } from '../boras/SBKpi';
import { usePayrollData } from '../../hooks/usePayrollData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Player } from '../../data/playerDatabase';
import { cn } from '../ui/utils';

interface ContractSummaryProps {
  onExploreData: () => void;
  onStartOver: () => void;
  onBack: () => void;
  onNavigateTo?: (screen: string, player: Player, comps: Player[]) => void;
  player: Player | null;
  comps: Player[];
}

export function ContractSummary({ onExploreData, onStartOver, onBack, onNavigateTo, player, comps }: ContractSummaryProps) {
  const { terms, totalValue,            
          guaranteedValue, potentialValue, cbtImpact, yearlyBreakdown, resetTerms } = useContract();
  const { selectedTeamId, setSelectedTeamId, selectedTeamData, availableTeams, loading: payrollLoading } = usePayrollData();
  const [selectedYear, setSelectedYear] = useState<number>(yearlyBreakdown[0]?.year || 2026);

  const cashFlowData = yearlyBreakdown.map(y => ({
    year: y.year.toString(),
    totalCash: y.totalCash,
    deferred: y.deferred,
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
            <h2 className="text-[#ECEDEF]">Contract Summary</h2>
          </div>
          <SBButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
            Back
          </SBButton>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Contract Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-[#17181B] to-[#121315] border-2 border-[#004B73] rounded-[18px] p-8 mb-8 grain-overlay"
        >
          <div className="text-center mb-8">
            <h1 className="text-[#A8B4BD] mb-2">Contract Proposal</h1>
            <div className="text-[#ECEDEF] text-3xl font-bold mb-1">
              {terms.years} Years / ${Math.round(totalValue)}M Total
            </div>
            <div className="text-[#A3A8B0]">
              ${terms.baseAAV}M AAV • {Math.round((guaranteedValue / totalValue) * 100)}% Guaranteed
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            <SBKpi label="Total Value" value={`$${Math.round(totalValue)}M`} />
            <SBKpi label="Guaranteed" value={`$${Math.round(guaranteedValue)}M`} />
            <SBKpi label="Max" value={`$${Math.round(potentialValue)}M`} />
            <SBKpi label="CBT Hit" value={`$${Math.round(cbtImpact)}M/yr`} />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-[#121315] rounded-lg p-5">
              <h4 className="text-[#A8B4BD] text-sm mb-3">Contract Structure</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#A3A8B0]">Salary Distribution</span>
                  <span className="text-[#ECEDEF] capitalize">{terms.salaryStructure}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A3A8B0]">Signing Bonus</span>
                  <span className="text-[#ECEDEF]">${terms.signingBonus}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A3A8B0]">Deferrals</span>
                  <span className="text-[#ECEDEF]">
                    {terms.deferralPercent > 0 ? `${terms.deferralPercent}% / ${terms.deferralYears}yr` : 'None'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#121315] rounded-lg p-5">
              <h4 className="text-[#A8B4BD] text-sm mb-3">Player Protections</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#A3A8B0]">Opt-Out</span>
                  <span className="text-[#ECEDEF]">{terms.optOutYear ? `Year ${terms.optOutYear}` : 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A3A8B0]">No-Trade Clause</span>
                  <span className="text-[#ECEDEF] capitalize">{terms.noTradeClause}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A3A8B0]">Team Option</span>
                  <span className="text-[#ECEDEF]">{terms.teamOptionYear ? `$${terms.teamOptionValue}M` : 'None'}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#121315] rounded-lg p-5">
              <h4 className="text-[#A8B4BD] text-sm mb-3">Incentives</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#A3A8B0]">Performance</span>
                  <span className="text-[#ECEDEF]">${terms.performanceBonus}M/yr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A3A8B0]">Awards</span>
                  <span className="text-[#ECEDEF]">${terms.awardBonus}M/yr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A3A8B0]">Escalators</span>
                  <span className="text-[#ECEDEF]">{terms.hasEscalator ? `${terms.escalatorPercent}%` : 'None'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cash Flow & CBT Charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
          >
            <h3 className="text-[#ECEDEF] mb-4">Annual Cash Flow</h3>
            <InteractiveChart 
              data={cashFlowData}
              type="bar"
              dataKey="totalCash"
              xKey="year"
              color="#A8B4BD"
              height={280}
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#121315] rounded p-3">
                <div className="text-[#A3A8B0] mb-1">Year 1 Cash</div>
                <div className="text-[#ECEDEF]">${yearlyBreakdown[0]?.totalCash.toFixed(1)}M</div>
              </div>
              <div className="bg-[#121315] rounded p-3">
                <div className="text-[#A3A8B0] mb-1">Final Year Cash</div>
                <div className="text-[#ECEDEF]">${yearlyBreakdown[terms.years - 1]?.totalCash.toFixed(1)}M</div>
              </div>
              <div className="bg-[#121315] rounded p-3">
                <div className="text-[#A3A8B0] mb-1">Signing Bonus</div>
                <div className="text-[#ECEDEF]">${terms.signingBonus.toFixed(1)}M</div>
              </div>
              <div className="bg-[#121315] rounded p-3">
                <div className="text-[#A3A8B0] mb-1">Guaranteed</div>
                <div className="text-[#ECEDEF]">${guaranteedValue.toFixed(1)}M</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
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
              <div className="h-[280px] flex items-center justify-center text-[#A3A8B0] text-sm">
                Loading payroll data...
              </div>
            ) : teamPayrollData.length > 0 ? (
              <StackedBarChart 
                data={teamPayrollData}
                xKey="year"
                dataKeys={[
                  { key: 'basePayroll', color: '#60A5FA', label: 'Team Payroll' },
                  { key: 'playerContract', color: '#A8B4BD', label: 'Player Contract' }
                ]}
                height={280}
              />
            ) : (
              <div className="h-[280px] flex items-center justify-center text-[#A3A8B0] text-sm">
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
                <div className="bg-[#121315] rounded p-3">
                  <div className="text-[#A3A8B0] mb-1">Base Payroll</div>
                  <div className="text-[#ECEDEF]">${basePayroll.toFixed(1)}M</div>
                </div>
                <div className="bg-[#121315] rounded p-3">
                  <div className="text-[#A3A8B0] mb-1">Player $</div>
                  <div className="text-[#ECEDEF]">${playerContract.toFixed(1)}M</div>
                </div>
                <div className="bg-[#121315] rounded p-3">
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
        </div>

        {/* Year-by-Year Breakdown Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 mb-8 grain-overlay"
        >
          <h3 className="text-[#ECEDEF] mb-4">Year-by-Year Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.14)]">
                  <th className="text-left text-[#A3A8B0] pb-3">Year</th>
                  <th className="text-right text-[#A3A8B0] pb-3">Base Salary</th>
                  <th className="text-right text-[#A3A8B0] pb-3">Signing Bonus</th>
                  <th className="text-right text-[#A3A8B0] pb-3">Deferred</th>
                  <th className="text-right text-[#A3A8B0] pb-3">Total Cash</th>
                  <th className="text-right text-[#A3A8B0] pb-3">CBT Hit</th>
                </tr>
              </thead>
              <tbody>
                {yearlyBreakdown.map((year, idx) => (
                  <tr key={year.year} className="border-b border-[rgba(255,255,255,0.08)]">
                    <td className="py-3 text-[#ECEDEF] font-medium">{year.year}</td>
                    <td className="text-right text-[#ECEDEF]">${year.baseSalary.toFixed(1)}M</td>
                    <td className="text-right text-[#ECEDEF]">${year.bonus.toFixed(1)}M</td>
                    <td className="text-right text-[#F472B6]">${year.deferred.toFixed(1)}M</td>
                    <td className="text-right text-[#A8B4BD] font-semibold">${year.totalCash.toFixed(1)}M</td>
                    <td className="text-right text-[#60A5FA]">${year.cbtHit.toFixed(1)}M</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[rgba(255,255,255,0.14)]">
                  <td className="py-3 text-[#ECEDEF] font-bold">Total</td>
                  <td className="text-right text-[#ECEDEF] font-bold">
                    ${yearlyBreakdown.reduce((sum, y) => sum + y.baseSalary, 0).toFixed(1)}M
                  </td>
                  <td className="text-right text-[#ECEDEF] font-bold">
                    ${yearlyBreakdown.reduce((sum, y) => sum + y.bonus, 0).toFixed(1)}M
                  </td>
                  <td className="text-right text-[#F472B6] font-bold">
                    ${yearlyBreakdown.reduce((sum, y) => sum + y.deferred, 0).toFixed(1)}M
                  </td>
                  <td className="text-right text-[#A8B4BD] font-bold">
                    ${yearlyBreakdown.reduce((sum, y) => sum + y.totalCash, 0).toFixed(1)}M
                  </td>
                  <td className="text-right text-[#60A5FA] font-bold">
                    ${(cbtImpact * terms.years).toFixed(1)}M
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-4">
          {onNavigateTo && player && (
            <div className="grid grid-cols-2 gap-4">
              <SBButton 
                size="lg" 
                variant="secondary"
                onClick={() => onNavigateTo('mocap', player, comps)}
                icon={<Activity />}
              >
                View Mocap
              </SBButton>
              <SBButton 
                size="lg" 
                variant="secondary"
                onClick={() => onNavigateTo('mocap-report', player!, comps)}
                icon={<Activity />}
              >
                View Mocap Report
              </SBButton>
            </div>
          )}
          <SBButton 
            size="lg" 
            variant="secondary"
            onClick={() => {
              resetTerms();
              onStartOver();
            }}
          >
            Create New Scenario
          </SBButton>
        </div>
      </div>
    </div>
  );
}
