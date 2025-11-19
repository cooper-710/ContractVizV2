import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../ui/utils';

interface Step {
  label: string;
  description?: string;
}

interface SBStepperProps {
  steps: Step[];
  activeIndex: number;
  className?: string;
}

export function SBStepper({ steps, activeIndex, className }: SBStepperProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isCompleted = index < activeIndex;
        
        return (
          <React.Fragment key={index}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-[180ms]',
                  isCompleted && 'bg-[#004B73] border-[#004B73]',
                  isActive && 'bg-[#17181B] border-[#004B73]',
                  !isActive && !isCompleted && 'bg-[#17181B] border-[rgba(255,255,255,0.14)]'
                )}
              >
                {isCompleted ? (
                  <Check size={16} className="text-[#0B0B0C]" />
                ) : (
                  <span className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-[#A8B4BD]' : 'text-[#A3A8B0]'
                  )}>
                    {index + 1}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-[#ECEDEF]' : 'text-[#A3A8B0]'
                )}>
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-xs text-[#A3A8B0]">{step.description}</span>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                'h-[2px] w-12 transition-all duration-[180ms]',
                index < activeIndex ? 'bg-[#004B73]' : 'bg-[rgba(255,255,255,0.14)]'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
