# Australian Deployment Package

**iCattle.ai - MSA Grading System with Turing Protocol**

---

## 🎯 What's Included

This package contains everything you need to deploy the Australian livestock management system to production.

### Files in This Package

```
deployment/
├── Dockerfile.australia           # Production Docker image
├── docker-compose.australia.yml   # Local/staging deployment
├── deploy-australia.sh            # Automated deployment script
├── .env.example                   # Environment variables template
├── AUSTRALIA_FIRST_DEPLOYMENT.md  # Complete deployment guide
├── AUSTRALIA_QUICKSTART.md        # 7-day quick start
└── README_DEPLOY_AUSTRALIA.md     # This file

domain/
├── livestock_management_australia.py  # MSA grading domain model
└── services.py                        # Shared domain services

infrastructure/
├── market_pricing_australia.py    # EYCI/NLRS pricing service
└── database_schema.sql            # Database schema

api/
└── livestock_endpoints.py         # FastAPI endpoints with Turing Protocol
```

---

## 🚀 Quick Start (5 Minutes)

### 1. Prerequisites

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
sudo apt-get install docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Configure Environment

```bash
cd deployment/

# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env

# Required changes:
# - DB_PASSWORD: Change from default
# - MLA_API_KEY: Your MLA API key
# - NLRS_API_KEY: Your NLRS API key
# - API_SECRET_KEY: Generate secure key
```

### 3. Deploy Locally

```bash
# Make script executable
chmod +x deploy-australia.sh

# Deploy
./deploy-australia.sh local

# Wait for services to start (~30 seconds)
```

### 4. Verify Deployment

```bash
# Check health
curl http://localhost:8000/health

# Expected response:
# {"status": "healthy", "market": "AU", "turing_protocol": "enforced"}

# Test Turing Protocol enforcement
curl -X POST http://localhost:8000/api/v1/livestock/grading \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: AU-TEST-001" \
  -H "X-Request-ID: $(uuidgen)" \
  -H "X-User-ID: test_user" \
  -H "X-Device-ID: TEST-001" \
  -H "X-Geo-Location: -27.4705,153.0260" \
  -d '{
    "animal_id": "982 000123456789",
    "weight_kg": 450.0,
    "quality_grade": "4 Star",
    "marbling_score": 7,
    "fat_score": "3"
  }'

# Should return: {"success": true, ...}
```

### 5. Access API Documentation

Open in browser: http://localhost:8000/docs

---

## 🔐 Turing Protocol Enforcement

**Every API request requires 5 headers:**

```bash
X-Tenant-ID: AU-QPIC12345          # Property ID (must start with AU- or QPIC-)
X-Request-ID: <UUID>                # Unique request ID
X-User-ID: grader_john              # User performing action
X-Device-ID: TABLET-001             # Device identifier
X-Geo-Location: -27.4705,153.0260   # GPS coordinates (lat,lon)
```

**Requests without these headers will be rejected with HTTP 400.**

**Audit Trail:**
- All requests logged to `audit_log` table
- Complete traceability for LPA compliance
- NLIS integration support

---

## 📊 Deployment Options

### Option 1: Local Development

**Use for:** Testing, development

```bash
./deploy-australia.sh local
```

**Services:**
- API: http://localhost:8000
- Database: localhost:5432
- Kafka: localhost:9092

### Option 2: AWS Production

**Use for:** Production deployment

```bash
# Prerequisites
- AWS account
- AWS CLI configured
- ECR repository created
- ECS cluster created

# Deploy
./deploy-australia.sh production
```

**Services:**
- API: https://api.icattle.com.au
- Database: RDS PostgreSQL (Sydney)
- Kafka: MSK (Sydney)

### Option 3: Docker Compose (Staging)

**Use for:** Staging environment

```bash
./deploy-australia.sh staging
```

---

## 🧪 Testing

### Run All Tests

```bash
./deploy-australia.sh test
```

**Tests include:**
- Unit tests (domain logic)
- Integration tests (API endpoints)
- Turing Protocol enforcement tests
- MSA grading validation
- EYCI pricing integration

### Manual Testing

```bash
# Test without Turing Protocol headers (should fail)
curl -X POST http://localhost:8000/api/v1/livestock/grading \
  -H "Content-Type: application/json" \
  -d '{"animal_id": "982 000123456789", "weight_kg": 450.0}'

# Expected: 400 Bad Request
# "Missing required headers"

# Test with Turing Protocol headers (should succeed)
curl -X POST http://localhost:8000/api/v1/livestock/grading \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: AU-TEST-001" \
  -H "X-Request-ID: $(uuidgen)" \
  -H "X-User-ID: test_user" \
  -H "X-Device-ID: TEST-001" \
  -H "X-Geo-Location: -27.4705,153.0260" \
  -d '{
    "animal_id": "982 000123456789",
    "weight_kg": 450.0,
    "quality_grade": "4 Star",
    "marbling_score": 7
  }'

# Expected: 200 OK
```

---

## 📝 Logs

### View Logs

```bash
# All services
./deploy-australia.sh logs

# Specific service
docker-compose -f docker-compose.australia.yml logs api
docker-compose -f docker-compose.australia.yml logs postgres
docker-compose -f docker-compose.australia.yml logs kafka
```

### Log Format

```json
{
  "timestamp": "2025-01-01T10:30:00Z",
  "level": "INFO",
  "message": "MSA grading recorded",
  "tenant_id": "AU-QPIC12345",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "grader_john",
  "device_id": "TABLET-001",
  "geo_location": "-27.4705,153.0260"
}
```

---

## 🛠️ Troubleshooting

### Services Won't Start

```bash
# Check Docker status
docker ps

# Check logs
docker-compose -f docker-compose.australia.yml logs

# Restart services
docker-compose -f docker-compose.australia.yml restart
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.australia.yml ps postgres

# Test connection
docker-compose -f docker-compose.australia.yml exec postgres \
  psql -U admin -d icattle_au -c "SELECT 1;"
```

### API Returns 500 Error

```bash
# Check API logs
docker-compose -f docker-compose.australia.yml logs api

# Check environment variables
docker-compose -f docker-compose.australia.yml exec api env | grep -E "DATABASE_URL|MLA_API_KEY"
```

### Turing Protocol Validation Failing

```bash
# Verify headers are being sent
curl -v -X POST http://localhost:8000/api/v1/livestock/grading \
  -H "X-Tenant-ID: AU-TEST-001" \
  -H "X-Request-ID: $(uuidgen)" \
  -H "X-User-ID: test_user" \
  -H "X-Device-ID: TEST-001" \
  -H "X-Geo-Location: -27.4705,153.0260" \
  ...

# Check tenant ID format (must start with AU- or QPIC-)
# Check geo location is in Australian range
```

---

## 🔄 Updates & Maintenance

### Update Application Code

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./deploy-australia.sh local
```

### Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.australia.yml exec postgres \
  psql -U admin -d icattle_au -f /path/to/migration.sql
```

### Backup Database

```bash
# Create backup
docker-compose -f docker-compose.australia.yml exec postgres \
  pg_dump -U admin icattle_au > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose -f docker-compose.australia.yml exec -T postgres \
  psql -U admin icattle_au < backup_20250101.sql
```

---

## 📊 Monitoring

### Health Check

```bash
# API health
curl http://localhost:8000/health

# Database health
docker-compose -f docker-compose.australia.yml exec postgres \
  pg_isready -U admin -d icattle_au
```

### Metrics

```bash
# API metrics (Prometheus format)
curl http://localhost:8000/metrics

# Database metrics
docker-compose -f docker-compose.australia.yml exec postgres \
  psql -U admin -d icattle_au -c "SELECT * FROM pg_stat_activity;"
```

### Audit Trail

```bash
# View recent audit log
docker-compose -f docker-compose.australia.yml exec postgres \
  psql -U admin -d icattle_au -c \
  "SELECT tenant_id, user_id, endpoint, status_code, timestamp 
   FROM audit_log 
   ORDER BY timestamp DESC 
   LIMIT 10;"
```

---

## 🔒 Security

### Change Default Passwords

```bash
# Edit .env file
nano .env

# Change:
# - DB_PASSWORD
# - API_SECRET_KEY
# - All API keys

# Restart services
./deploy-australia.sh local
```

### SSL/TLS (Production)

```bash
# AWS ACM (automatic)
# Certificate auto-provisioned for *.icattle.com.au

# Let's Encrypt (self-hosted)
certbot certonly --standalone -d api.icattle.com.au
```

---

## 💰 Cost Estimate

### Local Development
- **Free** (runs on your machine)

### AWS Production (Sydney Region)
- API Gateway (ECS): $450/month
- Database (RDS): $900/month
- Event Stream (MSK): $650/month
- Load Balancer: $120/month
- Data Transfer: $250/month
- **Total: ~$2,370/month AUD**

### API Subscriptions
- MLA API: ~$170/month AUD
- NLRS data: ~$125/month AUD
- **Total: ~$295/month AUD**

**Grand Total: ~$2,665/month AUD**

---

## 📞 Support

### Documentation
- Complete Guide: `AUSTRALIA_FIRST_DEPLOYMENT.md`
- Quick Start: `AUSTRALIA_QUICKSTART.md`
- API Docs: http://localhost:8000/docs

### Technical Support
- Email: support@icattle.com.au
- Phone: +61 (0)2 XXXX XXXX

### Emergency
- On-call: +61 (0)4XX XXX XXX
- Slack: #icattle-australia

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] .env file configured
- [ ] MLA API key obtained
- [ ] NLRS API key obtained
- [ ] Database password changed

### Local Deployment
- [ ] Services started
- [ ] Health check passing
- [ ] Turing Protocol enforced
- [ ] MSA grading working
- [ ] EYCI pricing working
- [ ] Audit log capturing requests

### Production Deployment
- [ ] AWS account configured
- [ ] ECR repository created
- [ ] ECS cluster created
- [ ] RDS database created
- [ ] Load balancer configured
- [ ] SSL certificate installed
- [ ] Monitoring configured
- [ ] Alerts configured

---

## 🎉 You're Ready!

**Your Australian livestock management system is ready to deploy!**

✅ MSA grading system  
✅ EYCI/NLRS pricing  
✅ NLIS tag support  
✅ **Turing Protocol enforcement (100%)**  
✅ Complete audit trail  
✅ Production-ready architecture  

**Next Steps:**
1. Deploy locally: `./deploy-australia.sh local`
2. Test thoroughly: `./deploy-australia.sh test`
3. Deploy to production: `./deploy-australia.sh production`

**Start grading cattle and capturing MSA premiums!** 🇦🇺
