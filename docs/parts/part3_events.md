# Part 3 — Event Model

## Overview

Domain behavior is captured via **domain event streams**, never stored in mutable business tables.

**Core Principle:** Events are the source of truth. Projections are derived.

---

## 3.1 Event Streams

Each bounded context has its own domain event stream:

| Domain | Event Stream Table | Example Events |
|--------|-------------------|----------------|
| **Card Auth** | `card_auth_domain_events` | HELD, CLEARED, EXPIRED, REVERSED |
| **Disputes** | `disputes_domain_events` | OPENED, ACCEPTED, REJECTED, CHARGEBACK_POSTED, CLOSED |
| **Lending** | `lending_domain_events` | ORIGINATED, REPAID, RESTRUCTURED |
| **Payments** | `payments_domain_events` | INITIATED, SETTLED, FAILED |

---

## 3.2 Event Schema

All domain event tables follow a canonical schema:

```sql
CREATE TABLE <domain>_domain_events (
  seq_id                BIGSERIAL PRIMARY KEY,        -- Monotonic sequence for replay
  occurred_at           TIMESTAMPTZ NOT NULL,
  <entity>_id           TEXT NOT NULL,                -- Entity ID (e.g., auth_id, dispute_id)
  event_type            TEXT NOT NULL,                -- Event type (e.g., CARD_AUTH_CLEARED)
  journal_id            UUID,                         -- References journals (for monetary events)
  ledger_event_id       UUID,                         -- References ledger_events (for monetary events)
  <context_fields>      ...,                          -- Domain-specific fields
  details_json          JSONB NOT NULL,
  schema_version        INTEGER NOT NULL DEFAULT 1
);
```

### Key Properties

1. **Immutable** — Database triggers prevent UPDATE/DELETE
2. **Append-only** — Only INSERT allowed
3. **Ordered** — `seq_id` provides deterministic replay order
4. **Linked** — `ledger_event_id` references canonical ledger events for monetary movements

---

## 3.3 Event Immutability

Event immutability is **enforced by database triggers**, not cultural practice:

```sql
CREATE OR REPLACE FUNCTION prevent_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION '<table> is immutable (UPDATE not allowed)';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION '<table> is immutable (DELETE not allowed)';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_event_immutability
  BEFORE UPDATE OR DELETE ON <domain>_domain_events
  FOR EACH ROW EXECUTE FUNCTION prevent_event_mutation();
```

---

## 3.4 Ledger Linkage

**Core Invariant:** Every event that implies money movement MUST reference `ledger_event_id`.

### Pattern: Domain Events Reference Ledger Events

```
Domain Event (CHARGEBACK_POSTED)
  ├─> journal_id (references journals table)
  └─> ledger_event_id (references ledger_events table)
        └─> postings_hash (cryptographic verification)
```

### Example: Card Auth Clearing

```python
# 1. Execute ledger posting (returns journal_id, ledger_event_id)
journal_id, ledger_event_id = run_card_auth_posting(
    source_account_id=card_account_id,
    destination_account_id=merchant_account_id,
    amount=amount,
    currency=currency,
    event_ref=auth_id,
    idempotency_key=f"card-clear:{auth_id}",
    description=f"CARD_AUTH_CLEARED {auth_id}",
)

# 2. Emit domain event with ledger linkage
emit_card_auth_cleared(
    cur,
    auth_id=auth_id,
    card_account_id=card_account_id,
    merchant_account_id=merchant_account_id,
    amount=amount,
    currency=currency,
    journal_id=journal_id,           # Link to ledger
    ledger_event_id=ledger_event_id, # Link to ledger
    extra={"clearing_timestamp": timestamp},
)
```

---

## 3.5 Card Auth Events

### Event Types

| Event Type | Ledger Posting? | Description |
|-----------|----------------|-------------|
| `CARD_AUTH_HELD` | No | Authorization hold placed (logical reservation) |
| `CARD_AUTH_CLEARED` | **Yes** | Settlement with money movement (DR card, CR merchant) |
| `CARD_AUTH_EXPIRED` | No | Hold expired unused |
| `CARD_AUTH_REVERSED` | Maybe | Reversal (posting if already cleared) |

### Schema

```sql
CREATE TABLE card_auth_domain_events (
  seq_id                BIGSERIAL PRIMARY KEY,
  occurred_at           TIMESTAMPTZ NOT NULL,
  auth_id               TEXT NOT NULL,
  event_type            TEXT NOT NULL,
  journal_id            UUID,
  ledger_event_id       UUID,
  card_account_id       TEXT NOT NULL,
  merchant_account_id   TEXT,
  amount                NUMERIC(18,4) NOT NULL,
  currency              TEXT NOT NULL,
  details_json          JSONB NOT NULL,
  schema_version        INTEGER NOT NULL DEFAULT 1
);
```

### Example Event: CARD_AUTH_CLEARED

```json
{
  "seq_id": 12345,
  "occurred_at": "2025-12-03T10:30:00Z",
  "auth_id": "auth-12345",
  "event_type": "CARD_AUTH_CLEARED",
  "journal_id": "550e8400-e29b-41d4-a716-446655440000",
  "ledger_event_id": "660e8400-e29b-41d4-a716-446655440001",
  "card_account_id": "ACC-CARD-001",
  "merchant_account_id": "ACC-MERCH-001",
  "amount": 100.00,
  "currency": "AUD",
  "details_json": {
    "event_type": "CARD_AUTH_CLEARED",
    "card_account_id": "ACC-CARD-001",
    "merchant_account_id": "ACC-MERCH-001",
    "amount": 100.00,
    "currency": "AUD",
    "clearing_timestamp": "2025-12-03T10:30:00Z"
  },
  "schema_version": 1
}
```

---

## 3.6 Disputes Events

### Event Types

| Event Type | Ledger Posting? | Description |
|-----------|----------------|-------------|
| `DISPUTE_OPENED` | No | Dispute initiated by cardholder |
| `DISPUTE_ACCEPTED` | No | Dispute accepted (cardholder wins) |
| `DISPUTE_REJECTED` | No | Dispute rejected (merchant wins) |
| `CHARGEBACK_POSTED` | **Yes** | Chargeback executed with money movement (DR merchant, CR cardholder) |
| `DISPUTE_CLOSED` | No | Dispute closed/resolved (terminal state) |

### Schema

```sql
CREATE TABLE disputes_domain_events (
  seq_id                BIGSERIAL PRIMARY KEY,
  occurred_at           TIMESTAMPTZ NOT NULL,
  dispute_id            TEXT NOT NULL,
  event_type            TEXT NOT NULL,
  journal_id            UUID,
  ledger_event_id       UUID,
  cardholder_account_id TEXT NOT NULL,
  merchant_account_id   TEXT NOT NULL,
  amount                NUMERIC(18,4) NOT NULL,
  currency              TEXT NOT NULL,
  details_json          JSONB NOT NULL,
  schema_version        INTEGER NOT NULL DEFAULT 1
);
```

### Example Event: CHARGEBACK_POSTED

```json
{
  "seq_id": 67890,
  "occurred_at": "2025-12-03T11:00:00Z",
  "dispute_id": "DISP-001",
  "event_type": "CHARGEBACK_POSTED",
  "journal_id": "770e8400-e29b-41d4-a716-446655440002",
  "ledger_event_id": "880e8400-e29b-41d4-a716-446655440003",
  "cardholder_account_id": "ACC-CARD-001",
  "merchant_account_id": "ACC-MERCH-001",
  "amount": 100.00,
  "currency": "AUD",
  "details_json": {
    "event_type": "CHARGEBACK_POSTED",
    "cardholder_account_id": "ACC-CARD-001",
    "merchant_account_id": "ACC-MERCH-001",
    "amount": 100.00,
    "currency": "AUD",
    "timestamp": "2025-12-03T11:00:00Z"
  },
  "schema_version": 1
}
```

---

## 3.7 Event Emission Helpers

Each domain provides canonical event emission helpers:

### Card Auth Example

```python
# modules/card_auth/imperative_shell/card_auth_events.py

def emit_card_auth_cleared(
    cur,
    *,
    auth_id: str,
    card_account_id: str,
    merchant_account_id: str,
    amount: Decimal,
    currency: str,
    journal_id: str,
    ledger_event_id: str,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Emit CARD_AUTH_CLEARED event (settlement with ledger posting).
    """
    details = {
        "event_type": "CARD_AUTH_CLEARED",
        "card_account_id": card_account_id,
        "merchant_account_id": merchant_account_id,
        "amount": float(amount),
        "currency": currency,
    }
    if extra:
        details.update(extra)
    
    cur.execute(
        """
        INSERT INTO card_auth_domain_events (
          occurred_at, auth_id, event_type, journal_id, ledger_event_id,
          card_account_id, merchant_account_id, amount, currency, details_json
        )
        VALUES (now(), %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            auth_id,
            "CARD_AUTH_CLEARED",
            journal_id,
            ledger_event_id,
            card_account_id,
            merchant_account_id,
            str(amount),
            currency,
            json.dumps(details),
        ),
    )
```

---

## 3.8 Event Ordering

Events are ordered by `seq_id` (monotonic sequence) for deterministic replay:

```sql
SELECT * FROM card_auth_domain_events ORDER BY seq_id;
```

This ensures:
- **Deterministic replay** — Same order every time
- **Causal consistency** — Events are processed in the order they occurred
- **No race conditions** — Replay is single-threaded and sequential

---

## 3.9 Event Versioning

The `schema_version` field allows for event schema evolution:

```python
if event.schema_version == 1:
    # Handle v1 schema
    process_v1_event(event)
elif event.schema_version == 2:
    # Handle v2 schema
    process_v2_event(event)
else:
    raise ValueError(f"Unknown schema version: {event.schema_version}")
```

---

## 3.10 Implementation Example

### TuringCore-v3 Reference

**Card Auth:**
- `migrations/111_card_auth_domain_events.sql` — Event stream schema
- `modules/card_auth/imperative_shell/card_auth_events.py` — Event emission helpers
- `modules/card_auth/imperative_shell/card_clear.py` — Example usage

**Disputes:**
- `migrations/112_disputes_domain_events.sql` — Event stream schema
- `modules/disputes/imperative_shell/disputes_events.py` — Event emission helpers
- `modules/disputes/imperative_shell/chargeback_apply.py` — Example usage

---

## 3.11 Invariants

### Invariant 1: Event-Entity Correspondence

**For every entity in a projection, there exists at least one domain event:**

```sql
SELECT COUNT(*) FROM card_auth_holds h
WHERE NOT EXISTS (
  SELECT 1 FROM card_auth_domain_events e WHERE e.auth_id = h.auth_id
);
-- MUST return 0
```

### Invariant 2: Ledger Linkage for Monetary Events

**For every monetary event, `journal_id` and `ledger_event_id` are NOT NULL:**

```sql
SELECT COUNT(*) FROM card_auth_domain_events
WHERE event_type = 'CARD_AUTH_CLEARED'
  AND (journal_id IS NULL OR ledger_event_id IS NULL);
-- MUST return 0
```

### Invariant 3: Event Immutability

**No events can be updated or deleted:**

```sql
-- This should fail with immutability trigger
UPDATE card_auth_domain_events SET amount = 200.00 WHERE auth_id = 'auth-12345';
-- ERROR: card_auth_domain_events is immutable (UPDATE not allowed)
```

---

## Next Steps

1. Read [Part 4 - State Model](part4_state.md) for projection architecture
2. Review [Part 5 - Replay & Determinism](part5_replay.md) for recovery procedures
3. Study [Part 6 - Agentic AI & ML](part6_ai_ml.md) for AI integration patterns

---

**Behavior = Events. Storage = Projections.**
