# Part 8 — DataMesh

## Overview

Each bounded context exposes **immutable, event-backed data products**.

**Core Principle:** Data products are derived from events, not copied from databases.

---

## 8.1 Data Product Definition

A **data product** is a versioned, event-backed dataset with:

- **Owner** — Team responsible for the data product
- **Schema version** — Semantic versioning (e.g., v1.2.3)
- **SLA** — Latency, freshness, availability guarantees
- **Replay contract** — How to rebuild the data product from events
- **Lineage** — Upstream events and transformations
- **Governance policies** — Access control, privacy, retention

---

## 8.2 Event-Backed Data Products

Data products are **projections** of event streams:

```
Data Product = f(Events)
```

### Example: Customer Credit Scores

```python
# Event stream
credit_scored_events = db.query(
    "SELECT * FROM credit_oracle_events WHERE event_type = 'CREDIT_SCORED' ORDER BY seq_id"
)

# Data product (projection)
customer_credit_scores = {}
for event in credit_scored_events:
    customer_credit_scores[event.customer_id] = {
        "score": event.score,
        "confidence": event.confidence,
        "scored_at": event.occurred_at,
    }
```

---

## 8.3 Schema Versioning

Data products use **semantic versioning**:

- **Major** (v2.0.0) — Breaking changes
- **Minor** (v1.2.0) — Backward-compatible additions
- **Patch** (v1.1.1) — Bug fixes

### Example

```python
class CustomerCreditScoreV1:
    customer_id: str
    score: int
    scored_at: datetime

class CustomerCreditScoreV2:
    customer_id: str
    score: int
    confidence: float  # New field (minor version bump)
    scored_at: datetime
```

---

## 8.4 SLAs

Data products MUST have SLAs:

| Metric | Example SLA |
|--------|-------------|
| **Latency** | P95 < 100ms |
| **Freshness** | < 1 minute lag |
| **Availability** | 99.9% uptime |
| **Completeness** | 100% of events processed |

---

## 8.5 Lineage

Data products MUST have lineage:

```
Customer Credit Scores (v2.0.0)
  ├─> credit_oracle_events (CREDIT_SCORED)
  ├─> customer_profiles (JOIN)
  └─> model_inferences (credit-oracle-v2.1)
```

---

## 8.6 Governance Policies

Data products MUST have governance policies:

- **Access control** — Who can read/write
- **Privacy** — PII masking, anonymization
- **Retention** — How long data is kept
- **Compliance** — GDPR, CCPA, AML/CTF

---

## 8.7 Zero-Trust Data Consumption

Consumers MUST authenticate and authorize:

```python
def consume_data_product(product_name, consumer_id, token):
    """
    Consume data product with zero-trust authentication.
    """
    # 1. Verify token
    claims = verify_jwt(token)
    
    # 2. Check access control
    if not has_access(consumer_id, product_name):
        raise Unauthorized(f"{consumer_id} cannot access {product_name}")
    
    # 3. Return data product
    return get_data_product(product_name)
```

---

## Next Steps

1. Read [Part 9 - MCP](part9_mcp.md) for control plane operations
2. Review [Part 10 - RedBelly](part10_redbelly.md) for cryptographic verification
3. Study [Part 11 - Conformance](part11_conformance.md) for compliance checklist

---

**Data products are derived from events, not copied from databases.**
