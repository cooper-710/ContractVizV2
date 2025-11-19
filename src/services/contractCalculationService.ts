// ============================================================================
// CONTRACT CALCULATION SERVICE
// ============================================================================
// This service handles all contract calculations and financial modeling.
// These calculations are currently done on the frontend, but in production
// you may want to move complex calculations to the backend for consistency.
//
// BACKEND INTEGRATION GUIDE:
// These functions can remain client-side for real-time interactivity, OR
// be moved to backend if you want centralized calculation logic.
//
// If moving to backend:
// - POST /api/contracts/calculate - Send contract terms, receive calculations
// ============================================================================

import type { ContractTerms, YearlyBreakdown, ContractCalculations } from '../types';

/**
 * Calculates comprehensive contract breakdown from terms
 * 
 * @param terms - Contract terms and structure
 * @returns ContractCalculations - Complete financial breakdown
 * 
 * This function performs all contract math including:
 * - Yearly salary distribution
 * - Signing bonus allocation
 * - Deferral calculations with interest
 * - Performance bonus projections
 * - CBT (luxury tax) impact
 * - Options and escalators
 */
export function calculateContractBreakdown(terms: ContractTerms): ContractCalculations {
  const yearlyBreakdown: YearlyBreakdown[] = [];
  
  // Calculate base salary per year before any adjustments
  let baseSalaryPerYear = terms.baseAAV;
  
  // Total base contract value (before bonuses)
  const baseValue = terms.baseAAV * terms.years;
  
  // Calculate yearly salaries based on structure
  for (let i = 0; i < terms.years; i++) {
    const year = 2025 + i;
    let yearSalary = baseSalaryPerYear;
    
    // Apply front/back loading
    if (terms.salaryStructure === 'front-loaded') {
      const loadFactor = 1 + (terms.frontLoadPercent / 100) * (1 - i / (terms.years - 1));
      yearSalary = baseSalaryPerYear * loadFactor;
    } else if (terms.salaryStructure === 'back-loaded') {
      const loadFactor = 1 + (terms.frontLoadPercent / 100) * (i / (terms.years - 1));
      yearSalary = baseSalaryPerYear * loadFactor;
    }
    
    // Add signing bonus to first year
    let bonus = 0;
    if (i === 0) {
      bonus = terms.signingBonus;
    }
    
    // Add performance bonuses (assume 60% achievement rate for projection)
    const performanceBonusProjected = 
      (terms.performanceBonus + terms.awardBonus + terms.playingTimeBonus) * 0.6;
    
    bonus += performanceBonusProjected;
    
    // Apply escalator if conditions met (assume 40% chance per year)
    if (terms.hasEscalator && i > 0) {
      const escalatorChance = 0.4;
      yearSalary += (yearSalary * (terms.escalatorPercent / 100) * escalatorChance);
    }
    
    // Calculate deferred amount
    const totalCashBeforeDeferral = yearSalary + bonus;
    const deferredAmount = totalCashBeforeDeferral * (terms.deferralPercent / 100);
    const cashPaid = totalCashBeforeDeferral - deferredAmount;
    
    // CBT hit calculation (includes deferred present value)
    let cbtHit = yearSalary;
    if (i === 0) {
      cbtHit += terms.signingBonus; // Signing bonus counted in CBT
    }
    // Deferrals reduce CBT hit via present value calculation
    if (terms.deferralPercent > 0) {
      const presentValue = calculatePresentValue(
        deferredAmount,
        terms.deferralYears,
        terms.deferralInterest
      );
      cbtHit -= (deferredAmount - presentValue);
    }
    
    yearlyBreakdown.push({
      year,
      baseSalary: yearSalary,
      bonus: bonus,
      deferred: deferredAmount,
      totalCash: cashPaid,
      cbtHit: cbtHit,
    });
  }
  
  // Normalize salaries if front/back loaded (ensure total matches base value)
  if (terms.salaryStructure !== 'even') {
    const currentTotal = yearlyBreakdown.reduce((sum, y) => sum + y.baseSalary, 0);
    const adjustmentFactor = baseValue / currentTotal;
    yearlyBreakdown.forEach(y => {
      y.baseSalary *= adjustmentFactor;
    });
  }
  
  // Calculate totals
  const totalValue = yearlyBreakdown.reduce((sum, y) => sum + y.baseSalary + y.bonus, 0);
  
  // Guaranteed value (base + signing bonus, exclude performance bonuses)
  const guaranteedValue = 
    terms.baseAAV * terms.years + 
    terms.signingBonus;
  
  // Potential value (if all bonuses/escalators hit)
  const maxBonusesPerYear = terms.performanceBonus + terms.awardBonus + terms.playingTimeBonus;
  const maxEscalatorValue = terms.hasEscalator ? 
    (terms.baseAAV * (terms.escalatorPercent / 100) * (terms.years - 1)) : 0;
  const potentialValue = guaranteedValue + (maxBonusesPerYear * terms.years) + maxEscalatorValue;
  
  // Add team option value if applicable
  const teamOptionValue = terms.teamOptionYear !== null ? terms.teamOptionValue : 0;
  
  // Average CBT impact
  const cbtImpact = yearlyBreakdown.reduce((sum, y) => sum + y.cbtHit, 0) / terms.years;
  
  return {
    totalValue,
    guaranteedValue,
    potentialValue: potentialValue + teamOptionValue,
    cbtImpact,
    yearlyBreakdown,
  };
}

/**
 * Calculates present value of deferred money
 * Uses discount rate based on deferral interest rate
 */
function calculatePresentValue(
  futureValue: number,
  years: number,
  interestRate: number
): number {
  // Simple present value formula: PV = FV / (1 + r)^n
  // Where r is the discount rate (typically league minimum ~3% or the interest rate if higher)
  const discountRate = Math.max(0.03, interestRate / 100);
  return futureValue / Math.pow(1 + discountRate, years);
}

/**
 * Validates contract terms against MLB rules
 * Returns array of validation errors, empty if valid
 * 
 * BACKEND INTEGRATION:
 * In production, backend should validate against current CBA rules
 */
export function validateContractTerms(terms: ContractTerms): string[] {
  const errors: string[] = [];
  
  // Basic validations
  if (terms.years < 1 || terms.years > 15) {
    errors.push('Contract length must be between 1 and 15 years');
  }
  
  if (terms.baseAAV < 0) {
    errors.push('Base AAV cannot be negative');
  }
  
  if (terms.signingBonus < 0) {
    errors.push('Signing bonus cannot be negative');
  }
  
  // Deferral validations
  if (terms.deferralPercent > 0) {
    if (terms.deferralYears < 1) {
      errors.push('Deferral period must be at least 1 year');
    }
    if (terms.deferralPercent > 60) {
      errors.push('Deferral percentage cannot exceed 60%');
    }
  }
  
  // Option validations
  if (terms.optOutYear !== null) {
    if (terms.optOutYear >= terms.years) {
      errors.push('Opt-out year must be before contract end');
    }
    if (terms.optOutYear < 3) {
      errors.push('Opt-out typically not allowed before year 3');
    }
  }
  
  if (terms.teamOptionYear !== null) {
    if (terms.teamOptionValue <= 0) {
      errors.push('Team option must have a value');
    }
  }
  
  return errors;
}

/**
 * Formats contract summary for display
 * Returns human-readable contract description
 */
export function formatContractSummary(terms: ContractTerms, calcs: ContractCalculations): string {
  const parts: string[] = [];
  
  parts.push(`${terms.years} years / $${Math.round(calcs.totalValue)}M`);
  
  if (terms.signingBonus > 0) {
    parts.push(`$${terms.signingBonus}M signing bonus`);
  }
  
  if (terms.deferralPercent > 0) {
    parts.push(`${terms.deferralPercent}% deferred over ${terms.deferralYears} years`);
  }
  
  if (terms.optOutYear !== null) {
    parts.push(`Player opt-out after year ${terms.optOutYear}`);
  }
  
  if (terms.teamOptionYear !== null) {
    parts.push(`Team option: Year ${terms.teamOptionYear} ($${terms.teamOptionValue}M)`);
  }
  
  if (terms.noTradeClause === 'full') {
    parts.push('Full no-trade clause');
  } else if (terms.noTradeClause === 'limited') {
    parts.push(`Limited no-trade (${terms.limitedNoTradeTeams} teams)`);
  }
  
  return parts.join(' • ');
}

/**
 * Compares contract to market comps
 * Returns analysis of how contract compares to similar deals
 * 
 * BACKEND INTEGRATION:
 * This could call: POST /api/contracts/compare
 */
export function compareToMarket(
  terms: ContractTerms,
  calcs: ContractCalculations,
  marketComps: Array<{ name: string; aav: number; years: number; totalValue: number }>
): {
  percentile: number;
  closestComp: string;
  analysis: string;
} {
  const aav = calcs.guaranteedValue / terms.years;
  const compAAVs = marketComps.map(c => c.aav).sort((a, b) => a - b);
  
  // Find percentile
  const rank = compAAVs.filter(v => v < aav).length;
  const percentile = Math.round((rank / compAAVs.length) * 100);
  
  // Find closest comp by AAV
  let closestComp = marketComps[0];
  let smallestDiff = Math.abs(marketComps[0].aav - aav);
  
  for (const comp of marketComps) {
    const diff = Math.abs(comp.aav - aav);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestComp = comp;
    }
  }
  
  // Generate analysis
  let analysis = `At $${aav.toFixed(1)}M AAV, this contract ranks in the ${percentile}th percentile of comparable deals. `;
  analysis += `Most similar to ${closestComp.name}'s ${closestComp.years}-year, $${closestComp.totalValue}M contract.`;
  
  return {
    percentile,
    closestComp: closestComp.name,
    analysis,
  };
}
