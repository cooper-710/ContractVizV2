# Boras Contract Web App - Calculations & Methodology Documentation

## Table of Contents
1. [Overview](#overview)
2. [Contract Valuation (AAV Estimation)](#contract-valuation-aav-estimation)
3. [Contract Length Formula](#contract-length-formula)
4. [Team Fit Analysis](#team-fit-analysis)
5. [Contract Structure Calculations](#contract-structure-calculations)
6. [Data Sources & Processing](#data-sources--processing)

---

## Overview

This application provides comprehensive contract valuation and analysis for MLB free agents. It uses historical comparable player data, inflation-adjusted market analysis, and position-specific statistical weighting to estimate fair contract terms.

### Core Methodology
- **Comparable Player Analysis**: Historical contracts of similar players form the baseline
- **Statistical Performance Adjustment**: Player performance metrics adjust baseline values
- **Position-Specific Weights**: Different positions emphasize different statistical categories
- **Market Inflation**: Contracts are adjusted for salary inflation over time
- **Age-Performance Curves**: Age impacts both contract length and value

---

## Contract Valuation (AAV Estimation)

### 1. Baseline Calculation

**Formula**: 
```
Baseline AAV = Average(Selected Comparable Player AAVs, Inflation-Adjusted)
```

**Process**:
1. Select comparable players (similar position, age range, performance level)
2. Retrieve historical contract AAV for each comparable
3. Adjust each AAV for inflation from signing year to present year
4. Calculate mean of adjusted AAVs

**Inflation Adjustment**:
```
Adjusted AAV = Historical AAV × (1 + Inflation Rate)^(Years Since Signing)
```
- Default inflation rate: 5% per year
- Adjustable by user (0-15%)

### 2. Statistical Performance Multiplier

**Formula**:
```
AAV Multiplier = Weighted Sum of Stat Ratios / Total Weights
Final AAV = Baseline AAV × AAV Multiplier (clamped 0.75-1.4)
```

**Statistical Categories & Default Weights**:

| Stat | Label | Weight | Higher is Better |
|------|-------|--------|------------------|
| fg_RBI | RBI | 0.1 | Yes |
| fg_HR | HR | 0.1 | Yes |
| fg_OPS | OPS | 0.1 | Yes |
| fg_wRC+ | wRC+ | 0.1 | Yes |
| fg_BB% | BB% | 0.1 | Yes |
| fg_K% | K% | 0.1 | No (lower is better) |
| fg_PA | PA | 0.1 | Yes |
| fg_WAR | WAR | 0.1 | Yes |
| fg_xwOBA | xwOBA | 0.1 | Yes |
| fg_xSLG | xSLG | 0.1 | Yes |
| sc_EV_brl_pa | Barrel% | 0.1 | Yes |
| sc_EV_ev50 | avgEV | 0.1 | Yes |
| fg_Def | Def | 0.1 | Yes |
| fg_BsR | BsR | 0.1 | Yes |

**Position-Specific Weight Adjustments**:

Weights vary by position to reflect positional value. Examples:

**1B/DH (Power Positions)**:
- Higher weights: HR (0.65), wRC+ (0.70), RBI (0.50)
- Lower weights: Def (0.10), BsR (0.15)
- Total weight sum: 5.0

**SS/2B (Premium Defense)**:
- Higher weights: Def (1.00), WAR (0.60), PA (0.50)
- Lower weights: HR (0.20), RBI (0.20)
- Total weight sum: 5.0

**CF/OF (Balanced)**:
- Higher weights: Def (0.70), BsR (0.55), WAR (0.60)
- Moderate offensive weights
- Total weight sum: 5.0

**Ratio Calculation**:

For each stat:
```
If higherBetter:
    ratio = Player Value / Cohort Average Value
Else (lower is better, e.g., K%):
    ratio = Cohort Average Value / Player Value

ratio = clamp(ratio, 0.1, 10.0)
```

Special handling for Defense and Base Running (can be negative):
```
delta = Player Value - Cohort Average
typical_range = 10
delta_ratio = 1 + (delta / typical_range) × 0.2
ratio = clamp(delta_ratio, 0.5, 2.0)
```

**Weighted Multiplier**:
```
For each stat:
    contribution = (ratio - 1) × weight
    
weighted_sum = sum(ratio × weight) for all stats
total_weight = sum(weights)
raw_multiplier = weighted_sum / total_weight

Final AAV Multiplier = clamp(raw_multiplier, 0.75, 1.4)
```

**Individual Stat Impact on AAV**:
```
For each stat:
    stat_multiplier = 1 + (contribution / total_weight)
    aav_impact = baseline_AAV × contribution / total_weight
```

### 3. Final AAV Calculation

```
Fair AAV = Baseline AAV × AAV Multiplier
```

User can toggle adjustments on/off to see baseline vs. adjusted values.

---

## Contract Length Formula

### 1. Baseline Years

**Formula**:
```
Baseline Years = Average(Selected Comparable Player Contract Years)
```

Simple arithmetic mean of contract lengths from selected comparables.

### 2. Age Adjustment

**Age Delta**:
```
age_delta = Player Age - Cohort Average Signing Age
older_delta = max(0, age_delta)
younger_delta = max(0, -age_delta)
```

**Age Multiplier Components**:

Penalty for older players (quadratic curve):
```
penalty_component = (0.05 × older_delta) + (0.010 × older_delta²)
```

Adjustment for younger players (with diminishing returns):
```
benefit_component = (0.03 × younger_delta) - (0.005 × younger_delta²)
```

**Raw Age Multiplier**:
```
raw_age_multiplier = 1 - penalty_component + benefit_component
age_multiplier = clamp(raw_age_multiplier, 0.6, 1.5)
```

**Absolute Age Penalty** (additional penalty for players 31+):
```
If player_age >= 31:
    absolute_age_penalty = min(2.0, (player_age - 30) × 0.25)
Else:
    absolute_age_penalty = 0
```

Examples:
- Age 30: 0 years penalty
- Age 31: 0.25 years penalty
- Age 35: 1.25 years penalty
- Age 38+: 2.0 years penalty (maximum)

### 3. Performance Adjustment

**Formula**:
```
performance_adjustment_raw = (aav_multiplier - 1) × 1.8
performance_adjustment = clamp(performance_adjustment_raw, -1.5, 1.5)
```

This correlates contract length with performance quality:
- AAV multiplier > 1: positive adjustment to years
- AAV multiplier < 1: negative adjustment to years
- Multiplier amplifies AAV effect by 1.8×
- Bounded at ±1.5 years

### 4. Total Years Adjustment

**Formula**:
```
years_adjustment = ((baseline_years × age_multiplier) - baseline_years) 
                   - absolute_age_penalty 
                   + performance_adjustment

proposed_years = baseline_years + years_adjustment
```

### 5. Soft Cap & Rounding

**Soft Cap**:
```
capped_years = min(baseline_years + 2.0, proposed_years)
```

Maximum years cannot exceed baseline by more than 2.0 years.

**Final Rounding**:
```
fair_years = max(1, round(capped_years × 2) / 2)
```

Rounds to nearest 0.5 years, minimum 1 year.

### Example Calculation

**Scenario**: 30-year-old 1B, cohort baseline 8.8 years, cohort signing age 28, AAV multiplier 1.1

```
age_delta = 30 - 28 = 2
older_delta = 2, younger_delta = 0

penalty_component = (0.05 × 2) + (0.010 × 4) = 0.14
benefit_component = 0
raw_age_multiplier = 1 - 0.14 = 0.86
age_multiplier = 0.86 (within 0.6-1.5 bounds)

absolute_age_penalty = 0 (age 30, not 31+)

performance_adjustment_raw = (1.1 - 1) × 1.8 = 0.18
performance_adjustment = 0.18 (within ±1.5 bounds)

years_adjustment = ((8.8 × 0.86) - 8.8) - 0 + 0.18
                 = -1.23 + 0.18 = -1.05

proposed_years = 8.8 - 1.05 = 7.75
capped_years = min(10.8, 7.75) = 7.75
fair_years = round(7.75 × 2) / 2 = 8.0 years
```

---

## Team Fit Analysis

### 1. Composite Score (Position Rankings)

**Purpose**: Rank players at the same position within a team or division relative to target player.

**Formula**:
```
For each stat:
    baseline_value = Target Player Value
    compare_value = Comparison Player Value
    
    If higherBetter:
        ratio = compare_value / baseline_value
    Else:
        ratio = baseline_value / compare_value
    
    ratio = clamp(ratio, 0.1, 10.0)
    
    contribution = (ratio - 1) × position_weight

composite_score = sum(contributions)
```

**Interpretation**:
- Score = 0: Exactly matches target player (baseline)
- Score > 0: Better than target player
- Score < 0: Worse than target player
- Typical range: -3.0 to +3.0

**Position Weights**: Same as AAV calculation, position-specific.

### 2. Depth Chart Impact

**Methodology**:

1. **Current Score**: Target player's composite score (always 0 vs. themselves)

2. **Projected Score Range** (age-based decline):
```
If player_age >= 32:
    annual_decline = 0.15
ElseIf player_age >= 30:
    annual_decline = 0.12
ElseIf player_age >= 27:
    annual_decline = 0.08
Else:
    annual_decline = 0.03

projected_score_min = current_score - (annual_decline × contract_years × 1.2)
projected_score_max = current_score - (annual_decline × contract_years × 0.8)
```

3. **Replacement Risk**:
```
best_replacement = next best player at position on team (who played in 2024/2025)
replacement_score = composite_score(best_replacement vs. target)
replacement_risk = -replacement_score (negative, represents loss)
```

If no replacement available: replacement_risk = 0 (full loss of production)

### 3. Division Rankings

**Process**:
1. Filter all players by primary position
2. Filter by division (6 divisions: AL/NL East/Central/West)
3. Calculate composite scores vs. target player
4. Sort by composite score (descending)
5. Assign ranks (1 = best, higher = worse)

**Statistical Rankings**:
- Individual stats (wRC+, HR, WAR, etc.) ranked separately
- Sort by raw stat value
- For K%, lower is better (reverse sort)

---

## Contract Structure Calculations

### 1. Salary Distribution

**Even Structure**:
```
yearly_salary = base_AAV (constant each year)
```

**Front-Loaded Structure**:
```
load_factor = 1 + (front_load_percent / 100) × (1 - year_index / (total_years - 1))
yearly_salary = base_AAV × load_factor
```

**Back-Loaded Structure**:
```
load_factor = 1 + (front_load_percent / 100) × (year_index / (total_years - 1))
yearly_salary = base_AAV × load_factor
```

**Normalization** (ensures total matches base contract value):
```
current_total = sum(yearly_salaries)
adjustment_factor = (base_AAV × years) / current_total
Each yearly_salary × adjustment_factor
```

### 2. Signing Bonus

- Added to Year 1 cash flow
- Spread evenly across all years for CBT calculation
- Counts toward guaranteed money

### 3. Performance Bonuses

**Types**:
- Performance bonus (stats-based)
- Award bonus (MVP, All-Star, etc.)
- Playing time bonus (games played, PA thresholds)

**Projection** (for total value estimate):
```
projected_bonus = (perf_bonus + award_bonus + playtime_bonus) × 0.6
```

Assumes 60% achievement rate each year.

**Total Value Impact**:
- Added to yearly cash flow
- Not guaranteed (excluded from guaranteed value)
- Included in potential value (100% achievement)

### 4. Salary Escalators

**Trigger**: Conditional performance clauses (e.g., All-Star selection, 140+ games)

**Calculation**:
```
If escalator_triggered (year > 1):
    escalator_chance = 0.4 (40% probability)
    additional_salary = yearly_salary × (escalator_percent / 100) × escalator_chance
    yearly_salary += additional_salary
```

For projections, assumes 40% chance per year after Year 1.

### 5. Deferrals

**Deferred Amount**:
```
total_cash_before_deferral = yearly_salary + bonuses
deferred_amount = total_cash_before_deferral × (deferral_percent / 100)
cash_paid = total_cash_before_deferral - deferred_amount
```

**Present Value** (for CBT calculation):
```
PV = deferred_amount / (1 + interest_rate)^deferral_years
```

**CBT Impact**:
```
cbt_hit = yearly_salary + signing_bonus_prorated - (deferred_amount - present_value)
```

Deferrals reduce CBT hit because future money is less valuable (time value of money).

### 6. Contract Value Calculations

**Total Value**:
```
total_value = sum(yearly_base_salary + yearly_bonuses)
```

**Guaranteed Value**:
```
guaranteed_value = (base_AAV × years) + signing_bonus
```

Excludes performance bonuses (not guaranteed).

**Potential Value**:
```
max_bonuses_per_year = perf_bonus + award_bonus + playtime_bonus
max_escalator_value = base_AAV × (escalator_percent / 100) × (years - 1)
potential_value = guaranteed_value + (max_bonuses_per_year × years) + max_escalator_value + team_option_value
```

Maximum possible earnings if all incentives achieved.

**Average CBT Impact**:
```
cbt_impact = sum(yearly_cbt_hits) / years
```

### 7. Team Options

**Structure**:
- Team decides whether to exercise option for additional year(s)
- Option year salary predetermined
- Buyout amount if declined

**Value Calculation**:
```
If team_option_included:
    potential_value += team_option_value
```

Counted in potential value, not guaranteed value.

---

## Data Sources & Processing

### 1. Data Sources

**FanGraphs (`fangraphs.csv`)**:
- Offensive stats: wRC+, OPS, xwOBA, xSLG, BB%, K%, PA, WAR
- Defensive stats: Def, BsR
- Fielding: Position, Games played

**Statcast (`statscast.csv`)**:
- Batted ball metrics: Barrel%, Hard Hit%, avgEV, maxEV
- Contact quality: Contact%

**Spotrac (`spotrac.csv`)**:
- Contract details: AAV, Years, Signing year
- Contract structure information

**Positions (`Positions.csv`)**:
- Season-by-season position data
- Primary position determination
- Team history by season

### 2. Data Processing

**Player Name Normalization**:
```
normalize(name):
    - Convert to lowercase
    - Remove accents and diacritics
    - Remove Jr., Sr., II, III suffixes
    - Trim whitespace
    - Handle middle names/initials consistently
```

**CSV Merging**:
1. Load all CSVs in parallel
2. Normalize player names
3. Merge by normalized name (FanGraphs as base)
4. Join Statcast and Spotrac data by player name + season
5. Handle missing data with fallback values

**Primary Position Determination**:
```
For each player across relevant seasons:
    Count games/innings at each position
    Primary position = position with most games
```

Uses `Positions.csv` for authoritative position data.

**Team Abbreviation Normalization**:
```
Handles variants:
    ARI/ARZ/AZ → ARI
    SD/SDP → SD
    SF/SFG → SF
    CHW/CWS → CHW
    KC/KCR → KC
    TB/TBR → TB
    WSH/WSN → WSH
    OAK/ATH → OAK
    LAA/ANA → LAA
```

### 3. Statistical Time Periods

**2025 Season**: Most recent season data

**3-Year Average**: Mean of 2023-2025 seasons (or available subset)

**3-Year Pre-Contract**: For comparable players, 3-year avg before contract signing

**Career Average**: All available seasons, weighted mean

**Aggregation Formula**:
```
For counting stats (HR, RBI, PA):
    aggregate = sum(values) / num_seasons

For rate stats (wRC+, OPS, AVG, etc.):
    aggregate = mean(values)

For age:
    aggregate = mean(ages)
```

### 4. Inflation Adjustment

**Formula**:
```
years_since_signing = current_year - contract_signing_year
inflation_multiplier = (1 + inflation_rate)^years_since_signing
adjusted_aav = historical_aav × inflation_multiplier
```

**Default Settings**:
- Inflation rate: 5% per year
- Present year: 2025
- Adjustable: 0-15% range

---

## Calculation Validation & Bounds

### 1. AAV Multiplier Bounds

```
Raw multiplier = weighted_sum / total_weight
Final multiplier = clamp(raw_multiplier, 0.75, 1.4)
```

Bounds constrain valuations:
- Minimum: 75% of baseline (AAV multiplier < 0.75)
- Maximum: 140% of baseline (AAV multiplier > 1.4)

### 2. Years Adjustment Bounds

```
age_multiplier: [0.6, 1.5]
absolute_age_penalty: [0, 2.0]
performance_adjustment: [-1.5, 1.5]
soft_cap: baseline_years + 2.0
minimum_years: 1.0
```

### 3. Stat Ratio Bounds

```
For most stats: ratio clamped to [0.1, 10.0]
For Def/BsR: ratio clamped to [0.5, 2.0]
```

Bounds prevent divide-by-zero and extreme outliers.

### 4. Rounding & Precision

**AAV**: 
- Internal: Full precision
- Display: $XX.X M (1 decimal)

**Years**: 
- Internal: Full precision
- Final: Rounded to nearest 0.5
- Display: X.X years

**Stats**:
- Percentages: 1 decimal (XX.X%)
- Decimals (OPS, xwOBA): 3 decimals (.XXX)
- Counting stats: Whole numbers (XX)
- Velocity: 1 decimal (XX.X mph)

---

## Assumptions & Limitations

### 1. Market Assumptions

- 5% annual salary inflation (historical MLB average)
- Free agent market follows comparable player precedents
- Team payroll data accurate through 2031
- Position scarcity not explicitly modeled

### 2. Performance Assumptions

- Past performance predicts future value
- Statistical categories weighted equally within tiers
- Age-related decline follows historical curves
- Injury risk not explicitly modeled
- No explicit adjustment for park factors

### 3. Contract Structure Assumptions

- Performance bonuses achieved at 60% rate
- Escalators triggered at 40% probability per year
- Deferral interest rates follow market standards
- CBT penalties not modeled (only impact calculated)

### 4. Data Limitations

- Historical contracts may not reflect current market
- Comparable selection critical (user-dependent)
- Position changes over career not fully captured
- International free agents may differ from domestic market
- Short sample sizes for recent stats (2025 season)

### 5. Known Simplifications

- No modeling of opt-out clauses
- No-trade clauses not considered
- Luxury tax penalties not calculated
- Service time manipulation not modeled
- Arbitration vs. free agency not distinguished
- No adjustment for small vs. large market teams

---

## Technical Implementation Notes

### 1. Real-Time Calculations

All calculations performed client-side for instant feedback:
- User adjustments (weights, inflation) recalculate immediately
- No backend API required for calculations
- Can be migrated to backend if needed for consistency

### 2. State Management

- Contract terms stored in React Context
- Persisted to localStorage for session recovery
- Calculations memoized to prevent unnecessary recomputation

### 3. Data Caching

- CSV data loaded once on app initialization
- Parsed and normalized player data cached in memory
- Position/team maps computed once per session

### 4. Performance Optimizations

- Lazy loading of player comparisons
- Virtualized tables for large datasets
- Debounced slider inputs
- Memoized expensive calculations (composite scores, rankings)

---

## Methodology References

### Statistical Concepts

- **wRC+ (Weighted Runs Created Plus)**: FanGraphs metric, league-average = 100
- **xwOBA (Expected Weighted On-Base Average)**: Statcast expected performance metric
- **xSLG (Expected Slugging Percentage)**: Statcast expected power metric
- **Barrel%**: Statcast measure of optimal contact (90+ mph, 26-30° launch angle)
- **Hard Hit%**: Batted balls 95+ mph
- **avgEV/maxEV**: Average and maximum exit velocity
- **Def**: FanGraphs defensive runs above average
- **BsR**: FanGraphs base running runs above average

### Contract Concepts

- **AAV (Average Annual Value)**: Total contract value divided by years
- **CBT (Competitive Balance Tax)**: Luxury tax on payrolls exceeding threshold
- **Present Value**: Time-value-of-money adjustment for deferred payments
- **Guaranteed Money**: Salary owed regardless of performance
- **Potential Value**: Maximum earnings including all incentives

### Market Principles

- **Comparable Analysis**: Valuation based on similar player contracts
- **Age Curves**: Performance and contract length decline with age
- **Positional Adjustments**: Scarce positions (SS, C, CF) command premiums
- **Inflation**: MLB salaries historically increase 3-7% annually

---

## Version History

**Version 1.0** (Current)
- Initial methodology implementation
- 14 statistical categories
- 9 position-specific weight profiles
- Inflation-adjusted comparable analysis
- Comprehensive contract structure modeling

**Current Coefficient Values**:
- Age multiplier (older): Linear 0.05, Quadratic 0.010
- Age multiplier (younger): Linear 0.03, Quadratic -0.005
- Age multiplier bounds: [0.6, 1.5]
- Absolute age penalty threshold: 31 years, rate 0.25 per year, cap 2.0 years
- Performance adjustment: Multiplier 1.8, bounds [-1.5, 1.5]
- Soft cap: Baseline + 2.0 years maximum

---

## Contact & Support

For questions about methodology, data sources, or calculation details, please refer to:
- Source code: `src/components/screens/EstimatedValue.tsx` (AAV & Years)
- Source code: `src/components/screens/TeamFit.tsx` (Composite scoring)
- Source code: `src/services/contractCalculationService.ts` (Contract structure)
- Data schemas: `src/types/index.ts`

---

*Document Version: 1.0*  
*Last Updated: November 1, 2025*  
*Application: Boras Contract Web App*

