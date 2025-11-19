import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { InteractiveChart } from '../narrative/InteractiveChart';
import { SBButton } from '../boras/SBButton';
import { SBKpi } from '../boras/SBKpi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Player } from '../../data/playerDatabase';
import { getPlayerStats } from '../../services/playerDataService';
import { isPitcher } from '../../data/playerDatabase';

interface PlayerStatsProps {
  player: Player | null;
  onContinue: () => void;
  onBack?: () => void;
}

export function PlayerStats({ player, onContinue, onBack }: PlayerStatsProps) {
  // If no player selected, show error state
  if (!player) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A3A8B0] mb-4">Please select a player from the intro screen.</p>
          <SBButton onClick={onBack}>Go Back</SBButton>
        </div>
      </div>
    );
  }
  const [profile, setProfile] = React.useState<any | null>(null);
  const [year, setYear] = React.useState<string>('2025');
  // Determine if player is a pitcher - check profile data first (most reliable indicator)
  const isPitcherPlayer = React.useMemo(() => {
    // PRIMARY: Check profile data structure - this is the most reliable indicator
    // because it reflects what data was actually loaded
    if (profile && profile.careerStats && profile.careerStats.length > 0) {
      // Check any season in careerStats to see what type of stats are present
      const anySeason = profile.careerStats.find((s: any) => s.year) || profile.careerStats[0];
      
      // Pitcher profiles have era, fip, xfip, kper9, whip, ip fields
      // Hitter profiles have avg, hr, rbi, xwoba, xslg, wrcPlus fields
      const hasPitcherFields = 'era' in anySeason || 'fip' in anySeason || 'xfip' in anySeason || 
                               'kper9' in anySeason || 'whip' in anySeason || 'ip' in anySeason;
      const hasHitterFields = 'avg' in anySeason || 'hr' in anySeason || 'rbi' in anySeason || 
                             'xwoba' in anySeason || 'xslg' in anySeason || 'wrcPlus' in anySeason;
      
      // If it has pitcher fields, it's definitely a pitcher
      if (hasPitcherFields) {
        return true;
      }
      // If it has hitter fields and no pitcher fields, it's a hitter
      if (hasHitterFields && !hasPitcherFields) {
        return false;
      }
    }
    
    // SECONDARY: Check profile position field
    if (profile && profile.position) {
      const profilePos = profile.position.toString().toUpperCase().trim();
      if (profilePos === 'P' || profilePos === 'SP' || profilePos === 'RP' || profilePos.startsWith('P')) {
        return true;
      }
    }
    
    // TERTIARY: Fall back to player object check
    if (player) {
      return isPitcher(player);
    }
    
    return false;
  }, [player, profile]);

  React.useEffect(() => {
    let active = true;
    getPlayerStats(player.id)
      .then((p) => {
        if (!active) return;
        setProfile(p);
        // default to 2025 if present else latest year
        const years = p.careerStats.map((s: any) => s.year);
        if (years.includes('2025')) setYear('2025');
        else setYear(years[years.length - 1]);
      })
      .catch(() => {})
  ;
    return () => { active = false; };
  }, [player.id]);

  return (
    <div className="min-h-screen bg-[#0B0B0C] overflow-auto">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-[#ECEDEF]">{profile ? profile.name : ''} • {year} Performance</h2>
          </div>
          <div className="flex gap-3">
            {onBack && (
              <SBButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
                Back
              </SBButton>
            )}
            <SBButton onClick={onContinue} icon={<ArrowRight size={18} />} iconPosition="right">
              Market Comparables
            </SBButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {isPitcherPlayer ? (
          <>
            {/* Pitcher Traditional Stats */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#ECEDEF]">Traditional Stats ({year})</h3>
                {profile && (
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-[200px] bg-[#17181B] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                      {profile.careerStats.map((s: any) => (
                        <SelectItem
                          key={s.year}
                          value={s.year}
                          className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF]"
                        >
                          {s.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4">
                {(() => {
                  const season = profile?.careerStats?.find((s: any) => s.year === year);
                  const era = season?.era ?? 0;
                  const whip = season?.whip ?? 0;
                  const ip = season?.ip ?? 0;
                  const wins = season?.wins ?? 0;
                  return (
                    <>
                      <SBKpi label="ERA" value={Number(era).toFixed(2)} className="bg-[#17181B]" />
                      <SBKpi label="WHIP" value={Number(whip).toFixed(2)} className="bg-[#17181B]" />
                      <SBKpi label="IP" value={Number(ip).toFixed(1)} className="bg-[#17181B]" />
                      <SBKpi label="Wins" value={Number(wins).toString()} className="bg-[#17181B]" />
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Pitcher Advanced Metrics */}
            <div className="mb-8">
              <h3 className="text-[#ECEDEF] mb-4">Advanced Metrics ({year})</h3>
              <div className="grid grid-cols-5 gap-4">
                {(() => {
                  const season = profile?.careerStats?.find((s: any) => s.year === year);
                  const fip = season?.fip ?? 0;
                  const xfip = season?.xfip ?? 0;
                  const kper9 = season?.kper9 ?? 0;
                  const bbper9 = season?.bbper9 ?? 0;
                  const war = season?.war ?? 0;
                  return (
                    <>
                      <SBKpi label="FIP" value={Number(fip).toFixed(2)} className="bg-[#17181B]" />
                      <SBKpi label="xFIP" value={Number(xfip).toFixed(2)} className="bg-[#17181B]" />
                      <SBKpi label="K/9" value={Number(kper9).toFixed(1)} className="bg-[#17181B]" />
                      <SBKpi label="BB/9" value={Number(bbper9).toFixed(2)} className="bg-[#17181B]" />
                      <SBKpi label="WAR" value={Number(war).toFixed(1)} className="bg-[#17181B]" />
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Hitter Traditional Stats */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#ECEDEF]">Traditional Stats ({year})</h3>
                {profile && (
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-[200px] bg-[#17181B] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                      {profile.careerStats.map((s: any) => (
                        <SelectItem
                          key={s.year}
                          value={s.year}
                          className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF]"
                        >
                          {s.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4">
                {(() => {
                  const season = profile?.careerStats?.find((s: any) => s.year === year);
                  const avg = season?.avg ?? profile?.traditional?.avg ?? 0;
                  const hr = season?.hr ?? profile?.traditional?.hr ?? 0;
                  const rbi = season?.rbi ?? profile?.traditional?.rbi ?? 0;
                  const ops = season?.ops ?? profile?.traditional?.ops ?? 0;
                  return (
                    <>
                      <SBKpi label="Batting Average" value={Number(avg).toFixed(3)} className="bg-[#17181B]" />
                      <SBKpi label="Home Runs" value={Number(hr).toString()} className="bg-[#17181B]" />
                      <SBKpi label="RBI" value={Number(rbi).toString()} className="bg-[#17181B]" />
                      <SBKpi label="OPS" value={Number(ops).toFixed(3)} className="bg-[#17181B]" />
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Hitter Advanced Metrics */}
            <div className="mb-8">
              <h3 className="text-[#ECEDEF] mb-4">Advanced Metrics ({year})</h3>
              <div className="grid grid-cols-5 gap-4">
                {(() => {
                  const season = profile?.careerStats?.find((s: any) => s.year === year);
                  const xwoba = season?.xwoba ?? 0;
                  const xslg = season?.xslg ?? 0;
                  const wrcPlus = season?.wrcPlus ?? 0;
                  const war = season?.war ?? 0;
                  const wpa = season?.wpa ?? 0;
                  return (
                    <>
                      <SBKpi label="xwOBA" value={Number(xwoba).toFixed(3)} className="bg-[#17181B]" />
                      <SBKpi label="xSLG" value={Number(xslg).toFixed(3)} className="bg-[#17181B]" />
                      <SBKpi label="wRC+" value={Number(wrcPlus).toString()} className="bg-[#17181B]" />
                      <SBKpi label="WAR" value={Number(war).toFixed(1)} className="bg-[#17181B]" />
                      <SBKpi label="WPA" value={Number(wpa).toFixed(1)} className="bg-[#17181B]" />
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Batted Ball */}
            <div className="mb-8">
              <h3 className="text-[#ECEDEF] mb-4">Batted Ball Profile ({year})</h3>
              <div className="grid grid-cols-4 gap-4">
                {(() => {
                  const season = profile?.battedBallTrend?.find((s: any) => s.year === year);
                  const ev = season?.exitVelo ?? 0;
                  const hhRaw = season?.hardHitPct ?? 0;
                  const brlRaw = season?.barrelPct ?? 0;
                  const toPercent = (v: number) => {
                    const pct = v <= 1 ? v * 100 : v;
                    return pct.toFixed(2);
                  };
                  const hh = toPercent(hhRaw);
                  const brl = toPercent(brlRaw);
                  const la = profile?.careerStats?.find((s: any) => s.year === year)?.launchAngle ?? 0;
                  return (
                    <>
                      <SBKpi label="Exit Velocity" value={`${Number(ev).toFixed(1)} mph`} className="bg-[#17181B]" />
                      <SBKpi label="Hard Hit %" value={`${hh}%`} className="bg-[#17181B]" />
                      <SBKpi label="Barrel %" value={`${brl}%`} className="bg-[#17181B]" />
                      <SBKpi label="Launch Angle" value={`${Number(la).toFixed(1)}°`} className="bg-[#17181B]" />
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        )}

        {/* Charts */}
        {isPitcherPlayer ? (
          <>
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* WAR Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
              >
                <h3 className="text-[#ECEDEF] mb-4">WAR Trend</h3>
                <InteractiveChart 
                  data={profile?.careerStats || []}
                  type="bar"
                  dataKey="war"
                  xKey="year"
                  color="#A8B4BD"
                  height={280}
                />
              </motion.div>

              {/* ERA Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
              >
                <h3 className="text-[#ECEDEF] mb-4">ERA Trend</h3>
                <InteractiveChart 
                  data={profile?.careerStats || []}
                  type="line"
                  dataKey="era"
                  xKey="year"
                  color="#60A5FA"
                  height={280}
                />
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* xFIP Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
              >
                <h3 className="text-[#ECEDEF] mb-4">xFIP Trend</h3>
                <InteractiveChart 
                  data={profile?.careerStats || []}
                  type="line"
                  dataKey="xfip"
                  xKey="year"
                  color="#F472B6"
                  height={280}
                />
              </motion.div>

              {/* K/9 Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
              >
                <h3 className="text-[#ECEDEF] mb-4">K/9 Trend</h3>
                <InteractiveChart 
                  data={profile?.careerStats || []}
                  type="bar"
                  dataKey="kper9"
                  xKey="year"
                  color="#34D399"
                  height={280}
                />
              </motion.div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Career WAR & wRC+ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
              >
                <h3 className="text-[#ECEDEF] mb-4">WAR Trend</h3>
                <InteractiveChart 
                  data={profile?.careerStats || []}
                  type="bar"
                  dataKey="war"
                  xKey="year"
                  color="#A8B4BD"
                  height={280}
                />
              </motion.div>

              {/* wRC+ Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
              >
                <h3 className="text-[#ECEDEF] mb-4">wRC+ Trend</h3>
                <InteractiveChart 
                  data={profile?.careerStats || []}
                  type="line"
                  dataKey="wrcPlus"
                  xKey="year"
                  color="#60A5FA"
                  height={280}
                />
              </motion.div>
            </div>

            {/* Batted Ball Trends */}
            <div className="grid grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
              >
                <h3 className="text-[#ECEDEF] mb-4">Exit Velocity Trend</h3>
                <InteractiveChart 
                  data={profile?.battedBallTrend || []}
                  type="line"
                  dataKey="exitVelo"
                  xKey="year"
                  color="#F472B6"
                  height={240}
                  yDomain={[80, 100]}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
              >
                <h3 className="text-[#ECEDEF] mb-4">Hard Hit % Trend</h3>
                <InteractiveChart 
                  data={profile?.battedBallTrend || []}
                  type="bar"
                  dataKey="hardHitPct"
                  xKey="year"
                  color="#34D399"
                  height={240}
                />
              </motion.div>
            </div>
          </>
        )}
        
        {/* Full-width bottom button */}
        <SBButton 
          size="lg" 
          onClick={onContinue}
          icon={<ArrowRight size={18} />}
          iconPosition="right"
          className="w-full mt-6"
        >
          Market Comparables
        </SBButton>
      </div>
    </div>
  );
}
