# iCattle.ai International Deployment Architecture

**Multi-Region, Multi-Standard Livestock Management Platform**

Supports both US (USDA/CME) and Australian (MSA/EYCI) markets with automatic routing and unified API.

---

## 🌍 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GLOBAL LOAD BALANCER                            │
│                    (GeoDNS + Anycast Routing)                           │
└────────────────────┬────────────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐    ┌────────▼─────────┐
│   US REGION      │    │   AU REGION      │
│   (us-central1)  │    │   (ap-southeast2)│
└───────┬──────────┘    └────────┬─────────┘
        │                         │
┌───────▼──────────────────────────▼─────────┐
│      INTERNATIONAL API GATEWAY              │
│    (Automatic Market Detection)             │
│                                             │
│  ┌─────────────┐      ┌─────────────┐     │
│  │ US Routing  │      │ AU Routing  │     │
│  │ USDA/CME    │      │ MSA/EYCI    │     │
│  └──────┬──────┘      └──────┬──────┘     │
│         │                     │             │
│  ┌──────▼──────┐      ┌──────▼──────┐     │
│  │ US Services │      │ AU Services │     │
│  │ - Grading   │      │ - Grading   │     │
│  │ - Pricing   │      │ - Pricing   │     │
│  │ - Valuation │      │ - Valuation │     │
│  └──────┬──────┘      └──────┬──────┘     │
└─────────┼──────────────────────┼───────────┘
          │                      │
    ┌─────▼──────┐         ┌────▼──────┐
    │ US Database│         │AU Database│
    │ PostgreSQL │         │PostgreSQL │
    │ (us-central1)        │(ap-southeast2)
    └────────────┘         └───────────┘
          │                      │
    ┌─────▼──────┐         ┌────▼──────┐
    │ US Event   │         │AU Event   │
    │ Stream     │         │Stream     │
    │ (Kafka)    │         │(Kafka)    │
    └────────────┘         └───────────┘
```

---

## 🗺️ Geographic Distribution

### US Region (Primary)

**Cloud Provider:** AWS us-east-1 or GCP us-central1  
**Coverage:** United States, Canada, Mexico  
**Data Centers:**
- Primary: Iowa (us-central1)
- Secondary: Virginia (us-east-1)
- Tertiary: California (us-west1)

**Services:**
- USDA grading API
- CME market data integration
- USDA AMS pricing
- Imperial unit processing
- USD currency handling

### Australian Region (Primary)

**Cloud Provider:** AWS ap-southeast-2 or GCP australia-southeast1  
**Coverage:** Australia, New Zealand, Pacific Islands  
**Data Centers:**
- Primary: Sydney (ap-southeast-2)
- Secondary: Melbourne (ap-southeast-4)

**Services:**
- MSA grading API
- EYCI market data integration
- NLRS pricing
- Metric unit processing
- AUD currency handling

### Global Services (Both Regions)

**Shared Infrastructure:**
- Global load balancer (Cloudflare, AWS Global Accelerator)
- CDN for dashboard (Cloudflare, AWS CloudFront)
- Monitoring (Datadog, New Relic)
- Logging (ELK Stack, Splunk)

---

## 🔀 Automatic Market Detection

### Detection Methods (Priority Order)

1. **Explicit Market Parameter**
   ```json
   {
     "market": "US"  // or "AU"
   }
   ```

2. **Animal ID Format**
   - NLIS 16-digit (982 000XXXXXXXXX) → AU
   - Other formats → US

3. **Tenant ID Prefix**
   - `AU-*`, `QPIC-*`, `NPIC-*` → AU
   - `US-*`, `OWNER-*` → US

4. **GPS Coordinates**
   - Latitude -10° to -44°, Longitude 113° to 154° → AU
   - Latitude 24° to 49°, Longitude -125° to -66° → US

5. **Default Fallback**
   - US (if all detection methods fail)

---

## 📊 Data Synchronization

### Event Replication

**Strategy:** Multi-region event sourcing with eventual consistency

```
US Region Event Store ←──────→ AU Region Event Store
         │                              │
         ├─ US Read Models              ├─ AU Read Models
         ├─ US Analytics                ├─ AU Analytics
         └─ US Reporting                └─ AU Reporting
```

**Replication:**
- Asynchronous replication via Kafka
- 5-second typical lag
- Conflict resolution: Last-write-wins with timestamp
- Cross-region queries supported

### Database Architecture

**Per-Region Databases:**
```sql
-- US Database (PostgreSQL)
icattle_us_db
  ├─ animal_grading_events_us
  ├─ physical_measurement_events_us
  ├─ market_valuation_events_us
  └─ animal_profiles_us

-- AU Database (PostgreSQL)
icattle_au_db
  ├─ msa_grading_events
  ├─ physical_measurement_events_au
  ├─ market_valuation_events_au
  └─ animal_profiles_au

-- Global Database (PostgreSQL)
icattle_global_db
  ├─ tenants
  ├─ users
  ├─ api_keys
  └─ audit_log
```

---

## 🌐 API Routing

### Unified Endpoints

**Base URL:** `https://api.icattle.ai`

**Automatic Routing:**
```
POST /api/v1/livestock/grading
├─ Detect market from request
├─ Route to US or AU service
└─ Return unified response

POST /api/v1/livestock/valuation
├─ Detect market from coordinates
├─ Fetch appropriate market prices
└─ Return value in both USD and AUD
```

### Region-Specific Endpoints (Optional)

**US Endpoint:** `https://us.api.icattle.ai`
```
POST /api/v1/livestock/grading
- Forces US market
- USDA grading only
- Imperial units
- USD currency
```

**AU Endpoint:** `https://au.api.icattle.ai`
```
POST /api/v1/livestock/grading
- Forces AU market
- MSA grading only
- Metric units
- AUD currency
```

---

## 💱 Currency & Unit Handling

### Automatic Conversion

**Storage:** All data stored in both unit systems
```json
{
  "weight_kg": 450.0,
  "weight_lbs": 992.1,
  "temperature_c": 38.5,
  "temperature_f": 101.3,
  "value_usd": 1850.00,
  "value_aud": 2812.00
}
```

**API Response:** Returns both units
```json
{
  "weight": {
    "kg": 450.0,
    "lbs": 992.1,
    "display": "450.0 kg (992.1 lbs)"
  },
  "value": {
    "usd": 1850.00,
    "aud": 2812.00,
    "display": "$1,850 USD ($2,812 AUD)"
  }
}
```

### Exchange Rate Service

**Real-time FX Rates:**
- Source: Reserve Bank of Australia (RBA) + Federal Reserve (FRED)
- Update Frequency: Every 15 minutes
- Fallback: Static rates if API unavailable
- Cache: 15-minute TTL

**Demo Rates (2025):**
- 1 USD = 1.52 AUD
- 1 AUD = 0.658 USD

---

## 🔐 Security & Compliance

### Turing Protocol Enforcement

**All Regions:**
- 5 required headers on every request
- Bank-grade auditability
- Complete traceability
- Regulatory compliance

**Headers:**
```
X-Tenant-ID: OWNER-001 (US) or AU-QPIC12345 (AU)
X-Request-ID: UUID
X-User-ID: user_identifier
X-Device-ID: device_identifier
X-Geo-Location: latitude,longitude
```

### Data Residency

**US Data:**
- Stored in US data centers only
- Complies with US data protection laws
- USDA regulatory compliance

**Australian Data:**
- Stored in Australian data centers only
- Complies with Australian Privacy Act
- NLIS/LPA regulatory compliance

**Cross-Region:**
- Metadata only (no PII)
- Aggregated analytics
- Market intelligence

---

## 📈 Scaling Strategy

### Horizontal Scaling

**API Gateway:**
- Auto-scaling: 2-20 instances per region
- Load balancer: Round-robin with health checks
- Target: <100ms latency

**Event Processors:**
- Kafka consumer groups
- Parallel processing
- Target: 1000 events/second per region

**Databases:**
- Read replicas: 2-4 per region
- Connection pooling: 100 connections per instance
- Sharding: By tenant_id

### Vertical Scaling

**Production Sizing:**
```
API Gateway:
  - 4 vCPU, 8GB RAM
  - 100GB SSD
  - 1Gbps network

Database:
  - 8 vCPU, 32GB RAM
  - 1TB SSD (IOPS optimized)
  - 10Gbps network

Event Stream:
  - 4 vCPU, 16GB RAM
  - 500GB SSD
  - 10Gbps network
```

---

## 🚀 Deployment Process

### Infrastructure as Code

**Terraform Configuration:**
```hcl
# US Region
module "us_region" {
  source = "./modules/region"
  
  region = "us-central1"
  market = "US"
  
  api_instances = 4
  db_size = "db-n1-highmem-8"
  kafka_nodes = 3
}

# AU Region
module "au_region" {
  source = "./modules/region"
  
  region = "ap-southeast-2"
  market = "AU"
  
  api_instances = 4
  db_size = "db-n1-highmem-8"
  kafka_nodes = 3
}

# Global Load Balancer
resource "google_compute_global_forwarding_rule" "default" {
  name       = "icattle-global-lb"
  target     = google_compute_target_http_proxy.default.id
  port_range = "443"
}
```

### CI/CD Pipeline

**Deployment Flow:**
```
1. Code Push (GitHub)
   ↓
2. Automated Tests (GitHub Actions)
   ├─ Unit tests
   ├─ Integration tests
   └─ E2E tests
   ↓
3. Build Docker Images
   ├─ US API image
   ├─ AU API image
   └─ International Gateway image
   ↓
4. Deploy to Staging
   ├─ US staging (us-central1)
   └─ AU staging (ap-southeast-2)
   ↓
5. Smoke Tests
   ↓
6. Deploy to Production (Blue-Green)
   ├─ US production
   └─ AU production
   ↓
7. Health Checks
   ↓
8. Route Traffic to New Version
```

---

## 📊 Monitoring & Observability

### Metrics

**Per-Region Metrics:**
- API latency (p50, p95, p99)
- Request rate (req/sec)
- Error rate (%)
- Database connections
- Kafka lag

**Cross-Region Metrics:**
- Replication lag
- Currency conversion accuracy
- Market detection accuracy
- Cross-region query latency

### Alerting

**Critical Alerts:**
- API latency > 500ms
- Error rate > 1%
- Database CPU > 80%
- Replication lag > 60 seconds
- Market data feed down

**Warning Alerts:**
- API latency > 200ms
- Error rate > 0.5%
- Database CPU > 60%
- Replication lag > 30 seconds

---

## 💰 Cost Optimization

### Per-Region Costs (Monthly Estimate)

**US Region:**
```
API Gateway (4 instances): $400
Database (8 vCPU, 32GB): $800
Kafka (3 nodes): $600
Load Balancer: $100
Data Transfer: $200
──────────────────────────
Total: $2,100/month
```

**AU Region:**
```
API Gateway (4 instances): $450 (AU pricing)
Database (8 vCPU, 32GB): $900 (AU pricing)
Kafka (3 nodes): $650 (AU pricing)
Load Balancer: $120
Data Transfer: $250
──────────────────────────
Total: $2,370/month
```

**Global Services:**
```
Global Load Balancer: $200
CDN (Cloudflare): $200
Monitoring (Datadog): $300
Logging (ELK): $150
──────────────────────────
Total: $850/month
```

**Grand Total: ~$5,320/month**

### Cost Optimization Strategies

1. **Auto-scaling:** Scale down during off-peak hours
2. **Reserved Instances:** 30-40% savings for committed usage
3. **Spot Instances:** Use for non-critical workloads
4. **Data Transfer:** Optimize cross-region replication
5. **Caching:** Reduce database queries with Redis

---

## 🔄 Disaster Recovery

### Backup Strategy

**Databases:**
- Continuous backup (point-in-time recovery)
- Daily snapshots (retained 30 days)
- Cross-region replication
- RTO: 1 hour, RPO: 5 minutes

**Event Streams:**
- Kafka topic replication (factor 3)
- S3 archival (retained 7 years)
- Cross-region backup
- RTO: 15 minutes, RPO: 0 (no data loss)

### Failover Procedures

**US Region Failure:**
1. Detect failure (health check)
2. Route US traffic to AU region
3. AU region serves US requests with cached data
4. Restore US region from backup
5. Resume normal operations

**AU Region Failure:**
1. Detect failure (health check)
2. Route AU traffic to US region
3. US region serves AU requests with cached data
4. Restore AU region from backup
5. Resume normal operations

---

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Provision cloud infrastructure (Terraform)
- [ ] Set up databases (PostgreSQL)
- [ ] Configure Kafka clusters
- [ ] Deploy API gateways
- [ ] Configure load balancers
- [ ] Set up monitoring (Datadog)
- [ ] Configure logging (ELK)
- [ ] Set up CI/CD pipeline
- [ ] Create DNS records
- [ ] Configure SSL certificates

### Market-Specific Setup

**US Market:**
- [ ] CME API credentials
- [ ] USDA AMS integration
- [ ] US regional pricing data
- [ ] USDA grading validation

**AU Market:**
- [ ] MLA API subscription
- [ ] NLRS data feed
- [ ] NLIS database access
- [ ] MSA grading validation

### Post-Deployment

- [ ] Run smoke tests
- [ ] Verify market detection
- [ ] Test currency conversion
- [ ] Validate unit conversion
- [ ] Check cross-region replication
- [ ] Monitor performance metrics
- [ ] Set up alerts
- [ ] Document runbooks

---

**Ready for international deployment!** 🌍
