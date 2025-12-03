# iCattle Dashboard - Project TODO

## Phase 1: Database Schema & Architecture ✅
- [x] Design livestock digital twin schema
- [x] Design lifecycle events schema
- [x] Design valuation history schema
- [x] Design client/producer accounts schema
- [x] Design financial reports schema
- [x] Create database migrations

## Phase 2: Dashboard UI ✅
- [x] Build portfolio overview page
- [x] Build cattle digital twin list view
- [x] Build client/producer management
- [x] Add navigation and layout
- [ ] Build individual cattle detail page (future enhancement)

## Phase 3: Real-Time Features ✅
- [x] Implement real-time valuation updates
- [x] Build lifecycle event timeline
- [x] Integrate MLA market data (simulated)
- [ ] Add event creation forms (future enhancement)

## Phase 4: Financial Reports ✅
- [x] Build balance sheet report
- [x] Build P&L statement
- [x] Build portfolio analytics
- [x] Add valuation trend charts
- [ ] Add export functionality (future enhancement)

## Phase 5: Demo Data & Testing ✅
- [x] Generate realistic demo cattle data (60 cattle)
- [x] Generate demo clients/producers (3 clients)
- [x] Generate lifecycle events (397 events)
- [x] Generate valuation history (442 valuations)
- [x] Generate market data (240 data points)
- [x] Write comprehensive test suite (35 tests, all passing)
- [x] Test complete workflow

## 🎯 Current Status: Demo Ready!

### Completed Features
- ✅ Home dashboard with real-time portfolio metrics ($213,085 total value)
- ✅ Cattle registry with 60 digital twins (biometric IDs, NLIS IDs, weights, valuations)
- ✅ Client management with 3 active clients (Riverina Pastoral, Gippsland Premium Beef, Darling Downs Wagyu)
- ✅ Bank-grade financial reports (Balance Sheet, P&L, Valuation Report)
- ✅ Search and filter functionality
- ✅ Breed distribution charts
- ✅ Cattle type distribution charts
- ✅ Health alerts monitoring (21 requiring attention)
- ✅ Recent events timeline
- ✅ Compliance badges (APRA, Blockchain Verified)
- ✅ All tests passing (35/35)

### Future Enhancements
- [ ] Individual cattle detail pages with full lifecycle timeline
- [ ] Individual client detail pages with portfolio analytics
- [ ] PDF/CSV export functionality
- [ ] Real-time WebSocket updates
- [ ] Integration with production TuringCore-v3
- [ ] Integration with real RedBelly blockchain
- [ ] Mobile optimization and PWA features
- [ ] Multi-tenant authentication
- [ ] Role-based access control


## 📄 PDF Export Feature (In Progress)
- [ ] Install PDF generation dependencies (jsPDF, html2canvas)
- [ ] Create server-side PDF generation functions for Balance Sheet
- [ ] Create server-side PDF generation functions for P&L Statement
- [ ] Add tRPC procedures for PDF export
- [ ] Add export buttons to Reports page UI
- [ ] Test PDF export functionality
- [ ] Verify PDF formatting and bank-grade quality


## 🌾 Multi-View Architecture & AgriWebb Integration (In Progress)

### Database Schema Updates
- [ ] Add `agriwebbId` field to cattle table
- [ ] Add `agriwebbFarmId` field to clients table  
- [ ] Create `agriwebb_sync_status` table
- [ ] Add `role` field to users table (farmer, bank, investor, admin)
- [ ] Add `viewPreference` field to users table

### AgriWebb OAuth Integration
- [ ] Register with AgriWebb as Third-Party Partner
- [ ] Implement OAuth 2.0 authorization flow
- [ ] Create `/agriwebb/install` endpoint
- [ ] Create `/agriwebb/callback` endpoint
- [ ] Implement secure token storage (encrypted)
- [ ] Implement token refresh logic

### Data Sync Service
- [ ] Create GraphQL client for AgriWebb API
- [ ] Implement `syncAnimalsFromAgriWebb()` function
- [ ] Map AgriWebb data to iCattle schema
- [ ] Handle incremental updates (delta sync every 15 min)
- [ ] Implement conflict resolution (AgriWebb = source of truth for operational data)
- [ ] Add sync status indicators

### Farmer's Herd View
- [ ] Create farmer dashboard layout
- [ ] Display "Connect to AgriWebb" button
- [ ] Show AgriWebb sync status and last sync time
- [ ] Display cattle with AgriWebb sync badges
- [ ] Add operational focus (location, health, weights)
- [ ] Add manual sync trigger button
- [ ] Show paddock/field map view
- [ ] Add quick actions (record weight, health check, move cattle)

### Bank/Investor View
- [ ] Create bank/investor dashboard layout
- [ ] Focus on financial metrics and valuations
- [ ] Display portfolio performance charts
- [ ] Show compliance status (APRA, blockchain verification)
- [ ] Add risk assessment indicators
- [ ] Show loan-to-value ratios
- [ ] Add export to PDF functionality

### Role-Based Access Control
- [ ] Implement role-based routing
- [ ] Create role detection middleware
- [ ] Add view switching for admin users
- [ ] Implement data filtering by role
- [ ] Add permission checks for sensitive operations

### Testing
- [ ] Test OAuth flow end-to-end
- [ ] Test data sync with mock AgriWebb API
- [ ] Test role-based access control
- [ ] Test view switching
- [ ] Test conflict resolution scenarios


## 🗺️ Geotracking Map Feature
- [x] Add GPS coordinates fields to cattle table (latitude, longitude)
- [x] Add GPS coordinates to lifecycle events
- [x] Integrate Google Maps with cattle location markers
- [x] Add real-time cattle location tracking
- [x] Color-code markers by health status
- [x] Add click-to-view cattle details on map
- [x] Generate realistic GPS coordinates for demo data
- [x] Create CattleMap component with interactive markers
- [x] Add map to Farmer's Herd View
- [ ] Add clustering for dense areas (future enhancement)
- [ ] Add paddock boundary overlays (future enhancement)


## 🏦 Bank/Investor View
- [x] Create BankView page component
- [x] Add portfolio risk metrics (concentration risk, health risk, market risk)
- [x] Calculate and display loan-to-value (LTV) ratios
- [x] Add compliance status indicators (APRA, Basel III, blockchain verification)
- [x] Create valuation trend charts (6-month)
- [x] Add portfolio diversification metrics
- [x] Show unrealized gains/losses
- [x] Display collateral quality ratings
- [x] Add route to App.tsx
- [x] Add link from Home page
- [x] Add client portfolio breakdown with value distribution
- [x] Add risk rating badge (Low/Medium/High)
- [ ] Add stress testing scenarios (future enhancement)
- [ ] Add 12-month valuation trends (future enhancement)
