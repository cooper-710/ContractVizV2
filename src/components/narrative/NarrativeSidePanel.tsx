import React from 'react';
import { Home, BarChart2, Users, Calculator, Target, DollarSign, TrendingUp, Menu } from 'lucide-react';
import { cn } from '../ui/utils';
import type { Player } from '../../data/playerDatabase';

type NarrativeScreen = 
  | 'intro'
  | 'player-stats'
  | 'player-comparisons'
  | 'estimated-value'
  | 'team-fit'
  | 'contract-architecture'
  | 'contract-summary';

interface NarrativeSidePanelProps {
  currentScreen: NarrativeScreen;
  player: Player | null;
  comps: Player[];
  onNavigateTo: (screen: NarrativeScreen, player: Player | null, comps: Player[]) => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
}

const navigationSteps = [
  { 
    label: 'Home', 
    key: 'intro', 
    icon: Home, 
    screen: 'intro' as NarrativeScreen,
    requiresPlayer: false,
    requiresComps: false,
  },
  { 
    label: 'Player Stats', 
    key: 'player-stats', 
    icon: BarChart2, 
    screen: 'player-stats' as NarrativeScreen,
    requiresPlayer: true,
    requiresComps: false,
  },
  { 
    label: 'Comparables', 
    key: 'player-comparisons', 
    icon: Users, 
    screen: 'player-comparisons' as NarrativeScreen,
    requiresPlayer: true,
    requiresComps: false,
  },
  { 
    label: 'Estimated Value', 
    key: 'estimated-value', 
    icon: Calculator, 
    screen: 'estimated-value' as NarrativeScreen,
    requiresPlayer: true,
    requiresComps: true,
  },
  { 
    label: 'Team Fit', 
    key: 'team-fit', 
    icon: Target, 
    screen: 'team-fit' as NarrativeScreen,
    requiresPlayer: true,
    requiresComps: true,
  },
  { 
    label: 'Contract Structure', 
    key: 'contract-architecture', 
    icon: DollarSign, 
    screen: 'contract-architecture' as NarrativeScreen,
    requiresPlayer: true,
    requiresComps: true,
  },
  { 
    label: 'Summary', 
    key: 'contract-summary', 
    icon: TrendingUp, 
    screen: 'contract-summary' as NarrativeScreen,
    requiresPlayer: true,
    requiresComps: true,
  },
];

export function NarrativeSidePanel({ 
  currentScreen, 
  player, 
  comps, 
  onNavigateTo,
  sidebarOpen = true,
  onToggleSidebar,
}: NarrativeSidePanelProps) {
  const handleNavigation = (step: typeof navigationSteps[0]) => {
    // Home is always accessible
    if (step.screen === 'intro') {
      // For intro, pass current player/comps if they exist, otherwise pass null/empty
      // The App.tsx will handle setting the screen to intro
      onNavigateTo('intro', player, comps);
      return;
    }
    
    // Player Stats and Comparables only need a player
    if (step.screen === 'player-stats' || step.screen === 'player-comparisons') {
      if (!player) return;
      // For these screens, we can pass empty comps array if needed
      onNavigateTo(step.screen, player, comps || []);
      return;
    }
    
    // For other screens, check prerequisites
    if (step.requiresPlayer && !player) return;
    if (step.requiresComps && comps.length < 1) return;
    
    if (!player) return; // Safety check
    
    onNavigateTo(step.screen, player, comps);
  };

  const isStepClickable = (step: typeof navigationSteps[0], index: number) => {
    // Home is always clickable
    if (step.screen === 'intro') {
      return true;
    }
    
    // Follow the same logic as the intro screen cards
    // Player Stats and Comparables are clickable when just a player is selected
    // Estimated Value, Team Fit, Contract Structure, Summary require both player and comps
    
    // Adjust index for navigation steps (skip Home which is index 0)
    // Player Stats = 1, Comparables = 2, Estimated Value = 3, Team Fit = 4, Contract Structure = 5, Summary = 6
    const stepIndex = index - 1;
    
    // Calculate current step based on what's selected
    // currentStep = 2 if player and comps selected, 1 if only player, 0 if nothing
    const currentStep = player && comps.length >= 1 ? 2 : player ? 1 : 0;
    
    // canBegin means both player and comps are selected (needed for Estimated Value and beyond)
    const canBegin = player !== null && comps.length >= 1;
    
    // Player Stats (stepIndex 0) and Comparables (stepIndex 1) are clickable when just player is selected
    if (stepIndex <= 1) {
      return player !== null; // Just need player
    }
    
    // For Estimated Value (stepIndex 2) and beyond, need both player and comps
    // All buttons from Estimated Value onwards are clickable when both player and comps are selected
    // This matches the logic of buttons 2-5: if they are shown (requires player and comps), they are clickable
    if (canBegin) {
      return true; // All buttons that require player and comps are clickable when both are selected
    }
    
    return false;
  };

  return (
    <aside
      className={cn(
        'border-r border-[rgba(255,255,255,0.14)] bg-[#121315] transition-all duration-300 flex flex-col overflow-hidden',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.14)] p-4 flex items-center justify-between">
        {sidebarOpen ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[#A8B4BD] font-semibold">Contract Viz</span>
            </div>
            {onToggleSidebar && (
              <button
                onClick={() => onToggleSidebar(false)}
                className="p-1 hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors"
              >
                <Menu size={18} className="text-[#A3A8B0]" />
              </button>
            )}
          </>
        ) : (
          onToggleSidebar && (
            <button
              onClick={() => onToggleSidebar(true)}
              className="p-1 hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors mx-auto"
            >
              <Menu size={18} className="text-[#A3A8B0]" />
            </button>
          )
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {navigationSteps.map((step, index) => {
            // Hide bottom 6 items (Player Stats through Summary) unless both player and comps are selected
            const shouldShow = step.screen === 'intro' || (player !== null && comps.length >= 1);
            
            if (!shouldShow) {
              return null;
            }
            
            const Icon = step.icon;
            const isActive = currentScreen === step.screen;
            const isClickable = isStepClickable(step, index);
            const isDisabled = !isClickable;
            
            return (
              <button
                key={step.key}
                onClick={() => isClickable && handleNavigation(step)}
                disabled={isDisabled}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-[180ms]',
                  isActive
                    ? 'bg-[#004B73] text-white'
                    : isClickable
                    ? 'text-[#A3A8B0] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#ECEDEF]'
                    : 'text-[#A3A8B0] opacity-50 cursor-not-allowed'
                )}
              >
                <Icon size={18} />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{step.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer - Only show on non-intro screens */}
      {sidebarOpen && player && currentScreen !== 'intro' && (
        <div className="border-t border-[rgba(255,255,255,0.14)] p-4">
          <div className="text-xs text-[#A3A8B0]">
            <p className="mb-1 font-medium text-[#ECEDEF]">{player.name}</p>
            <p>{comps.length} {comps.length === 1 ? 'comparable' : 'comparables'}</p>
          </div>
        </div>
      )}
    </aside>
  );
}

