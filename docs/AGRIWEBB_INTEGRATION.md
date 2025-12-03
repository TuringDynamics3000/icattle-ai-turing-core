# AgriWebb Integration Plan

## Overview

AgriWebb is a comprehensive livestock management platform used by farmers/producers to track their herds. Integration with AgriWebb will allow iCattle to sync real-time livestock data from farmers' existing systems, providing a seamless experience.

## API Architecture

- **Authentication**: OAuth 2.0 Authorization Code Grant
- **API Type**: GraphQL over HTTPS
- **Base URL**: `https://api.agriwebb.com/v2`
- **Required Scope**: `read:animals` (for livestock data)

## Key API Endpoints

### Animals Query

```graphql
animals(
  farmId: String!
  filter: AnimalFilter
  sort: [AnimalSort!]
  limit: Int
  skip: Int
  observationDate: Timestamp
  _capabilities: [String]
): [Animal]
```

**Returns**: Array of Animal objects containing:
- **AnimalCharacteristics**: Breed, sex, birth date, visual ID
- **Parentage**: Sire/dam information
- **AnimalState**: Current location, status, health
- **Records**: Weight records, health events, treatments, feed records

### Other Relevant Queries

- `animalsWithCount`: Get animals with total count
- `farms`: Get farm information
- `enterprises`: Get enterprise/business details
- `managementGroups`: Get mob/group information
- `fields`: Get paddock/field data

## Integration Requirements

### Registration with AgriWebb

To integrate, we need to register as a Third-Party Partner:

1. **Client Name**: "iCattle"
2. **Description**: "Livestock asset management and valuation platform providing bank-grade financial reporting"
3. **Homepage URL**: TBD
4. **Logo**: iCattle logo
5. **Install URL**: `https://<domain>/agriwebb/install`
6. **Redirect URL**: `https://<domain>/agriwebb/callback`

AgriWebb will provide:
- **Client ID**
- **Client Secret** (must be stored securely)

### OAuth 2.0 Flow

1. User initiates connection from iCattle dashboard
2. Redirect to AgriWebb authorization endpoint
3. User grants permission in AgriWebb
4. AgriWebb redirects back with authorization code
5. Exchange code for access token
6. Store token securely for API requests

## Data Mapping

### AgriWebb → iCattle Schema

| AgriWebb Field | iCattle Field | Notes |
|----------------|---------------|-------|
| `id` | `agriwebbId` | Store external ID |
| `visualId` | `visualId` | Farmer's visual tag |
| `characteristics.breed` | `breed` | Breed name |
| `characteristics.sex` | `sex` | bull/steer/cow/heifer |
| `characteristics.birthDate` | `dateOfBirth` | Birth date |
| `state.currentLocation` | `currentLocation` | Paddock/field |
| `state.currentWeight` | `currentWeight` | Latest weight |
| `state.healthStatus` | `healthStatus` | Health status |
| `records.weights[]` | `weight_events` | Weight history |
| `records.treatments[]` | `health_events` | Health records |

## Implementation Plan

### Phase 1: Database Schema Updates

- [ ] Add `agriwebbId` field to cattle table
- [ ] Add `agriwebbFarmId` field to clients table
- [ ] Create `agriwebb_sync_status` table
- [ ] Create `agriwebb_tokens` table (encrypted)

### Phase 2: OAuth Integration

- [ ] Register with AgriWebb as partner
- [ ] Implement OAuth 2.0 authorization flow
- [ ] Create `/agriwebb/install` endpoint
- [ ] Create `/agriwebb/callback` endpoint
- [ ] Implement token storage and refresh logic

### Phase 3: Data Sync Service

- [ ] Create GraphQL client for AgriWebb API
- [ ] Implement `syncAnimalsFromAgriWebb()` function
- [ ] Map AgriWebb data to iCattle schema
- [ ] Handle incremental updates (delta sync)
- [ ] Implement conflict resolution strategy

### Phase 4: Farmer View UI

- [ ] Create farmer dashboard layout
- [ ] Display AgriWebb sync status
- [ ] Show "Connect to AgriWebb" button
- [ ] Display synced cattle with AgriWebb badge
- [ ] Add manual sync trigger
- [ ] Show last sync timestamp

### Phase 5: Multi-View Architecture

- [ ] Implement role-based routing
- [ ] Create farmer view (operational focus)
- [ ] Create bank/investor view (financial focus)
- [ ] Create admin view (full access)

## Sync Strategy

### Initial Sync

1. User connects AgriWebb account
2. Fetch all animals from AgriWebb
3. Create new cattle records in iCattle
4. Link existing cattle by NLIS ID or visual ID
5. Import historical weight/health records

### Incremental Sync

- Run sync every 15 minutes (configurable)
- Use `observationDate` parameter for delta sync
- Update changed records only
- Handle deletions (mark as sold/deceased)

### Conflict Resolution

- **AgriWebb is source of truth** for operational data (location, weight, health)
- **iCattle is source of truth** for financial data (valuations, market prices)
- Never overwrite iCattle financial data from AgriWebb
- Log conflicts for manual review

## Security Considerations

- Store OAuth tokens encrypted in database
- Use environment variables for Client ID/Secret
- Implement token refresh before expiry
- Log all API requests for audit trail
- Rate limit sync operations
- Validate all incoming data

## Testing Strategy

- [ ] Mock AgriWebb API responses
- [ ] Test OAuth flow end-to-end
- [ ] Test data mapping accuracy
- [ ] Test sync with large datasets (1000+ animals)
- [ ] Test conflict resolution scenarios
- [ ] Test token refresh logic

## Future Enhancements

- Bi-directional sync (write back to AgriWebb)
- Real-time webhooks (if AgriWebb supports)
- Sync management groups/mobs
- Sync paddock/field data
- Sync treatment protocols
- Sync breeding records
