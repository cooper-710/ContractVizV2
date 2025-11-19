import React from 'react';
import { RotateCcw, Clock } from 'lucide-react';
import { SBButton } from '../boras/SBButton';
import { SBChip } from '../boras/SBChip';

export function Audit() {
  const scenarios = [
    {
      id: 1,
      name: 'Scenario 1: 7yr/$210M',
      created: 'Oct 29, 2025 10:30 AM',
      modified: 'Oct 29, 2025 2:15 PM',
      author: 'Scott Boras',
      changes: [],
      isCurrent: true,
    },
    {
      id: 2,
      name: 'Scenario 2: 6yr/$180M',
      created: 'Oct 28, 2025 3:45 PM',
      modified: 'Oct 28, 2025 4:20 PM',
      author: 'Scott Boras',
      changes: [
        { type: 'years', label: '-1 year' },
        { type: 'aav', label: 'AAV same' },
      ],
    },
    {
      id: 3,
      name: 'Scenario 3: 8yr/$240M',
      created: 'Oct 27, 2025 11:00 AM',
      modified: 'Oct 27, 2025 11:30 AM',
      author: 'Scott Boras',
      changes: [
        { type: 'years', label: '+1 year' },
        { type: 'aav', label: 'AAV same' },
      ],
    },
  ];

  const timeline = [
    {
      time: 'Oct 29, 2025 2:15 PM',
      user: 'Scott Boras',
      action: 'Modified Scenario 1',
      details: 'Updated incentive structure',
    },
    {
      time: 'Oct 29, 2025 10:30 AM',
      user: 'Scott Boras',
      action: 'Created Scenario 1',
      details: '7yr/$210M front-loaded structure',
    },
    {
      time: 'Oct 28, 2025 4:20 PM',
      user: 'Scott Boras',
      action: 'Modified Scenario 2',
      details: 'Adjusted opt-out timing',
    },
    {
      time: 'Oct 28, 2025 3:45 PM',
      user: 'Scott Boras',
      action: 'Created Scenario 2',
      details: '6yr/$180M conservative option',
    },
    {
      time: 'Oct 27, 2025 11:30 AM',
      user: 'Scott Boras',
      action: 'Modified Scenario 3',
      details: 'Added club option',
    },
    {
      time: 'Oct 27, 2025 11:00 AM',
      user: 'Scott Boras',
      action: 'Created Scenario 3',
      details: '8yr/$240M extended commitment',
    },
  ];

  return (
    <div className="h-screen bg-[#0B0B0C] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-[#ECEDEF]">Audit Trail</h2>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
          {/* Scenario List */}
          <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
            <h3 className="text-[#ECEDEF] mb-4">Scenario Versions</h3>
            <div className="space-y-3">
              {scenarios.map((scenario) => (
                <div 
                  key={scenario.id}
                  className="bg-[#121315] border border-[rgba(255,255,255,0.14)] rounded-lg p-4 hover:border-[#004B73]/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[#ECEDEF]">{scenario.name}</h4>
                        {scenario.isCurrent && (
                          <SBChip variant="positive">Current</SBChip>
                        )}
                      </div>
                      <p className="text-[#A3A8B0] text-sm">
                        Created by {scenario.author} on {scenario.created}
                      </p>
                    </div>
                    {!scenario.isCurrent && (
                      <SBButton 
                        variant="secondary" 
                        size="sm"
                        icon={<RotateCcw size={14} />}
                      >
                        Restore
                      </SBButton>
                    )}
                  </div>
                  
                  {scenario.changes.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {scenario.changes.map((change, i) => (
                        <SBChip 
                          key={i} 
                          variant={change.type === 'years' ? 'neutral' : 'default'}
                        >
                          {change.label}
                        </SBChip>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Timeline */}
          <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-[#004B73]" />
              <h3 className="text-[#ECEDEF]">Activity Timeline</h3>
            </div>
            <div className="space-y-4">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-[#004B73]"></div>
                    {i < timeline.length - 1 && (
                      <div className="w-[2px] h-full bg-[rgba(255,255,255,0.14)] mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#ECEDEF]">{item.action}</span>
                    </div>
                    <p className="text-[#A3A8B0] text-sm mb-1">{item.details}</p>
                    <div className="flex items-center gap-3 text-xs text-[#A3A8B0]">
                      <span>{item.user}</span>
                      <span>•</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
