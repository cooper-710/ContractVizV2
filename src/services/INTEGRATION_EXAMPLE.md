# Integration Example: Updating Components to Use Data Layer

This document shows exactly how to update existing components to use the new data service layer.

## Before & After Comparison

### Example 1: PlayerStats Component

#### ❌ BEFORE (with inline mock data)

```tsx
export function PlayerStats({ onContinue, onBack }: PlayerStatsProps) {
  // Mock data directly in component
  const peteStats = {
    traditional: {
      avg: 0.240,
      hr: 46,
      rbi: 118,
      ops: 0.788,
    },
    // ... more mock data
  };

  const careerStats = [
    { year: '2019', war: 2.8, wrcPlus: 139, hr: 53, xwoba: 0.360 },
    // ... more mock data
  ];

  return (
    <div>
      {/* Use mock data */}
      <div>HR: {peteStats.traditional.hr}</div>
    </div>
  );
}
```

#### ✅ AFTER (with data service layer)

```tsx
import { usePlayerStats } from '../../hooks/usePlayerData';

export function PlayerStats({ onContinue, onBack }: PlayerStatsProps) {
  // Fetch data using hook
  const { data: playerData, loading, error } = usePlayerStats('pete-alonso');

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="text-[#A8B4BD]">Loading player statistics...</div>
      </div>
    );
  }

  // Handle error state
  if (error || !playerData) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="text-red-400">Error: {error || 'Failed to load data'}</div>
      </div>
    );
  }

  // Use real/mock data (seamlessly switches based on USE_MOCK_DATA flag)
  return (
    <div>
      <div>HR: {playerData.traditional.hr}</div>
      <div>Career Stats:</div>
      {playerData.careerStats.map(year => (
        <div key={year.year}>
          {year.year}: {year.hr} HR, {year.war} WAR
        </div>
      ))}
    </div>
  );
}
```

---

### Example 2: PlayerComparisons Component

#### ❌ BEFORE (with inline mock data)

```tsx
export function PlayerComparisons() {
  const players = [
    {
      player: 'Alonso',
      age: 30,
      careerWar: 3.0,
      // ... mock data
    },
    {
      player: 'Freeman',
      age: 32,
      careerWar: 4.8,
      // ... mock data
    },
  ];

  return (
    <table>
      {players.map(p => (
        <tr key={p.player}>
          <td>{p.player}</td>
          <td>{p.careerWar}</td>
        </tr>
      ))}
    </table>
  );
}
```

#### ✅ AFTER (with data service layer)

```tsx
import { usePlayerComparisons } from '../../hooks/usePlayerData';

export function PlayerComparisons() {
  const { data: players, loading, error } = usePlayerComparisons('pete-alonso');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} />;
  if (!players) return null;

  return (
    <table>
      {players.map(p => (
        <tr key={p.player}>
          <td>{p.player}</td>
          <td>{p.careerWar}</td>
        </tr>
      ))}
    </table>
  );
}
```

---

### Example 3: Using Multiple Data Sources

#### ✅ Combined Data Hook

```tsx
import { usePlayerFullProfile } from '../../hooks/usePlayerData';

export function PlayerOverview() {
  const { stats, comparisons, loading, error, refetch } = usePlayerFullProfile('pete-alonso');

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={refetch} />;

  return (
    <div>
      <h1>{stats?.name}</h1>
      <div>WAR: {stats?.advanced.war}</div>
      
      <h2>Comparable Players</h2>
      {comparisons?.map(comp => (
        <div key={comp.player}>{comp.player}</div>
      ))}
    </div>
  );
}
```

---

## Step-by-Step Migration Guide

### Step 1: Import the Hook

```tsx
import { usePlayerStats } from '../../hooks/usePlayerData';
```

### Step 2: Replace Mock Data with Hook

```tsx
// OLD:
const playerData = { /* mock data */ };

// NEW:
const { data: playerData, loading, error } = usePlayerStats('pete-alonso');
```

### Step 3: Add Loading State

```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0B0B0C]">
      <div className="animate-pulse text-[#A8B4BD]">Loading...</div>
    </div>
  );
}
```

### Step 4: Add Error Handling

```tsx
if (error || !playerData) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0B0B0C]">
      <div className="text-red-400">
        <p>Error loading data</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    </div>
  );
}
```

### Step 5: Use the Data

```tsx
// Data is now typed and comes from service layer
// Works with both mock and real API!
return (
  <div>
    <h1>{playerData.name}</h1>
    <p>HR: {playerData.traditional.hr}</p>
  </div>
);
```

---

## Complete Component Template

Here's a complete template you can copy-paste:

```tsx
import React from 'react';
import { usePlayerStats } from '../../hooks/usePlayerData';
import { SBButton } from '../boras/SBButton';

interface MyComponentProps {
  onContinue: () => void;
  onBack?: () => void;
}

export function MyComponent({ onContinue, onBack }: MyComponentProps) {
  // Fetch data
  const { data, loading, error, refetch } = usePlayerStats('pete-alonso');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-[#A8B4BD] mb-4">Loading player data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            {error || 'Failed to load player data'}
          </div>
          <SBButton onClick={refetch}>Retry</SBButton>
        </div>
      </div>
    );
  }

  // Success state - render your component
  return (
    <div className="min-h-screen bg-[#0B0B0C]">
      {/* Your component content */}
      <h1>{data.name}</h1>
      <div>Home Runs: {data.traditional.hr}</div>
      
      {/* Navigation */}
      <div className="flex gap-3">
        {onBack && <SBButton onClick={onBack}>Back</SBButton>}
        <SBButton onClick={onContinue}>Continue</SBButton>
      </div>
    </div>
  );
}
```

---

## TypeScript Type Safety

All data is fully typed! Your IDE will autocomplete available fields:

```tsx
const { data } = usePlayerStats('pete-alonso');

// TypeScript knows these are available:
data?.name                    // string
data?.traditional.hr          // number
data?.advanced.war            // number
data?.careerStats[0].year     // string
data?.battedBall.exitVelo     // number
```

---

## Switching Between Mock and Real Data

### Development (Mock Data)
In `/services/api.ts`:
```typescript
const USE_MOCK_DATA = true;  // Uses local mock data
```

### Production (Real API)
In `/services/api.ts`:
```typescript
const USE_MOCK_DATA = false;  // Uses real backend API
```

**That's it!** No component changes needed. The hooks handle everything.

---

## Advanced: Manual Data Fetching

If you need more control, you can call the service functions directly:

```tsx
import { fetchPlayerStats } from '../services/api';
import { useEffect, useState } from 'react';

export function ManualFetchComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const stats = await fetchPlayerStats('pete-alonso');
        setData(stats);
      } catch (error) {
        console.error('Error:', error);
      }
    }
    loadData();
  }, []);

  return <div>{data?.name}</div>;
}
```

But using the hooks is recommended for consistency and better error handling!

---

## Summary

✅ **Use hooks from `/hooks/usePlayerData.ts`**  
✅ **Handle loading and error states**  
✅ **TypeScript ensures type safety**  
✅ **Works with both mock and real data**  
✅ **No changes needed when switching to production API**  

That's it! Your components are now backend-ready. 🚀
