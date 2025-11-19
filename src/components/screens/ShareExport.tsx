import React from 'react';
import { FileText, Image, FileSpreadsheet, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { SBButton } from '../boras/SBButton';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export function ShareExport() {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = 'https://boras.corp/scenarios/7yr-210m-alonso';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen bg-[#0B0B0C] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-[#ECEDEF]">Share & Export</h2>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
          {/* Export Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#004B73]/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={24} className="text-[#004B73]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#ECEDEF] mb-2">PDF Offer Sheet</h3>
                  <p className="text-[#A3A8B0] text-sm mb-4">
                    Print-ready contract summary with signature area
                  </p>
                  <SBButton variant="primary" size="sm">
                    Download PDF
                  </SBButton>
                </div>
              </div>
            </div>
            
            <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#004B73]/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={24} className="text-[#004B73]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#ECEDEF] mb-2">PDF Full Deck</h3>
                  <p className="text-[#A3A8B0] text-sm mb-4">
                    Complete presentation with all analysis and charts
                  </p>
                  <SBButton variant="primary" size="sm">
                    Download PDF
                  </SBButton>
                </div>
              </div>
            </div>
            
            <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#004B73]/10 flex items-center justify-center flex-shrink-0">
                  <Image size={24} className="text-[#004B73]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#ECEDEF] mb-2">PNG Hero Image</h3>
                  <p className="text-[#A3A8B0] text-sm mb-4">
                    Social-ready contract summary graphic
                  </p>
                  <SBButton variant="primary" size="sm">
                    Download PNG
                  </SBButton>
                </div>
              </div>
            </div>
            
            <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#004B73]/10 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet size={24} className="text-[#004B73]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#ECEDEF] mb-2">CSV Data Export</h3>
                  <p className="text-[#A3A8B0] text-sm mb-4">
                    Raw data for custom analysis
                  </p>
                  <SBButton variant="primary" size="sm">
                    Download CSV
                  </SBButton>
                </div>
              </div>
            </div>
          </div>
          
          {/* Link Share */}
          <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-[#004B73]/10 flex items-center justify-center flex-shrink-0">
                <LinkIcon size={24} className="text-[#004B73]" />
              </div>
              <div className="flex-1">
                <h3 className="text-[#ECEDEF] mb-2">Share Link</h3>
                <p className="text-[#A3A8B0] text-sm">
                  Generate a secure link to share this scenario
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch className="data-[state=checked]:bg-[#004B73]" defaultChecked />
                  <Label className="text-[#A3A8B0] text-sm">Allow viewing</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch className="data-[state=checked]:bg-[#004B73]" />
                  <Label className="text-[#A3A8B0] text-sm">Allow comments</Label>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input 
                  value={shareUrl}
                  readOnly
                  className="bg-[#121315] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]"
                />
                <SBButton 
                  variant="secondary" 
                  onClick={handleCopy}
                  icon={copied ? <Check size={16} /> : <Copy size={16} />}
                >
                  {copied ? 'Copied' : 'Copy'}
                </SBButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
