# Data Service Layer - Backend Integration Guide

This directory contains the data service layer that abstracts all data fetching and business logic. The application is designed to seamlessly transition from mock data to real backend integration.

## 📁 File Structure

```
/services/
├── api.ts                          # Main API client and integration point
├── playerDataService.ts            # Player statistics and comparisons
├── teamDataService.ts              # Team payroll and financial data
├── contractCalculationService.ts   # Contract calculations (can stay client-side)
└── README.md                       # This file
```

## 🔄 Current State: Mock Data Mode

The application currently runs in **MOCK DATA MODE**. All data is generated locally using realistic placeholder values.

- `USE_MOCK_DATA = true` in `/services/api.ts`
- Mock data functions return properly typed data matching the expected API structure
- All TypeScript types are defined in `/types/index.ts`

## 🚀 Backend Integration Steps

### Step 1: Set Up Environment Variables

Create a `.env` file in your project root:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

### Step 2: Switch to Real API Mode

In `/services/api.ts`, change:

```typescript
const USE_MOCK_DATA = true;  // Change to false
```

### Step 3: Implement Required API Endpoints

Your backend must implement these endpoints matching the TypeScript types:

#### Player Statistics API
```
GET /api/players/:playerId
Response: PlayerProfile

GET /api/players/:playerId/comparisons
Response: ComparisonPlayer[]
```

#### Team Data API
```
GET /api/teams/:teamId/payroll?year=2025
Response: TeamPayroll

POST /api/teams/:teamId/payroll/projections
Body: { contractYears: number, yearlyImpact: number[] }
Response: PayrollProjection[]
```

#### Optional: Contract Calculations API
```
POST /api/contracts/calculate
Body: ContractTerms
Response: ContractCalculations
```
*Note: Contract calculations can remain client-side for real-time interactivity*

### Step 4: Add Authentication (If Required)

Update the `getAuthToken()` function in `/services/api.ts`:

```typescript
function getAuthToken(): string | null {
  // Your auth implementation
  return localStorage.getItem('auth_token');
}
```

Add authentication to your API requests (already scaffolded in the code).

### Step 5: Error Handling

The `handleApiError()` function in `/services/api.ts` provides user-friendly error messages. Customize based on your backend's error response format.

## 📊 Data Contracts (TypeScript Types)

All data types are defined in `/types/index.ts`. Your backend responses MUST match these types exactly:

### Core Types

- **PlayerProfile** - Complete player statistical profile with career data
- **ComparisonPlayer** - Market comp player with contract details
- **ContractTerms** - All contract parameters and options
- **ContractCalculations** - Calculated contract values and breakdowns
- **TeamPayroll** - Team financial snapshot
- **PayrollProjection** - Multi-year payroll forecast

### Example: PlayerProfile Response

```typescript
{
  "playerId": "pete-alonso",
  "name": "Pete Alonso",
  "position": "1B",
  "age": 30,
  "traditional": {
    "avg": 0.240,
    "hr": 46,
    "rbi": 118,
    "ops": 0.788
  },
  "advanced": {
    "xwoba": 0.342,
    "xslg": 0.512,
    "wrcPlus": 124,
    "war": 3.8,
    "wpa": 2.4
  },
  // ... see /types/index.ts for complete structure
}
```

## 🔧 Service Layer Functions

### Player Data Service (`playerDataService.ts`)

| Function | Purpose | Backend Endpoint |
|----------|---------|------------------|
| `getPlayerStats(playerId)` | Fetch player statistics | `GET /api/players/:playerId` |
| `getPlayerComparisons(playerId)` | Fetch market comps | `GET /api/players/:playerId/comparisons` |

### Team Data Service (`teamDataService.ts`)

| Function | Purpose | Backend Endpoint |
|----------|---------|------------------|
| `getTeamPayroll(teamId, year)` | Get team payroll | `GET /api/teams/:teamId/payroll` |
| `getPayrollProjections(...)` | Generate projections | `POST /api/teams/:teamId/payroll/projections` |
| `getLuxuryTaxThreshold(year)` | Get CBT threshold | `GET /api/league/luxury-tax-thresholds/:year` |

### Contract Calculation Service (`contractCalculationService.ts`)

| Function | Purpose | Notes |
|----------|---------|-------|
| `calculateContractBreakdown(terms)` | Calculate contract financials | Can stay client-side |
| `validateContractTerms(terms)` | Validate contract rules | Should match backend CBA rules |
| `compareToMarket(...)` | Compare to market comps | Optional backend integration |

## 🧪 Testing the Integration

### Test with Mock Data First
```typescript
// In api.ts, ensure USE_MOCK_DATA = true
import { fetchPlayerStats } from './services/api';

const stats = await fetchPlayerStats('pete-alonso');
console.log(stats); // Should return mock data
```

### Test Real API
```typescript
// Set USE_MOCK_DATA = false in api.ts
// Ensure backend is running and NEXT_PUBLIC_API_URL is set

const stats = await fetchPlayerStats('pete-alonso');
// Should fetch from real backend
```

### Health Check
```typescript
import { checkApiHealth } from './services/api';

const isHealthy = await checkApiHealth();
console.log('API Status:', isHealthy ? 'Connected' : 'Offline');
```

## 🎯 Component Integration

Components are already set up to use the service layer. Example from `PlayerStats.tsx`:

```typescript
import { fetchPlayerStats } from '../services/api';

// Inside component
useEffect(() => {
  async function loadData() {
    const stats = await fetchPlayerStats('pete-alonso');
    setPlayerData(stats);
  }
  loadData();
}, []);
```

**NO COMPONENT CHANGES NEEDED** when switching from mock to real data!

## 🔐 Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Environment Variables**: Use `.env` files (add to `.gitignore`)
3. **Authentication**: Implement proper token management
4. **CORS**: Ensure backend allows requests from your frontend domain
5. **Rate Limiting**: Implement appropriate rate limiting on backend

## 📝 Best Practices

### Frontend (Current Implementation)
- ✅ All data access through service layer
- ✅ TypeScript types for all data structures
- ✅ Mock data matches real data structure exactly
- ✅ Error handling in place
- ✅ Loading states ready (add to components as needed)

### Backend (Your Implementation)
- ⚠️ Return data matching TypeScript types exactly
- ⚠️ Implement proper error responses (4xx, 5xx status codes)
- ⚠️ Use consistent date formats (ISO 8601 recommended)
- ⚠️ Include pagination for large datasets
- ⚠️ Add caching where appropriate (player stats don't change frequently)
- ⚠️ Validate all input data
- ⚠️ Use proper HTTP methods (GET for reads, POST for writes)

## 🐛 Debugging

### Check Current Mode
```typescript
import { USE_MOCK_DATA } from './services/api';
console.log('Mock Mode:', USE_MOCK_DATA);
```

### Enable Request Logging
Add to `api.ts` before making requests:
```typescript
console.log('API Request:', method, url, body);
```

### Inspect Mock Data
All mock data is in:
- `/services/playerDataService.ts` - Player and comparison data
- `/services/teamDataService.ts` - Team payroll data

## 📊 Data Volume Estimates

Based on the current application:

| Data Type | Records | Update Frequency | Size Estimate |
|-----------|---------|------------------|---------------|
| Player Profile | ~1 per player | Daily during season | ~5 KB |
| Career Stats | 6 years per player | After each game | ~2 KB |
| Comparisons | ~5 per query | Weekly | ~25 KB |
| Team Payroll | ~30 teams | Monthly | ~10 KB |
| Projections | Per contract config | Real-time calc | ~5 KB |

## 🔄 Migration Checklist

- [ ] Backend API endpoints implemented
- [ ] API returning data matching TypeScript types
- [ ] Environment variables configured
- [ ] `USE_MOCK_DATA` set to `false`
- [ ] Authentication implemented (if required)
- [ ] Error handling tested
- [ ] CORS configured on backend
- [ ] API health check passing
- [ ] All screens tested with real data
- [ ] Loading states added to components
- [ ] Error states handled in UI

## 💡 Tips

1. **Gradual Migration**: You can switch one service at a time by checking `USE_MOCK_DATA` per function
2. **Hybrid Mode**: Keep mock data as fallback if API fails
3. **Development**: Use mock data in development, real API in production
4. **Type Safety**: TypeScript will catch any data structure mismatches immediately

## 📞 Support

When integrating with backend:
1. Ensure TypeScript types match exactly (`/types/index.ts`)
2. Test each endpoint individually before switching `USE_MOCK_DATA`
3. Check browser console for API errors
4. Verify response structure matches expected types

---

**Ready for Backend Integration!** Just flip `USE_MOCK_DATA` to `false` and point to your API. 🚀
