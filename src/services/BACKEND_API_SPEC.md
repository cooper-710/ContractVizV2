# Backend API Specification

Quick reference for backend developers implementing the API endpoints.

## Base URL

```
Production: https://api.yourproject.com/api
Development: http://localhost:3001/api
```

## Authentication

All requests should include:
```
Authorization: Bearer {token}
```

---

## Endpoints

### 1. Get Player Statistics

**Endpoint:** `GET /players/:playerId`

**Parameters:**
- `playerId` (path) - Player identifier (e.g., "pete-alonso")

**Response:** `200 OK`
```json
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
  "battedBall": {
    "exitVelo": 91.2,
    "hardHitPct": 47.8,
    "barrelPct": 12.4,
    "launchAngle": 14.2
  },
  "careerStats": [
    {
      "year": "2019",
      "war": 2.8,
      "wrcPlus": 139,
      "hr": 53,
      "xwoba": 0.360
    }
    // ... more years
  ],
  "battedBallTrend": [
    {
      "year": "2019",
      "war": 0,
      "wrcPlus": 0,
      "hr": 0,
      "xwoba": 0,
      "exitVelo": 89.8,
      "hardHitPct": 43.8,
      "barrelPct": 10.4
    }
    // ... more years
  ]
}
```

**Error Responses:**
- `404 Not Found` - Player not found
- `500 Internal Server Error` - Server error

---

### 2. Get Player Comparisons

**Endpoint:** `GET /players/:playerId/comparisons`

**Parameters:**
- `playerId` (path) - Player identifier

**Response:** `200 OK`
```json
[
  {
    "player": "Freeman",
    "age": 32,
    "position": "1B",
    "team": "LAD",
    "careerWar": 4.8,
    "careerWrcPlus": 140,
    "careerXwoba": 0.368,
    "careerHr": 26,
    "careerXslg": 0.495,
    "careerHardHitPct": 42.8,
    "careerBarrelPct": 9.2,
    "war2025": 5.2,
    "wrcPlus2025": 142,
    "xwoba2025": 0.372,
    "hr2025": 28,
    "xslg2025": 0.498,
    "hardHitPct2025": 43.5,
    "barrelPct2025": 9.5,
    "war3yr": 5.0,
    "wrcPlus3yr": 141,
    "xwoba3yr": 0.370,
    "hr3yr": 27,
    "xslg3yr": 0.496,
    "hardHitPct3yr": 43.1,
    "barrelPct3yr": 9.3,
    "warPreSign": 4.6,
    "wrcPlusPreSign": 135,
    "xwobaPreSign": 0.365,
    "hrPreSign": 25,
    "xslgPreSign": 0.492,
    "hardHitPctPreSign": 42.5,
    "barrelPctPreSign": 9.0,
    "aav": 27,
    "years": 6,
    "totalValue": 162,
    "signingYear": 2022
  }
  // ... more comparable players
]
```

**Notes:**
- Should return 4-6 comparable players
- Include the target player as first item in array
- Players should be similar position, age, and performance level

---

### 3. Get Team Payroll

**Endpoint:** `GET /teams/:teamId/payroll`

**Parameters:**
- `teamId` (path) - Team identifier (e.g., "NYM", "LAD")
- `year` (query, optional) - Year to fetch (defaults to current year)

**Example:** `GET /teams/NYM/payroll?year=2025`

**Response:** `200 OK`
```json
{
  "teamId": "NYM",
  "teamName": "New York Mets",
  "year": 2025,
  "basePayroll": 180,
  "luxuryTaxThreshold": 241
}
```

**Notes:**
- `basePayroll` in millions (USD)
- Represents team's current payroll before adding new player

---

### 4. Get Payroll Projections

**Endpoint:** `POST /teams/:teamId/payroll/projections`

**Parameters:**
- `teamId` (path) - Team identifier

**Request Body:**
```json
{
  "contractYears": 7,
  "yearlyImpact": [35, 35, 35, 35, 35, 35, 35]
}
```

**Response:** `200 OK`
```json
[
  {
    "year": 2025,
    "basePayroll": 180,
    "playerContract": 35,
    "totalPayroll": 215,
    "luxuryTaxStatus": "under"
  },
  {
    "year": 2026,
    "basePayroll": 185.4,
    "playerContract": 35,
    "totalPayroll": 220.4,
    "luxuryTaxStatus": "under"
  }
  // ... more years
]
```

**Luxury Tax Status Values:**
- `"under"` - Below luxury tax threshold
- `"tier1"` - 0-20M over threshold
- `"tier2"` - 20-40M over threshold
- `"tier3"` - 40M+ over threshold

**Notes:**
- Should calculate multi-year projections
- Account for expected payroll growth (~3% annually)
- Include luxury tax implications

---

### 5. Get Luxury Tax Thresholds

**Endpoint:** `GET /league/luxury-tax-thresholds/:year`

**Parameters:**
- `year` (path) - Season year

**Example:** `GET /league/luxury-tax-thresholds/2025`

**Response:** `200 OK`
```json
{
  "year": 2025,
  "threshold": 241,
  "tier1": 261,
  "tier2": 281,
  "tier3": 301
}
```

**Notes:**
- All values in millions (USD)
- Thresholds should be current MLB CBT levels

---

### 6. Health Check (Optional)

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

---

## Data Types Reference

### Numbers
- All dollar amounts are in **millions** (e.g., 27 = $27M)
- Stats are decimals where appropriate (e.g., avg: 0.240, not 240)
- Ages are integers
- Years are integers

### Dates
- Use ISO 8601 format: `"2025-01-15T10:30:00Z"`
- Or simple year strings for seasons: `"2025"`

### Player Identifiers
- Use lowercase with hyphens: `"pete-alonso"`
- Or numeric IDs if preferred: `"12345"`
- Must be consistent across all endpoints

### Team Identifiers
- Use standard 3-letter codes: `"NYM"`, `"LAD"`, `"BOS"`
- Or full names: `"new-york-mets"`

---

## Error Responses

All errors should follow this format:

```json
{
  "success": false,
  "error": "Player not found",
  "statusCode": 404,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Recommended rate limits:
- 1000 requests per hour per IP
- 100 requests per minute per user

Headers to include:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

---

## CORS Configuration

Allow these origins:
- Development: `http://localhost:3000`
- Staging: `https://staging.yourproject.com`
- Production: `https://yourproject.com`

Required headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Data Freshness

Recommended cache/update frequencies:

| Data Type | Update Frequency | Cache Duration |
|-----------|------------------|----------------|
| Player Stats | After each game | 1 hour |
| Comparisons | Weekly | 24 hours |
| Team Payroll | Monthly | 24 hours |
| Luxury Tax Thresholds | Annually | 7 days |

---

## Testing Endpoints

### Using cURL

```bash
# Get player stats
curl -X GET https://api.yourproject.com/api/players/pete-alonso \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get comparisons
curl -X GET https://api.yourproject.com/api/players/pete-alonso/comparisons \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get team payroll
curl -X GET https://api.yourproject.com/api/teams/NYM/payroll?year=2025 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Post payroll projections
curl -X POST https://api.yourproject.com/api/teams/NYM/payroll/projections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contractYears": 7, "yearlyImpact": [35, 35, 35, 35, 35, 35, 35]}'
```

---

## TypeScript Types

All TypeScript type definitions are available in:
```
/types/index.ts
```

Import and use these types in your backend (if using TypeScript):
```typescript
import type { PlayerProfile, ComparisonPlayer, TeamPayroll } from './types';
```

---

## Questions?

- Frontend types: See `/types/index.ts`
- Integration guide: See `/services/README.md`
- Example usage: See `/services/INTEGRATION_EXAMPLE.md`

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-15
