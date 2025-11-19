import React from 'react';
import type { Player } from '../../data/playerDatabase';
import { cn } from '../ui/utils';

interface DepthChartLadderProps {
  players: Player[];
  targetPlayerId: string;
  getCompositeScore: (player: Player) => number;
  maxPlayers?: number;
}

export function DepthChartLadder({ 
  players, 
  targetPlayerId, 
  getCompositeScore,
  maxPlayers = 5 
}: DepthChartLadderProps) {
  // Get top players (already sorted by composite score)
  const topPlayers = players.slice(0, maxPlayers);

  if (topPlayers.length === 0) {
    return (
      <div className="text-center py-8 text-[#A3A8B0] text-sm">
        No players available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topPlayers.map((player, index) => {
        const rank = index + 1;
        const score = getCompositeScore(player);
        const isTargetPlayer = player.id === targetPlayerId;
        
        return (
          <div
            key={player.id}
            className={cn(
              'flex items-center gap-4 p-4 rounded-lg border transition-all',
              isTargetPlayer
                ? 'bg-[#004B73]/20 border-[#004B73]/50 shadow-lg shadow-[#004B73]/20'
                : 'bg-[#0B0B0C] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)]'
            )}
          >
            {/* Rank Badge */}
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg flex-shrink-0',
                rank === 1
                  ? 'bg-[#60A5FA]/20 text-[#60A5FA]'
                  : rank === 2
                  ? 'bg-[#A8B4BD]/20 text-[#A8B4BD]'
                  : rank === 3
                  ? 'bg-[#D4A574]/20 text-[#D4A574]'
                  : 'bg-[rgba(255,255,255,0.05)] text-[#A3A8B0]'
              )}
            >
              {rank}
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-semibold truncate',
                    isTargetPlayer ? 'text-[#ECEDEF]' : 'text-[#ECEDEF]'
                  )}
                >
                  {player.name}
                </span>
                {isTargetPlayer && (
                  <span className="px-2 py-0.5 text-xs bg-[#004B73] text-white rounded">
                    Target
                  </span>
                )}
              </div>
              <div className="text-xs text-[#A3A8B0] mt-0.5">
                {player.team || '—'}
              </div>
            </div>

            {/* Composite Score */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-right">
                <div
                  className={cn(
                    'text-lg font-bold',
                    isTargetPlayer
                      ? 'text-[#004B73]'
                      : score >= 0.5
                      ? 'text-green-400' // Positive (+0.5 or higher)
                      : score >= 0.05
                      ? 'text-emerald-400' // Near Zero (+0.1 to +0.4) - includes scores that round to 0.1 or higher
                      : score === 0
                      ? 'text-[#A3A8B0]' // Zero (0.0)
                      : score > -0.1 && score < 0
                      ? 'text-[#A3A8B0]' // Near zero negative (not in guide, but treat as neutral)
                      : score >= -0.9 && score < -0.1
                      ? 'text-yellow-400' // Negative (-0.1 to -0.9)
                      : 'text-red-400' // Very Negative (-1.0 or lower)
                  )}
                >
                  {score > 0 ? '+' : ''}
                  {score.toFixed(1)}
                </div>
                <div className="text-xs text-[#A3A8B0]">Score</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

