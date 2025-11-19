import React, { useState } from 'react';
import { Save, Copy, RotateCcw, AlertCircle } from 'lucide-react';
import { SBButton } from '../boras/SBButton';
import { SBStepper } from '../boras/SBStepper';
import { OfferPreview } from '../boras/OfferPreview';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';

const steps = [
  { label: 'Years & AAV' },
  { label: 'Structure' },
  { label: 'Options/Clauses' },
  { label: 'Incentives' },
  { label: 'Review' },
];

export function DealBuilder() {
  const [activeStep, setActiveStep] = useState(0);
  const [years, setYears] = useState(7);
  const [aav, setAav] = useState(30);
  
  const mockOffer = {
    years: years,
    aav: `$${aav}.0M`,
    totalValue: `$${years * aav}M`,
    guarantee: `$${years * aav}M`,
    structure: 'Front-loaded structure',
  };

  return (
    <div className="h-screen bg-[#0B0B0C] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <h2 className="text-[#ECEDEF]">Deal Builder</h2>
          <div className="flex gap-2">
            <SBButton variant="ghost" size="md" icon={<RotateCcw size={16} />}>
              Revert
            </SBButton>
            <SBButton variant="secondary" size="md" icon={<Copy size={16} />}>
              Duplicate
            </SBButton>
            <SBButton variant="primary" size="md" icon={<Save size={16} />}>
              Save
            </SBButton>
          </div>
        </div>
      </div>
      
      {/* Stepper */}
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-[1200px] mx-auto overflow-x-auto">
          <SBStepper steps={steps} activeIndex={activeStep} />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Controls */}
            <div className="space-y-6">
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-400">
                  Adjusting contract terms will recalculate all projections
                </AlertDescription>
              </Alert>
              
              <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay space-y-6">
                <div>
                  <h3 className="text-[#ECEDEF] mb-4">Contract Length</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[#A3A8B0]">Years</Label>
                      <Input 
                        type="number" 
                        value={years}
                        onChange={(e) => setYears(Number(e.target.value))}
                        className="mt-2 bg-[#121315] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#A3A8B0]">Years: {years}</Label>
                      <Slider 
                        value={[years]} 
                        onValueChange={([val]) => setYears(val)}
                        min={1} 
                        max={15} 
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-[rgba(255,255,255,0.08)] pt-6">
                  <h3 className="text-[#ECEDEF] mb-4">Average Annual Value</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[#A3A8B0]">AAV (Millions)</Label>
                      <Input 
                        type="number" 
                        value={aav}
                        onChange={(e) => setAav(Number(e.target.value))}
                        className="mt-2 bg-[#121315] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#A3A8B0]">AAV: ${aav}M</Label>
                      <Slider 
                        value={[aav]} 
                        onValueChange={([val]) => setAav(val)}
                        min={20} 
                        max={80} 
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-[rgba(255,255,255,0.08)] pt-6">
                  <h3 className="text-[#ECEDEF] mb-4">Guarantee Percentage</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[#A3A8B0]">Guaranteed: 100%</Label>
                      <Slider 
                        defaultValue={[100]} 
                        min={0} 
                        max={100} 
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <SBButton 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                >
                  Previous
                </SBButton>
                <SBButton 
                  variant="primary" 
                  className="flex-1"
                  onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                  disabled={activeStep === steps.length - 1}
                >
                  Next
                </SBButton>
              </div>
            </div>
            
            {/* Right: Live Preview */}
            <div className="sticky top-0">
              <OfferPreview offer={mockOffer} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
