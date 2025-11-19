// ============================================================================
// REACT HOOKS FOR DATA FETCHING
// ============================================================================
// Custom hooks that provide data fetching with loading/error states.
// These hooks work seamlessly with both mock and real backend data.
//
// Usage in components:
// const { data, loading, error } = usePlayerStats('pete-alonso');
// ============================================================================

import { useState, useEffect } from 'react';
import type { PlayerProfile, ComparisonPlayer, TeamPayroll, PayrollProjection } from '../types';
import * as api from '../services/api';

// ============================================================================
// GENERIC DATA FETCHING HOOK
// ============================================================================

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for data fetching with loading/error states
 */
function useData<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = []
): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(api.handleApiError(err));
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// PLAYER DATA HOOKS
// ============================================================================

/**
 * Hook to fetch player statistics
 * 
 * @param playerId - Player identifier (e.g., 'pete-alonso')
 * @returns Player stats with loading/error states
 * 
 * @example
 * ```tsx
 * function PlayerStatsComponent() {
 *   const { data, loading, error } = usePlayerStats('pete-alonso');
 *   
 *   if (loading) return <Skeleton />;
 *   if (error) return <Error message={error} />;
 *   
 *   return <div>{data.name}: {data.advanced.war} WAR</div>;
 * }
 * ```
 */
export function usePlayerStats(playerId: string): UseDataResult<PlayerProfile> {
  return useData(
    () => api.fetchPlayerStats(playerId),
    [playerId]
  );
}

/**
 * Hook to fetch player comparisons
 * 
 * @param playerId - Player identifier
 * @returns Market comparable players with loading/error states
 * 
 * @example
 * ```tsx
 * function ComparisonsComponent() {
 *   const { data, loading } = usePlayerComparisons('pete-alonso');
 *   
 *   if (loading) return <Loading />;
 *   
 *   return (
 *     <div>
 *       {data?.map(player => (
 *         <CompCard key={player.player} player={player} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlayerComparisons(playerId: string): UseDataResult<ComparisonPlayer[]> {
  return useData(
    () => api.fetchPlayerComparisons(playerId),
    [playerId]
  );
}

// ============================================================================
// TEAM DATA HOOKS
// ============================================================================

/**
 * Hook to fetch team payroll data
 * 
 * @param teamId - Team identifier (e.g., 'NYM')
 * @param year - Optional year (defaults to current)
 * @returns Team payroll data with loading/error states
 */
export function useTeamPayroll(teamId: string, year?: number): UseDataResult<TeamPayroll> {
  return useData(
    () => api.fetchTeamPayroll(teamId, year),
    [teamId, year]
  );
}

/**
 * Hook to fetch payroll projections
 * 
 * @param teamId - Team identifier
 * @param contractYears - Number of contract years
 * @param yearlyImpact - Array of yearly contract impacts
 * @returns Payroll projections with loading/error states
 */
export function usePayrollProjections(
  teamId: string,
  contractYears: number,
  yearlyImpact: number[]
): UseDataResult<PayrollProjection[]> {
  return useData(
    () => api.fetchPayrollProjections(teamId, contractYears, yearlyImpact),
    [teamId, contractYears, JSON.stringify(yearlyImpact)]
  );
}

// ============================================================================
// COMBINED DATA HOOKS
// ============================================================================

/**
 * Hook that combines player stats and comparisons
 * Useful for pages that need both datasets
 * 
 * @param playerId - Player identifier
 * @returns Combined data with loading/error states
 */
export function usePlayerFullProfile(playerId: string) {
  const stats = usePlayerStats(playerId);
  const comparisons = usePlayerComparisons(playerId);

  return {
    stats: stats.data,
    comparisons: comparisons.data,
    loading: stats.loading || comparisons.loading,
    error: stats.error || comparisons.error,
    refetch: async () => {
      await Promise.all([stats.refetch(), comparisons.refetch()]);
    },
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to check API health status
 * Useful for displaying connection status to users
 */
export function useApiHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      setChecking(true);
      const healthy = await api.checkApiHealth();
      setIsHealthy(healthy);
      setChecking(false);
    }
    
    checkHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, checking };
}

/**
 * Hook to get current data mode (mock vs real)
 * Useful for debugging or displaying data source to users
 */
export function useDataMode() {
  return {
    isMockMode: api.USE_MOCK_DATA,
    mode: api.USE_MOCK_DATA ? 'mock' : 'production',
  };
}
