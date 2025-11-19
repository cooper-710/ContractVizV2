import React from 'react';
import { Info } from 'lucide-react';
import { SBButton } from '../boras/SBButton';
import { SBChip } from '../boras/SBChip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';

interface CoverProps {
  onStart: () => void;
}

export function Cover({ onStart }: CoverProps) {
  return (
    <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl mx-auto text-center">
        {/* Boras Crest/Logo */}
        <div className="mb-8">
          <div className="w-40 h-40 mx-auto relative">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="100" cy="100" r="95" fill="#17181B" stroke="#004B73" strokeWidth="3"/>
              <circle cx="100" cy="100" r="75" fill="none" stroke="#004B73" strokeWidth="1" opacity="0.3"/>
              <text x="100" y="85" textAnchor="middle" fill="#004B73" fontSize="48" fontWeight="700">BC</text>
              <text x="100" y="130" textAnchor="middle" fill="#A8B4BD" fontSize="14" fontWeight="500" letterSpacing="2">BORAS CORP</text>
            </svg>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-[#A3A8B0] mb-12 text-xl">Contract Presentation</h1>
        
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-[#ECEDEF] mb-4">Player Name</h1>
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/Vayner.png" 
              alt="VaynerSports Logo" 
              className="object-contain h-12"
            />
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <SBChip>1B</SBChip>
            <SBChip>R/R</SBChip>
            <SBChip>30</SBChip>
            <SBChip>7th Year</SBChip>
          </div>
        </div>
        
        {/* CTA */}
        <div className="flex items-center justify-center gap-4">
          <SBButton size="lg" onClick={onStart}>
            Start New Scenario
          </SBButton>
          
          <Sheet>
            <SheetTrigger asChild>
              <button className="w-12 h-12 rounded-full bg-[#17181B] border border-[rgba(255,255,255,0.14)] hover:bg-[#1F2023] flex items-center justify-center transition-all duration-[180ms]">
                <Info size={20} className="text-[#A3A8B0]" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-96 bg-[#121315] border-l border-[rgba(255,255,255,0.14)]">
              <SheetHeader>
                <SheetTitle className="text-[#ECEDEF]">Brief</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-[#A3A8B0]">
                <p>Player description will appear here.</p>
                <p>At 30, he's in his prime with a proven track record as one of the game's most reliable run producers.</p>
                <p>This presentation outlines contract scenarios that reflect his market value and future projections.</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
