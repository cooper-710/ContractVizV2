// ============================================================================
// API SERVICE - MAIN INTEGRATION POINT
// ============================================================================
// This is the main API service file that coordinates all data fetching.
// When integrating with a real backend, update the BASE_URL and implement
// proper authentication, error handling, and request/response interceptors.
//
// BACKEND INTEGRATION CHECKLIST:
// ☐ Update API_BASE_URL with your backend URL
// ☐ Implement authentication (add auth tokens to requests)
// ☐ Add proper error handling and user-friendly error messages
// ☐ Implement request/response interceptors for logging
// ☐ Add loading states and caching if needed
// ☐ Set up environment variables for different environments (dev/staging/prod)
// ============================================================================

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Base URL for API requests
 * 
 * PRODUCTION SETUP:
 * - Use environment variable: import.meta.env.VITE_API_URL
 * - Set different URLs for dev/staging/production
 * - Create a .env file with VITE_API_URL=your-api-url
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * API timeout in milliseconds
 */
const API_TIMEOUT = 30000;

/**
 * Enable/disable mock mode
 * When true, uses local mock data services instead of real API calls
 */
const USE_MOCK_DATA = true; // Set to false when backend is ready

// ============================================================================
// HTTP CLIENT
// ============================================================================

/**
 * Generic fetch wrapper with error handling
 * 
 * @param endpoint - API endpoint (e.g., '/players/pete-alonso')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise with typed response
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add authentication token if available
  // BACKEND INTEGRATION: Implement your auth strategy here
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
}

/**
 * GET request helper
 */
export async function get<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function post<T>(endpoint: string, data: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request helper
 */
export async function put<T>(endpoint: string, data: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export async function del<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Gets authentication token from storage
 * 
 * BACKEND INTEGRATION:
 * Implement your authentication strategy:
 * - JWT tokens
 * - OAuth
 * - API keys
 * - Session-based auth
 */
function getAuthToken(): string | null {
  // Example: return localStorage.getItem('auth_token');
  return null;
}

/**
 * Sets authentication token in storage
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * Clears authentication token
 */
export function clearAuthToken(): void {
  localStorage.removeItem('auth_token');
}

// ============================================================================
// MOCK DATA INTEGRATION
// ============================================================================

/**
 * Import mock data services
 * These are used when USE_MOCK_DATA is true
 */
import * as playerDataService from './playerDataService';
import * as teamDataService from './teamDataService';
import type { PlayerProfile, ComparisonPlayer, TeamPayroll, PayrollProjection } from '../types';

/**
 * Fetch player statistics
 * Routes to mock service or real API based on USE_MOCK_DATA flag
 */
export async function fetchPlayerStats(playerId: string): Promise<PlayerProfile> {
  if (USE_MOCK_DATA) {
    return playerDataService.getPlayerStats(playerId);
  }
  
  return get<PlayerProfile>(`/players/${playerId}`);
}

/**
 * Fetch player comparisons
 */
export async function fetchPlayerComparisons(playerId: string): Promise<ComparisonPlayer[]> {
  if (USE_MOCK_DATA) {
    return playerDataService.getPlayerComparisons(playerId);
  }
  
  return get<ComparisonPlayer[]>(`/players/${playerId}/comparisons`);
}

/**
 * Fetch team payroll data
 */
export async function fetchTeamPayroll(teamId: string, year?: number): Promise<TeamPayroll> {
  if (USE_MOCK_DATA) {
    return teamDataService.getTeamPayroll(teamId, year);
  }
  
  const yearParam = year ? `?year=${year}` : '';
  return get<TeamPayroll>(`/teams/${teamId}/payroll${yearParam}`);
}

/**
 * Fetch payroll projections
 */
export async function fetchPayrollProjections(
  teamId: string,
  contractYears: number,
  yearlyImpact: number[]
): Promise<PayrollProjection[]> {
  if (USE_MOCK_DATA) {
    return teamDataService.getPayrollProjections(teamId, contractYears, yearlyImpact);
  }
  
  return post<PayrollProjection[]>(`/teams/${teamId}/payroll/projections`, {
    contractYears,
    yearlyImpact,
  });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handles API errors and returns user-friendly messages
 */
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You do not have permission to access this resource.';
      case 404:
        return 'The requested data was not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export { USE_MOCK_DATA };

/**
 * Health check - verifies API is reachable
 */
export async function checkApiHealth(): Promise<boolean> {
  if (USE_MOCK_DATA) {
    return true;
  }
  
  try {
    await get('/health');
    return true;
  } catch {
    return false;
  }
}
