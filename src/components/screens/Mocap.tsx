import React from 'react';
import { motion } from 'motion/react';
import { SBButton } from '../boras/SBButton';
import { ArrowLeft } from 'lucide-react';
import type { Player } from '../../data/playerDatabase';

interface MocapProps {
  onBack: () => void;
  player: Player | null;
  backLabel?: string;
}

export function Mocap({ onBack, player, backLabel = 'Back to Intro' }: MocapProps) {
  // Build dynamic URL with player name
  const playerName = player?.name || '';
  const encodedPlayerName = playerName.replace(/\s+/g, '+'); // Replace spaces with +
  const MOCAP_URL = `https://motion-webapp.pages.dev/?mode=player&player=${encodedPlayerName}&session=2025-08-27&lock=1`;

  return (
    <div className="h-screen bg-[#0B0B0C] flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#ECEDEF]">Motion Capture Analysis</h2>
            <p className="text-sm text-[#A3A8B0] mt-1">
              Interactive biomechanical visualization for {playerName}
            </p>
          </div>
          <SBButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
            {backLabel}
          </SBButton>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 overflow-hidden min-h-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <iframe
            src={MOCAP_URL}
            className="w-full h-full border-0"
            title="Motion Capture Visualization"
            allow="camera; microphone; geolocation; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
          />
        </motion.div>
      </div>
    </div>
  );
}

