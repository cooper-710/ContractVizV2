import React, { useState, useEffect } from 'react';
import { Menu, Home, BarChart3, Hammer, TrendingUp, Users, Activity, FileText, Share2, History, BookOpen } from 'lucide-react';
import { ContractProvider } from './components/narrative/ContractContext';
import { NarrativeIntro } from './components/screens/NarrativeIntro';
import type { Player } from './data/playerDatabase';
import { getPlayerById, loadPlayersFromCsv } from './data/playerDatabase';
import { PlayerStats } from './components/screens/PlayerStats';
import { PlayerComparisons } from './components/screens/PlayerComparisons';
import { EstimatedValue } from './components/screens/EstimatedValue';
import { ContractArchitecture } from './components/screens/ContractArchitecture';
import { ContractSummary } from './components/screens/ContractSummary';
import { Overview } from './components/screens/Overview';
import { DealBuilder } from './components/screens/DealBuilder';
import { ValuationComps } from './components/screens/ValuationComps';
import { TeamFit } from './components/screens/TeamFit';
import { Projections } from './components/screens/Projections';
import { OfferSheet } from './components/screens/OfferSheet';
import { ShareExport } from './components/screens/ShareExport';
import { Audit } from './components/screens/Audit';
import { Mocap } from './components/screens/Mocap';
import { MocapReport } from './components/screens/MocapReport';
import { NarrativeSidePanel } from './components/narrative/NarrativeSidePanel';
import { cn } from './components/ui/utils';

type Mode = 'narrative' | 'exploration';
type Screen = 
  | 'intro'
  | 'player-stats'
  | 'player-comparisons'
  | 'estimated-value'
  | 'team-fit'
  | 'contract-architecture'
  | 'contract-summary'
  | 'mocap'
  | 'mocap-report'
  | 'overview' 
  | 'builder' 
  | 'valuation' 
  | 'teamfit' 
  | 'projections' 
  | 'offer' 
  | 'share' 
  | 'audit';

const APP_STATE_KEY = 'borasApp_state';

function AppContent() {
  // Load initial state from localStorage
  const getInitialState = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(APP_STATE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            const currentScreen = parsed.currentScreen || 'intro';
            // Don't load player/comps if we're starting on intro screen (fresh start)
            const shouldLoadSelections = currentScreen !== 'intro';
            return {
              mode: parsed.mode || 'narrative',
              currentScreen,
              sidebarOpen: parsed.sidebarOpen !== undefined ? parsed.sidebarOpen : true,
              narrativeSidebarOpen: parsed.narrativeSidebarOpen !== undefined ? parsed.narrativeSidebarOpen : true,
              selectedPlayerId: shouldLoadSelections ? (parsed.selectedPlayerId || null) : null,
              selectedCompIds: shouldLoadSelections ? (parsed.selectedCompIds || []) : [],
            };
          }
        }
      } catch (error) {
        console.warn('Failed to load app state from localStorage:', error);
      }
    }
    return {
      mode: 'narrative' as Mode,
      currentScreen: 'intro' as Screen,
      sidebarOpen: true,
      narrativeSidebarOpen: true,
      selectedPlayerId: null as string | null,
      selectedCompIds: [] as string[],
    };
  };

  const initialState = getInitialState();
  const [mode, setMode] = useState<Mode>(initialState.mode);
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialState.currentScreen);
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(initialState.sidebarOpen);
  const [narrativeSidebarOpen, setNarrativeSidebarOpen] = useState(initialState.narrativeSidebarOpen);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(initialState.selectedPlayerId);
  const [selectedCompIds, setSelectedCompIds] = useState<string[]>(initialState.selectedCompIds);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedComps, setSelectedComps] = useState<Player[]>([]);
  const [playersLoaded, setPlayersLoaded] = useState(false);

  // Load CSV data on mount
  useEffect(() => {
    loadPlayersFromCsv()
      .then(() => {
        setPlayersLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load players:', err);
        setPlayersLoaded(true);
      });
  }, []);

  // Load player objects from IDs when players are loaded
  useEffect(() => {
    if (playersLoaded && selectedPlayerId) {
      const player = getPlayerById(selectedPlayerId);
      setSelectedPlayer(player || null);
    }
    
    if (playersLoaded && selectedCompIds.length > 0) {
      const comps = selectedCompIds
        .map(id => getPlayerById(id))
        .filter((p): p is Player => p !== undefined);
      setSelectedComps(comps);
    }
  }, [playersLoaded, selectedPlayerId, selectedCompIds]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stateToSave = {
          mode,
          currentScreen,
          sidebarOpen,
          narrativeSidebarOpen,
          selectedPlayerId,
          selectedCompIds,
        };
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Failed to save app state to localStorage:', error);
      }
    }
  }, [mode, currentScreen, sidebarOpen, narrativeSidebarOpen, selectedPlayerId, selectedCompIds]);

  const navigation = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'builder', label: 'Deal Builder', icon: Hammer },
    { id: 'valuation', label: 'Valuation & Comps', icon: TrendingUp },
    { id: 'teamfit', label: 'Team Fit', icon: Users },
    { id: 'projections', label: 'Projections', icon: Activity },
    { id: 'offer', label: 'Offer Sheet', icon: FileText },
    { id: 'share', label: 'Share & Export', icon: Share2 },
    { id: 'audit', label: 'Audit', icon: History },
  ];

  // Show loading screen while players are being loaded (only if we need them)
  const needsPlayerData = !playersLoaded && (selectedPlayerId || selectedCompIds.length > 0);
  if (needsPlayerData) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#004B73] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#A3A8B0]">Loading player data...</p>
        </div>
      </div>
    );
  }

  // Narrative Mode Screens
  if (mode === 'narrative') {
    // Screens that should have the side panel (including intro)
    const screensWithSidePanel = ['intro', 'player-stats', 'player-comparisons', 'estimated-value', 'team-fit', 'contract-architecture', 'contract-summary'];
    
    if (screensWithSidePanel.includes(currentScreen)) {
      const renderScreenContent = () => {
        if (currentScreen === 'intro') {
          return (
            <NarrativeIntro
              initialSelectedPlayer={selectedPlayer}
              initialSelectedComps={selectedComps}
              onBegin={(player, comps) => {
                setSelectedPlayer(player);
                setSelectedComps(comps);
                setSelectedPlayerId(player?.id || null);
                setSelectedCompIds(comps.map(c => c.id));
                setCurrentScreen('player-stats');
              }}
              onNavigateTo={(screen, player, comps) => {
                setPreviousScreen(currentScreen);
                setSelectedPlayer(player);
                setSelectedComps(comps);
                setSelectedPlayerId(player?.id || null);
                setSelectedCompIds(comps.map(c => c.id));
                setCurrentScreen(screen);
              }}
              onSelectionChange={(player, comps) => {
                // Sync selection state in real-time so sidebar can see it
                setSelectedPlayer(player);
                setSelectedComps(comps);
                if (player) {
                  setSelectedPlayerId(player.id || null);
                } else {
                  setSelectedPlayerId(null);
                }
                setSelectedCompIds(comps.map(c => c.id));
              }}
            />
          );
        }
        
        if (currentScreen === 'player-stats') {
          return <PlayerStats 
            player={selectedPlayer}
            onContinue={() => setCurrentScreen('player-comparisons')} 
            onBack={() => setCurrentScreen('intro')}
          />;
        }
        
        if (currentScreen === 'player-comparisons') {
          return <PlayerComparisons 
            player={selectedPlayer}
            comps={selectedComps}
            onContinue={() => setCurrentScreen('estimated-value')}
            onBack={() => setCurrentScreen('player-stats')}
          />;
        }
        
        if (currentScreen === 'estimated-value') {
          return <EstimatedValue 
            player={selectedPlayer}
            comps={selectedComps}
            onContinue={() => setCurrentScreen('team-fit')}
            onBack={() => setCurrentScreen('player-comparisons')}
          />;
        }
        
        if (currentScreen === 'team-fit') {
          return <TeamFit 
            player={selectedPlayer}
            comps={selectedComps}
            onContinue={() => setCurrentScreen('contract-architecture')}
            onBack={() => setCurrentScreen('estimated-value')}
          />;
        }
        
        if (currentScreen === 'contract-architecture') {
          return <ContractArchitecture 
            onContinue={() => setCurrentScreen('contract-summary')}
            onBack={() => setCurrentScreen('team-fit')}
          />;
        }
        
        if (currentScreen === 'contract-summary') {
          return <ContractSummary 
            onExploreData={() => {
              setMode('exploration');
              setCurrentScreen('overview');
            }}
            onStartOver={() => {
              // Clear all saved state
              setSelectedPlayer(null);
              setSelectedComps([]);
              setSelectedPlayerId(null);
              setSelectedCompIds([]);
              setCurrentScreen('intro');
              if (typeof window !== 'undefined') {
                localStorage.removeItem(APP_STATE_KEY);
              }
            }}
            onBack={() => setCurrentScreen('contract-architecture')}
            onNavigateTo={(screen, player, comps) => {
              setPreviousScreen(currentScreen);
              setSelectedPlayer(player);
              setSelectedComps(comps);
              setSelectedPlayerId(player?.id || null);
              setSelectedCompIds(comps.map(c => c.id));
              setCurrentScreen(screen as any);
            }}
            player={selectedPlayer}
            comps={selectedComps}
          />;
        }
        
        return null;
      };

      return (
        <div className="flex h-screen w-full overflow-hidden bg-[#0B0B0C]">
          <NarrativeSidePanel
            currentScreen={currentScreen as any}
            player={selectedPlayer}
            comps={selectedComps}
            onNavigateTo={(screen, player, comps) => {
              setPreviousScreen(currentScreen);
              // For intro screen, preserve current selections
              if (screen === 'intro') {
                setCurrentScreen('intro');
                // Keep existing selections - don't clear them
                return;
              }
              // For other screens, require player
              if (player) {
                setSelectedPlayer(player);
                setSelectedComps(comps);
                setSelectedPlayerId(player.id || null);
                setSelectedCompIds(comps.map(c => c.id));
                setCurrentScreen(screen as any);
              }
            }}
            sidebarOpen={narrativeSidebarOpen}
            onToggleSidebar={setNarrativeSidebarOpen}
          />
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="h-full overflow-auto">
              {renderScreenContent()}
            </div>
          </div>
        </div>
      );
    }

    if (currentScreen === 'mocap') {
      const backToScreen = previousScreen === 'contract-summary' ? 'contract-summary' : 'intro';
      const backLabel = previousScreen === 'contract-summary' ? 'Back to Summary' : 'Back to Intro';
      return <Mocap onBack={() => setCurrentScreen(backToScreen)} player={selectedPlayer} backLabel={backLabel} />;
    }

    if (currentScreen === 'mocap-report') {
      const backToScreen = previousScreen === 'contract-summary' ? 'contract-summary' : 'intro';
      const backLabel = previousScreen === 'contract-summary' ? 'Back to Summary' : 'Back to Intro';
      return <MocapReport onBack={() => setCurrentScreen(backToScreen)} player={selectedPlayer} backLabel={backLabel} />;
    }
  }

  // Exploration Mode - Interactive data exploration interface
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0B0B0C]">
      {/* Sidebar */}
      <aside
        className={cn(
          'border-r border-[rgba(255,255,255,0.14)] bg-[#121315] transition-all duration-300 flex flex-col overflow-hidden',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo/Header */}
        <div className="border-b border-[rgba(255,255,255,0.14)] p-4 flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#004B73] rounded-md flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">B</span>
                </div>
                <span className="text-[#A8B4BD] font-semibold">BORAS CORP</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors"
              >
                <Menu size={18} className="text-[#A3A8B0]" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors mx-auto"
            >
              <Menu size={18} className="text-[#A3A8B0]" />
            </button>
          )}
        </div>

        {/* Back to Narrative Button */}
        <div className="p-3 border-b border-[rgba(255,255,255,0.14)]">
          <button
            onClick={() => {
              setMode('narrative');
              setCurrentScreen('intro');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#004B73]/10 text-[#A8B4BD] hover:bg-[#004B73]/20 transition-all"
          >
            <BookOpen size={18} />
            {sidebarOpen && <span className="text-sm font-medium">Back to Narrative</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentScreen(item.id as Screen)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-[180ms]',
                    isActive
                      ? 'bg-[#004B73] text-white'
                      : 'text-[#A3A8B0] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#ECEDEF]'
                  )}
                >
                  <Icon size={18} />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="border-t border-[rgba(255,255,255,0.14)] p-4">
            <div className="text-xs text-[#A3A8B0]">
              <p className="mb-1">Pete Alonso Contract</p>
              <p>Data Exploration</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentScreen === 'overview' && <Overview onEditBuilder={() => setCurrentScreen('builder')} />}
        {currentScreen === 'builder' && <DealBuilder />}
        {currentScreen === 'valuation' && <ValuationComps />}
        {currentScreen === 'teamfit' && <TeamFit />}
        {currentScreen === 'projections' && <Projections />}
        {currentScreen === 'offer' && <OfferSheet />}
        {currentScreen === 'share' && <ShareExport />}
        {currentScreen === 'audit' && <Audit />}
        {currentScreen === 'mocap' && <Mocap onBack={() => setCurrentScreen('intro')} player={selectedPlayer} backLabel="Back to Intro" />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ContractProvider>
      <AppContent />
    </ContractProvider>
  );
}
