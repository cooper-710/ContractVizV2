import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SBButton } from '../boras/SBButton';
import { ArrowLeft } from 'lucide-react';
import type { Player } from '../../data/playerDatabase';

interface MocapReportProps {
  onBack: () => void;
  player: Player | null;
  backLabel?: string;
}

export function MocapReport({ onBack, player, backLabel = 'Back to Intro' }: MocapReportProps) {
  const [pdfExists, setPdfExists] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);

  useEffect(() => {
    if (!player?.name) {
      setPdfExists(false);
      setPdfPath(null);
      return;
    }

    // Convert player name to PDF filename format: "FirstName_LastName.pdf"
    const pdfFileName = player.name.replace(/\s+/g, '_') + '.pdf';
    const pdfUrl = `/${pdfFileName}`;
    
    setPdfPath(pdfUrl);

    // Check if PDF exists by attempting to load it
    fetch(pdfUrl, { method: 'HEAD' })
      .then((response) => {
        setPdfExists(response.ok);
      })
      .catch(() => {
        setPdfExists(false);
      });
  }, [player]);

  const playerName = player?.name || 'Player';

  return (
    <div className="h-screen bg-[#0B0B0C] flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#ECEDEF]">Motion Capture Report</h2>
            <p className="text-sm text-[#A3A8B0] mt-1">
              Biomechanical analysis for {playerName}
            </p>
          </div>
          <SBButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
            {backLabel}
          </SBButton>
        </div>
      </div>

      {/* PDF Container */}
      <div className="flex-1 overflow-hidden min-h-0">
        {pdfExists && pdfPath ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <iframe
              src={pdfPath}
              className="w-full h-full border-0"
              title={`Motion Capture Report - ${playerName}`}
            />
          </motion.div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center px-6">
              <p className="text-[#ECEDEF] text-lg mb-2">No report available</p>
              <p className="text-[#A3A8B0] text-sm">
                No motion capture report found for {playerName}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

