import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { InteractiveChart } from '../narrative/InteractiveChart';
import { SBButton } from '../boras/SBButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Player, StatPeriod, PlayerStats } from '../../data/playerDatabase';
import { getStatsForPeriod, STAT_LABELS, isPitcher, getStatLabelsForPlayer } from '../../data/playerDatabase';

interface PlayerComparisonsProps {
  player: Player | null;
  comps: Player[];
  onContinue: () => void;
  onBack: () => void;
}

type StatKey = keyof Omit<PlayerStats, 'age'>;

const PERIOD_LABELS: Record<StatPeriod, string> = {
  '2025': '2025 Season',
  '3yr-avg': '3-Year Average',
  '3yr-contract': '3-Year Pre-Contract',
  'career': 'Career Average',
};

export function PlayerComparisons({ player, comps, onContinue, onBack }: PlayerComparisonsProps) {
  // If no player or comps selected, show error state
  if (!player || !comps || comps.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A3A8B0] mb-4">Please select a player and comparisons from the intro screen.</p>
          <SBButton onClick={onBack}>Go Back</SBButton>
        </div>
      </div>
    );
  }

  const [timePeriod, setTimePeriod] = useState<StatPeriod>('2025');
  const isPitcherPlayer = isPitcher(player);
  const statLabels = getStatLabelsForPlayer(player);
  
  // Get stat keys based on player type
  const statKeys = useMemo(() => {
    if (isPitcherPlayer) {
      // For pitchers, show pitcher stats
      return ['WAR', 'ERA', 'FIP', 'xFIP', 'Kper9', 'BBper9', 'WHIP', 'IP'] as StatKey[];
    } else {
      // For hitters, show existing hitter stats
      return (Object.keys(STAT_LABELS) as StatKey[]).filter((k) => k !== 'PA');
    }
  }, [isPitcherPlayer]);
  
  const [chartStat1, setChartStat1] = useState<StatKey>(isPitcherPlayer ? 'WAR' : 'wRCplus');
  const [chartStat2, setChartStat2] = useState<StatKey>(isPitcherPlayer ? 'ERA' : 'xwOBA');
  const [chartStat3, setChartStat3] = useState<StatKey>(isPitcherPlayer ? 'FIP' : 'xSLG');

  // Combine player with comps for display (player will be highlighted)
  const allPlayers = useMemo(() => {
    return [...comps, player];
  }, [comps, player]);

  // Get chart data for a specific stat
  const getChartData = (statKey: StatKey) => {
    const formatChartLabel = (fullName: string) => {
      const parts = fullName.trim().split(' ').filter(Boolean);
      if (parts.length === 0) return fullName;
      const suffixes = new Set(['Jr.', 'Sr.', 'II', 'III', 'IV', 'V']);
      const last = parts[parts.length - 1];
      if (suffixes.has(last) && parts.length >= 2) {
        return `${parts[parts.length - 2]} ${last}`; // e.g., "Guerrero Jr."
      }
      return last; // default to last name
    };

    return allPlayers.map(p => ({
      player: formatChartLabel(p.name),
      value: getStatsForPeriod(p, timePeriod)[statKey] as number,
    }));
  };


  // Color palette for charts
  const chartColors = ['#A8B4BD', '#60A5FA', '#F472B6'];

  // Get position display text
  const getPositionText = () => {
    const positions = new Set(allPlayers.map(p => p.position));
    if (positions.size === 1) {
      return `${Array.from(positions)[0]} Contracts`;
    }
    return 'Multi-Position Comparison';
  };

  // Format stat value for display
  const formatStatValue = (statKey: StatKey, value: number): string => {
    // Handle undefined/null values
    if (value === undefined || value === null || isNaN(value)) {
      return '—';
    }
    
    const label = statLabels[statKey] || STAT_LABELS[statKey];
    
    // Pitcher-specific formatting
    if (isPitcherPlayer) {
      if (statKey === 'ERA' || statKey === 'FIP' || statKey === 'xFIP' || statKey === 'WHIP' || statKey === 'BABIP') {
        return value.toFixed(2);
      }
      if (statKey === 'Kper9' || statKey === 'BBper9' || statKey === 'Hper9' || statKey === 'HRper9') {
        return value.toFixed(1);
      }
      if (statKey === 'IP') {
        return value.toFixed(1);
      }
      if (statKey === 'GS' || statKey === 'SV') {
        return Math.round(value).toString();
      }
      if (statKey === 'LOBpct') {
        const pct = value <= 1 ? value * 100 : value;
        return `${pct.toFixed(1)}%`;
      }
      if (statKey === 'WAR') {
        return value.toFixed(1);
      }
    }
    
    // Hitter formatting
    if (label?.includes('%')) {
      const pct = value <= 1 ? value * 100 : value;
      return `${pct.toFixed(2)}%`;
    }
    if (statKey === 'wRCplus' || statKey === 'PA') {
      return Math.round(value).toString();
    }
    if (statKey === 'xwOBA' || statKey === 'xSLG') {
      return value.toFixed(3);
    }
    return value.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] overflow-auto">
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-[#ECEDEF]">Market Comparables</h2>
          </div>
          <div className="flex gap-3">
            <SBButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
              Back
            </SBButton>
            <SBButton onClick={onContinue} icon={<ArrowRight size={18} />} iconPosition="right">
              Estimated Value
            </SBButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Time Period and Stat Selectors */}
        <div className="mb-8 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[#A3A8B0] text-sm">Time Period:</span>
            <Select value={timePeriod} onValueChange={(v: StatPeriod) => setTimePeriod(v)}>
              <SelectTrigger className="w-[200px] bg-[#17181B] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                {(Object.keys(PERIOD_LABELS) as StatPeriod[]).map((period) => (
                  <SelectItem
                    key={period}
                    value={period}
                    className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF]"
                  >
                    {PERIOD_LABELS[period]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-[rgba(255,255,255,0.14)]" />

          <div className="flex items-center gap-4">
            <span className="text-[#A3A8B0] text-sm">Chart Metrics:</span>
            
            <Select value={chartStat1} onValueChange={(v: StatKey) => setChartStat1(v)}>
              <SelectTrigger className="w-[140px] bg-[#17181B] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                {statKeys.map((stat) => (
                  <SelectItem
                    key={stat}
                    value={stat}
                    className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF]"
                  >
                    {statLabels[stat] || STAT_LABELS[stat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={chartStat2} onValueChange={(v: StatKey) => setChartStat2(v)}>
              <SelectTrigger className="w-[140px] bg-[#17181B] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                {statKeys.map((stat) => (
                  <SelectItem
                    key={stat}
                    value={stat}
                    className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF]"
                  >
                    {statLabels[stat] || STAT_LABELS[stat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={chartStat3} onValueChange={(v: StatKey) => setChartStat3(v)}>
              <SelectTrigger className="w-[140px] bg-[#17181B] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                {statKeys.map((stat) => (
                  <SelectItem
                    key={stat}
                    value={stat}
                    className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF]"
                  >
                    {statLabels[stat] || STAT_LABELS[stat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Charts - Dynamic based on selected stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <motion.div
            key={`chart-1-${chartStat1}-${timePeriod}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
          >
            <h3 className="text-[#ECEDEF] mb-4">{statLabels[chartStat1] || STAT_LABELS[chartStat1]}</h3>
            <InteractiveChart 
              data={getChartData(chartStat1)}
              type="bar"
              dataKey="value"
              xKey="player"
              color={chartColors[0]}
              valueIsThreeDecimalRate={chartStat1 === 'xwOBA' || chartStat1 === 'xSLG'}
              valueIsPercent={(statLabels[chartStat1] || STAT_LABELS[chartStat1])?.includes('%')}
              height={340}
            />
          </motion.div>

          <motion.div
            key={`chart-2-${chartStat2}-${timePeriod}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
          >
            <h3 className="text-[#ECEDEF] mb-4">{statLabels[chartStat2] || STAT_LABELS[chartStat2]}</h3>
            <InteractiveChart 
              data={getChartData(chartStat2)}
              type="bar"
              dataKey="value"
              xKey="player"
              color={chartColors[1]}
              valueIsThreeDecimalRate={chartStat2 === 'xwOBA' || chartStat2 === 'xSLG'}
              valueIsPercent={(statLabels[chartStat2] || STAT_LABELS[chartStat2])?.includes('%')}
              height={340}
            />
          </motion.div>

          <motion.div
            key={`chart-3-${chartStat3}-${timePeriod}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
          >
            <h3 className="text-[#ECEDEF] mb-4">{statLabels[chartStat3] || STAT_LABELS[chartStat3]}</h3>
            <InteractiveChart 
              data={getChartData(chartStat3)}
              type="bar"
              dataKey="value"
              xKey="player"
              color={chartColors[2]}
              valueIsThreeDecimalRate={chartStat3 === 'xwOBA' || chartStat3 === 'xSLG'}
              valueIsPercent={(statLabels[chartStat3] || STAT_LABELS[chartStat3])?.includes('%')}
              height={340}
            />
          </motion.div>
        </div>

        {/* Detailed Comp Table */}
        <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#ECEDEF]">
              Detailed Statistical Comparison - {PERIOD_LABELS[timePeriod]}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.14)]">
                  <th className="text-left text-[#A3A8B0] pb-3 sticky left-0 bg-[#17181B] z-10">Player</th>
                  <th className="text-center text-[#A3A8B0] pb-3">Pos</th>
                  <th className="text-center text-[#A3A8B0] pb-3">Team</th>
                  <th className="text-right text-[#A3A8B0] pb-3">Age</th>
                  {statKeys.map((stat) => (
                    <th key={stat} className="text-right text-[#A3A8B0] pb-3 whitespace-nowrap">
                      {statLabels[stat] || STAT_LABELS[stat]}
                    </th>
                  ))}
                  <th className="text-right text-[#A3A8B0] pb-3">AAV</th>
                  <th className="text-right text-[#A3A8B0] pb-3">Years</th>
                </tr>
              </thead>
              <tbody>
                {allPlayers.map((p) => {
                  const isTargetPlayer = p.id === player.id;
                  const stats = getStatsForPeriod(p, timePeriod);
                  
                  return (
                    <tr 
                      key={p.id}
                      className={`border-b border-[rgba(255,255,255,0.08)] ${
                        isTargetPlayer ? 'bg-[#004B73]/10' : ''
                      }`}
                    >
                      <td className={`py-3 text-[#ECEDEF] font-medium sticky left-0 z-10 ${
                        isTargetPlayer ? 'bg-[#004B73]/10' : 'bg-[#17181B]'
                      }`}>
                        {p.name}
                        {isTargetPlayer && (
                          <span className="ml-2 text-xs text-[#004B73] bg-[#004B73]/20 px-2 py-0.5 rounded">
                            Target
                          </span>
                        )}
                      </td>
                      <td className={`text-center text-[#ECEDEF] ${isTargetPlayer ? 'bg-[#004B73]/10' : ''}`}>{p.position}</td>
                      <td className={`text-center text-[#ECEDEF] ${isTargetPlayer ? 'bg-[#004B73]/10' : ''}`}>{p.team}</td>
                      <td className={`text-right text-[#ECEDEF] ${isTargetPlayer ? 'bg-[#004B73]/10' : ''}`}>{stats.age}</td>
                      {statKeys.map((stat) => (
                        <td key={stat} className={`text-right text-[#ECEDEF] ${isTargetPlayer ? 'bg-[#004B73]/10' : ''}`}>
                          {formatStatValue(stat, stats[stat] as number)}
                        </td>
                      ))}
                      <td className={`text-right text-[#A8B4BD] ${isTargetPlayer ? 'bg-[#004B73]/10' : ''}`}>
                        {p.hasContract && p.AAV ? `$${p.AAV}M` : '—'}
                      </td>
                      <td className={`text-right text-[#ECEDEF] ${isTargetPlayer ? 'bg-[#004B73]/10' : ''}`}>
                        {p.hasContract && p.years ? p.years : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.14)]">
            <div className="overflow-x-auto">
              <div className="text-[#A3A8B0] text-sm mb-3">Comp Averages</div>
              <div className="flex gap-6">
                {statKeys.map((stat) => {
                  const avgValue = comps.reduce((sum, p) => {
                    return sum + (getStatsForPeriod(p, timePeriod)[stat] as number);
                  }, 0) / comps.length;
                  
                  return (
                    <div key={`summary-${stat}`} className="text-center min-w-[60px]">
                      <div className="text-[#A3A8B0] text-xs mb-1 whitespace-nowrap">{STAT_LABELS[stat]}</div>
                      <div className="text-[#ECEDEF]">{formatStatValue(stat, avgValue)}</div>
                    </div>
                  );
                })}
                <div className="text-center min-w-[80px]">
                  <div className="text-[#A3A8B0] text-xs mb-1">AAV</div>
                  <div className="text-[#A8B4BD]">
                    {(() => {
                      const signedComps = comps.filter(p => p.hasContract && p.AAV);
                      if (signedComps.length === 0) return '—';
                      const avgAAV = signedComps.reduce((sum, p) => sum + (p.AAV || 0), 0) / signedComps.length;
                      return `$${avgAAV.toFixed(1)}M`;
                    })()}
                  </div>
                </div>
                <div className="text-center min-w-[60px]">
                  <div className="text-[#A3A8B0] text-xs mb-1">Years</div>
                  <div className="text-[#ECEDEF]">
                    {(() => {
                      const signedComps = comps.filter(p => p.hasContract && p.years);
                      if (signedComps.length === 0) return '—';
                      const avgYears = signedComps.reduce((sum, p) => sum + (p.years || 0), 0) / signedComps.length;
                      return avgYears.toFixed(1);
                    })()}
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
          Estimated Value
        </SBButton>
      </div>
    </div>
  );
}
