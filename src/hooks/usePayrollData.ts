import { useState, useEffect } from 'react';
import { loadPayrollData, getTeamPayrollData, getAvailableTeams, type TeamPayrollData } from '../services/payrollDataService';

const STORAGE_KEY = 'selectedTeamId';

// Get initial team ID from localStorage or default to Red Sox
function getInitialTeamId(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  }
  return 'BOS'; // Default to Boston Red Sox
}

export function usePayrollData() {
  const [payrollData, setPayrollData] = useState<TeamPayrollData[]>([]);
  const [selectedTeamId, setSelectedTeamIdState] = useState<string>(getInitialTeamId());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wrapper function that also saves to localStorage
  const setSelectedTeamId = (teamId: string) => {
    setSelectedTeamIdState(teamId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, teamId);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await loadPayrollData();
        setPayrollData(data);
        
        // Get current selected team ID (from state, which was initialized from localStorage)
        const currentTeamId = selectedTeamId;
        
        // If selected team doesn't exist in data, select first available team
        if (data.length > 0 && !data.find(t => t.teamId === currentTeamId)) {
          setSelectedTeamId(data[0].teamId);
        } else if (data.length === 0) {
          // If no data loaded, set error but allow fallback
          setError('No payroll data available. Using default values.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payroll data');
        console.error('Error loading payroll data:', err);
        // Don't prevent the component from rendering with fallback data
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const selectedTeamData = selectedTeamId 
    ? getTeamPayrollData(payrollData, selectedTeamId)
    : undefined;

  const availableTeams = getAvailableTeams(payrollData);

  return {
    payrollData,
    selectedTeamId,
    setSelectedTeamId,
    selectedTeamData,
    availableTeams,
    loading,
    error,
  };
}