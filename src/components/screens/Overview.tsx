import React, { useState } from 'react';
import { Share2, Download, Edit3, Loader2, AlertCircle } from 'lucide-react';
import { SBButton } from '../boras/SBButton';
import { SBKpi } from '../boras/SBKpi';
import { Toolbar } from '../boras/Toolbar';
import { ChartPlaceholder } from '../boras/ChartPlaceholder';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';

type ViewState = 'loading' | 'empty' | 'error' | 'data';

interface OverviewProps {
  onEditBuilder: () => void;
}

export function Overview({ onEditBuilder }: OverviewProps) {
  const [viewState, setViewState] = useState<ViewState>('data');
  const [drawerOpen, setDrawerOpen] = useState(true);
  
  if (viewState === 'loading') {
    return (
      <div className="h-screen bg-[#0B0B0C]">
        <Toolbar
          primaryLeft={
            <Skeleton className="h-10 w-48 bg-[#17181B]" />
          }
          secondaryRight={
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 bg-[#17181B]" />
              <Skeleton className="h-10 w-24 bg-[#17181B]" />
            </div>
          }
        />
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-[#17181B]" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-64 bg-[#17181B]" />
            <Skeleton className="h-64 bg-[#17181B]" />
          </div>
        </div>
      </div>
    );
  }
  
  if (viewState === 'empty') {
    return (
      <div className="h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h3 className="text-[#ECEDEF] mb-2">No Scenario Created</h3>
          <p className="text-[#A3A8B0] mb-6">Create your first scenario to see the overview</p>
          <SBButton onClick={() => setViewState('data')}>Create Scenario</SBButton>
        </div>
      </div>
    );
  }
  
  if (viewState === 'error') {
    return (
      <div className="h-screen bg-[#0B0B0C]">
        <Toolbar
          primaryLeft={<h2 className="text-[#ECEDEF]">Overview</h2>}
        />
        <div className="p-6 max-w-[1200px] mx-auto">
          <Alert className="bg-[#DC2626]/10 border-[#DC2626]/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">
              Failed to load overview data. Error ID: #ERR-2024-1029
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <SBButton variant="secondary" onClick={() => setViewState('data')}>
              Retry
            </SBButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0B0B0C] flex flex-col overflow-hidden">
      <Toolbar
        primaryLeft={
          <Select defaultValue="scenario-1">
            <SelectTrigger className="w-64 bg-[#17181B] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]">
              <SelectValue placeholder="Select scenario" />
            </SelectTrigger>
            <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
              <SelectItem value="scenario-1">Scenario 1: 7yr/$210M</SelectItem>
              <SelectItem value="scenario-2">Scenario 2: 6yr/$180M</SelectItem>
              <SelectItem value="scenario-3">Scenario 3: 8yr/$240M</SelectItem>
            </SelectContent>
          </Select>
        }
        secondaryRight={
          <>
            <SBButton variant="secondary" size="md" icon={<Share2 size={16} />}>
              Share
            </SBButton>
            <SBButton variant="secondary" size="md" icon={<Download size={16} />}>
              Export
            </SBButton>
          </>
        }
      />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-3 gap-4">
            <SBKpi 
              label="Average Annual Value" 
              value="$30.0M" 
              delta="+12% vs market"
              deltaType="positive"
              data-id="offer.aav"
            />
            <SBKpi 
              label="Total Value" 
              value="$210M" 
              delta="7 years"
              deltaType="neutral"
              data-id="offer.totalValue"
            />
            <SBKpi 
              label="Guaranteed" 
              value="$210M" 
              delta="100%"
              deltaType="positive"
              data-id="offer.guarantee"
            />
            <SBKpi 
              label="Contract Years" 
              value="7" 
              data-id="offer.years"
            />
            <SBKpi 
              label="NPV at 6%" 
              value="$184M" 
              data-id="offer.npvAt"
            />
            <SBKpi 
              label="Market Range AAV" 
              value="$25M - $32M" 
              data-id="valuation.rangeAAV"
            />
          </div>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-4">
            <ChartPlaceholder 
              title="Value Band" 
              type="band" 
              height={280}
              data-id="valuation.rangeAAV"
            />
            <ChartPlaceholder 
              title="Cash Flow Over Time" 
              type="cashflow" 
              height={280}
              data-id="offer.yearly"
            />
          </div>
          
          {/* Mini Comps Table */}
          <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay" data-id="valuation.comps">
            <h4 className="text-[#ECEDEF] mb-4">Comparable Contracts</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)] text-[#A3A8B0] text-sm">
                    <th className="text-left py-2">Player</th>
                    <th className="text-right py-2">Year</th>
                    <th className="text-right py-2">Years</th>
                    <th className="text-right py-2">AAV</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="text-[#ECEDEF]">
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    <td className="py-3">Freddie Freeman</td>
                    <td className="text-right">2022</td>
                    <td className="text-right">6</td>
                    <td className="text-right text-[#A8B4BD]">$27.0M</td>
                    <td className="text-right">$162M</td>
                  </tr>
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    <td className="py-3">Matt Olson</td>
                    <td className="text-right">2022</td>
                    <td className="text-right">8</td>
                    <td className="text-right text-[#A8B4BD]">$21.0M</td>
                    <td className="text-right">$168M</td>
                  </tr>
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    <td className="py-3">Paul Goldschmidt</td>
                    <td className="text-right">2019</td>
                    <td className="text-right">5</td>
                    <td className="text-right text-[#A8B4BD]">$26.0M</td>
                    <td className="text-right">$130M</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Primary Action */}
          <div className="flex justify-center pt-4">
            <SBButton 
              size="lg" 
              variant="primary"
              icon={<Edit3 size={18} />}
              onClick={onEditBuilder}
            >
              Edit in Deal Builder
            </SBButton>
          </div>
        </div>
      </div>
      
      {/* Summary Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-96 bg-[#121315] border-l border-[rgba(255,255,255,0.14)]">
          <SheetHeader>
            <SheetTitle className="text-[#ECEDEF]">Summary</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4 text-[#A3A8B0] text-sm">
            <div>
              <h4 className="text-[#ECEDEF] mb-2">Contract Structure</h4>
              <p>7-year, $210M fully guaranteed contract with front-loaded salaries to maximize early value.</p>
            </div>
            <div>
              <h4 className="text-[#ECEDEF] mb-2">Market Position</h4>
              <p>AAV positions Alonso as the highest-paid first baseman in baseball, reflecting elite power production.</p>
            </div>
            <div>
              <h4 className="text-[#ECEDEF] mb-2">Key Benefits</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Full no-trade clause</li>
                <li>Opt-out after year 4</li>
                <li>Award bonuses included</li>
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
