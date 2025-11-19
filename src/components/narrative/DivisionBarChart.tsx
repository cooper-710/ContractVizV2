import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip, ReferenceLine } from 'recharts';
import type { Player, PlayerStats } from '../../data/playerDatabase';
import { getStatsForPeriod, STAT_LABELS } from '../../data/playerDatabase';
import type { StatPeriod } from '../../data/playerDatabase';

interface DivisionBarChartProps {
  players: Player[];
  selectedStat: string;
  timePeriod: StatPeriod;
  targetPlayerId: string;
  formatStatValue: (statKey: string, value: number) => string;
}

export function DivisionBarChart({
  players,
  selectedStat,
  timePeriod,
  targetPlayerId,
  formatStatValue,
}: DivisionBarChartProps) {
  // Get stat values for all players
  const playerData = players.map(player => {
    const stats = getStatsForPeriod(player, timePeriod);
    const value = stats[selectedStat as keyof PlayerStats] as number;
    const isTarget = player.id === targetPlayerId;
    
    return {
      name: player.name,
      value: value || 0,
      isTarget,
      playerId: player.id,
    };
  });

  // Sort by value (descending)
  const sortedData = [...playerData].sort((a, b) => b.value - a.value);

  // Determine if stat needs special formatting (needed for domain calculation)
  // Check both the stat key and the label for percentage indicators
  const statLabel = STAT_LABELS[selectedStat as keyof typeof STAT_LABELS] || '';
  const isPercent = selectedStat.includes('pct') || selectedStat.includes('Pct') || selectedStat.includes('%') || statLabel.includes('%');
  const isThreeDecimal = selectedStat === 'xwOBA' || selectedStat === 'xSLG';

  // Smart Y-axis domain calculation based on stat type
  const calculateYDomain = (): [number, number] => {
    const maxValue = Math.max(...sortedData.map(d => d.value), 1);
    const minValue = Math.min(...sortedData.map(d => d.value), 0);
    const range = maxValue - minValue;

    if (range === 0) {
      const padding = maxValue > 0 ? maxValue * 0.2 : 1;
      return [Math.max(0, maxValue - padding), maxValue + padding];
    }

    let niceMax: number;
    let niceMin: number;

    if (isPercent) {
      // For percentages, determine if stored as 0-1 or 0-100
      const isDecimalFormat = maxValue <= 1 && maxValue > 0 && maxValue < 1;
      const actualMax = isDecimalFormat ? maxValue * 100 : maxValue;
      const actualMin = isDecimalFormat ? minValue * 100 : minValue;
      
      // Calculate nice intervals for percentages
      let interval: number;
      if (actualMax <= 5) {
        interval = 1;
        niceMax = Math.ceil(actualMax / interval) * interval;
      } else if (actualMax <= 10) {
        interval = 2;
        niceMax = Math.ceil(actualMax / interval) * interval;
      } else if (actualMax <= 25) {
        interval = 5;
        niceMax = Math.ceil(actualMax / interval) * interval;
      } else if (actualMax <= 50) {
        interval = 10;
        niceMax = Math.ceil(actualMax / interval) * interval;
      } else {
        interval = 20;
        niceMax = Math.ceil(actualMax / interval) * interval;
      }
      
      // For min, round down to nearest interval below the actual minimum
      // Don't force 0 if all values are above 0
      if (actualMin > 0) {
        niceMin = Math.floor(actualMin / interval) * interval;
        // If rounded min is above actual min, go down one interval
        if (niceMin >= actualMin) {
          niceMin = niceMin - interval;
        }
        // Don't go below 0 for percentages (can't be negative)
        niceMin = Math.max(0, niceMin);
      } else {
        // If actual min is 0 or negative, start at 0
        niceMin = 0;
      }
      
      // Convert back to 0-1 range if needed
      if (isDecimalFormat) {
        niceMax = niceMax / 100;
        niceMin = niceMin / 100;
      }
    } else if (isThreeDecimal) {
      // For three-decimal stats (xwOBA, xSLG), round to nice intervals
      let interval: number;
      if (maxValue <= 0.1) {
        interval = 0.01;
        niceMax = Math.ceil(maxValue / interval) * interval;
      } else if (maxValue <= 0.3) {
        interval = 0.05;
        niceMax = Math.ceil(maxValue / interval) * interval;
      } else if (maxValue <= 0.5) {
        interval = 0.1;
        niceMax = Math.ceil(maxValue / interval) * interval;
      } else {
        interval = 0.15;
        niceMax = Math.ceil(maxValue / interval) * interval;
      }
      niceMax = Math.min(niceMax, 1.0); // Cap at 1.0 for rates
      
      // For min, round down to nearest interval
      if (minValue > 0) {
        niceMin = Math.floor(minValue / interval) * interval;
        if (niceMin < minValue * 0.9) {
          niceMin = Math.max(0, minValue - interval);
        }
      } else {
        niceMin = 0;
      }
    } else {
      // For whole numbers (wRC+, HR, RBI, WAR, etc.), round to nice intervals
      // WAR can be negative, so handle that case specially
      const hasNegativeValues = minValue < 0;
      
      let interval: number;
      const absMax = Math.max(Math.abs(maxValue), Math.abs(minValue));
      
      if (absMax <= 10) {
        interval = 1;
      } else if (absMax <= 50) {
        interval = 5;
      } else if (absMax <= 100) {
        interval = 10;
      } else if (absMax <= 200) {
        interval = 20;
      } else {
        interval = 50;
      }
      
      // Calculate nice max
      if (hasNegativeValues) {
        // When there are negatives, ensure we have good spacing around 0
        niceMax = Math.ceil(maxValue / interval) * interval;
        // If max is very close to 0, ensure we have at least one positive tick
        if (niceMax <= 0) {
          niceMax = interval;
        }
        // Round down min to interval
        niceMin = Math.floor(minValue / interval) * interval;
        // Ensure we have space for the negative values
        if (niceMin >= minValue) {
          niceMin = niceMin - interval;
        }
        // Add padding for better visualization
        niceMax = niceMax + interval * 0.2;
        niceMin = niceMin - interval * 0.2;
      } else {
        // Positive values only - original logic
        niceMax = Math.ceil(maxValue / interval) * interval;
        if (minValue > 0 && minValue < niceMax * 0.1) {
          niceMin = 0;
        } else if (minValue > 0) {
          niceMin = Math.floor(minValue / interval) * interval;
          if (niceMin < minValue * 0.9) {
            niceMin = Math.max(0, minValue - interval);
          }
        } else {
          niceMin = 0;
        }
      }
    }

    return [niceMin, niceMax];
  };

  const yDomain = calculateYDomain();
  const hasNegativeValues = Math.min(...sortedData.map(d => d.value)) < 0;

  // Format Y-axis tick
  const formatYTick = (value: number): string => {
    if (isPercent) {
      const num = value <= 1 ? value * 100 : value;
      return `${Math.round(num)}%`;
    }
    if (isThreeDecimal) {
      const fixed = value.toFixed(3);
      return fixed.replace(/^0/, '');
    }
    return Math.round(value).toString();
  };

  // Get bar color based on whether it's the target player
  const getBarColor = (isTarget: boolean): string => {
    return isTarget ? '#004B73' : '#60A5FA';
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = formatStatValue(selectedStat, data.value);
      return (
        <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-lg p-3 shadow-lg">
          <p className="text-[#ECEDEF] text-sm font-semibold mb-1">{data.name}</p>
          <p className="text-[#A8B4BD] text-sm">{value}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate dynamic width based on number of players
  // Minimum 50px per bar to ensure readability
  const minBarWidth = 50;
  const calculatedWidth = Math.max(800, sortedData.length * minBarWidth);
  
  // Adjust bar width and spacing based on number of players
  // Smaller bars for more players to fit better
  const barSize = sortedData.length > 50 ? 15 : sortedData.length > 30 ? 20 : sortedData.length > 20 ? 25 : 30;
  
  // Adjust bottom margin for better label visibility with many players
  const bottomMargin = sortedData.length > 30 ? 100 : sortedData.length > 20 ? 80 : 60;

  return (
    <div className="w-full">
      <div className="overflow-x-auto -mx-8 px-8">
        <div style={{ minWidth: '100%', width: `${calculatedWidth}px` }}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={sortedData} 
              margin={{ top: 10, right: 10, left: 50, bottom: bottomMargin }}
              barSize={barSize}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                stroke="#A3A8B0"
                style={{ fontSize: '10px' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={bottomMargin - 20}
                tick={{ fill: '#A3A8B0' }}
              />
              <YAxis
                stroke="#A3A8B0"
                style={{ fontSize: '12px' }}
                domain={yDomain}
                allowDecimals
                tickFormatter={formatYTick}
                tickCount={6}
                width={45}
                tick={{ fill: '#A3A8B0' }}
              />
              {hasNegativeValues && (
                <ReferenceLine 
                  y={0} 
                  stroke="#A3A8B0" 
                  strokeWidth={1.5}
                  strokeDasharray="0"
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.isTarget)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

