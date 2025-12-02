# Part 4 — State Model

## Overview

All mutable business tables are **projections**, not primary truth.

**Core Principle:** Projections are derived from events. Events are the source of truth.

---

## 4.1 Projection Definition

A **projection** is a query-optimized view of event stream data:

```
Projection = f(Events)
```

Where `f` is a deterministic function that replays events to reconstruct state.

### Examples

| Projection Table | Event Stream | Purpose |
|-----------------|--------------|---------|
| `accounts` | `ledger_events` | Current account balances |
| `card_auth_holds` | `card_auth_domain_events` | Current card authorization holds |
| `disputes` | `disputes_domain_events` | Current dispute states |
| `loan_positions` | `lending_domain_events` | Current loan balances and status |

---

## 4.2 Projection Validity

A projection is only valid if:

```
live_state == replay(events)
```

This can be verified by:
1. Truncating the projection table
2. Replaying all events in order
3. Comparing the replayed state with the original state

---

## 4.3 Projection Rebuilders (Projectors)

Each projection has a corresponding **projector** that can rebuild it from events.

### Projector Pattern

```python
def rebuild_projection(event_stream, projection_table):
    """
    Deterministic projection rebuilder.
    """
    # 1. Clear projection
    truncate_table(projection_table)
    
    # 2. Fetch events in order
    events = fetch_events(event_stream, order_by="seq_id")
    
    # 3. Apply each event
    for event in events:
        apply_event(event, projection_table)
    
    # 4. Verify consistency
    verify_projection(projection_table)
```

---

## 4.4 Example: Card Auth Projection

### Event Stream

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

### Projection Table

```sql
CREATE TABLE card_auth_holds (
  auth_id               TEXT PRIMARY KEY,
  card_account_id       TEXT NOT NULL,
  merchant_account_id   TEXT,
  amount                NUMERIC(18,4) NOT NULL,
  currency              TEXT NOT NULL,
  state                 TEXT NOT NULL,  -- HELD, CLEARED, EXPIRED, REVERSED
  cleared_amount        NUMERIC(18,4),
  created_at            TIMESTAMPTZ NOT NULL,
  updated_at            TIMESTAMPTZ NOT NULL
);
```

### Projector Logic

```python
def apply_card_auth_event(cur, event):
    """
    Apply a single card auth event to the projection.
    """
    if event["event_type"] == "CARD_AUTH_HELD":
        # Create new hold
        cur.execute(
            """
            INSERT INTO card_auth_holds (
              auth_id, card_account_id, merchant_account_id,
              amount, currency, state, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                event["auth_id"],
                event["card_account_id"],
                event["merchant_account_id"],
                event["amount"],
                event["currency"],
                "HELD",
                event["occurred_at"],
                event["occurred_at"],
            ),
        )
    
    elif event["event_type"] == "CARD_AUTH_CLEARED":
        # Update hold to cleared
        cur.execute(
            """
            UPDATE card_auth_holds
               SET state = 'CLEARED',
                   cleared_amount = %s,
                   updated_at = %s
             WHERE auth_id = %s
            """,
            (
                event["amount"],
                event["occurred_at"],
                event["auth_id"],
            ),
        )
    
    elif event["event_type"] == "CARD_AUTH_EXPIRED":
        # Update hold to expired
        cur.execute(
            """
            UPDATE card_auth_holds
               SET state = 'EXPIRED',
                   updated_at = %s
             WHERE auth_id = %s
            """,
            (event["occurred_at"], event["auth_id"]),
        )
    
    elif event["event_type"] == "CARD_AUTH_REVERSED":
        # Update hold to reversed
        cur.execute(
            """
            UPDATE card_auth_holds
               SET state = 'REVERSED',
                   updated_at = %s
             WHERE auth_id = %s
            """,
            (event["occurred_at"], event["auth_id"]),
        )
```

---

## 4.5 Example: Disputes Projection

### Event Stream

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

### Projection Table

```sql
CREATE TABLE disputes (
  dispute_id            TEXT PRIMARY KEY,
  cardholder_account_id TEXT NOT NULL,
  merchant_account_id   TEXT NOT NULL,
  amount                NUMERIC(18,4) NOT NULL,
  currency              TEXT NOT NULL,
  state                 TEXT NOT NULL,  -- OPEN, ACCEPTED, REJECTED, CHARGEBACK_POSTED, CLOSED
  reason_code           TEXT,
  opened_at             TIMESTAMPTZ NOT NULL,
  updated_at            TIMESTAMPTZ NOT NULL
);
```

### Projector Logic

```python
def apply_dispute_event(cur, event):
    """
    Apply a single dispute event to the projection.
    """
    if event["event_type"] == "DISPUTE_OPENED":
        # Create new dispute
        cur.execute(
            """
            INSERT INTO disputes (
              dispute_id, cardholder_account_id, merchant_account_id,
              amount, currency, state, reason_code, opened_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                event["dispute_id"],
                event["cardholder_account_id"],
                event["merchant_account_id"],
                event["amount"],
                event["currency"],
                "OPEN",
                event["details_json"].get("reason_code"),
                event["occurred_at"],
                event["occurred_at"],
            ),
        )
    
    elif event["event_type"] == "DISPUTE_ACCEPTED":
        # Update dispute to accepted
        cur.execute(
            """
            UPDATE disputes
               SET state = 'ACCEPTED',
                   updated_at = %s
             WHERE dispute_id = %s
            """,
            (event["occurred_at"], event["dispute_id"]),
        )
    
    elif event["event_type"] == "DISPUTE_REJECTED":
        # Update dispute to rejected
        cur.execute(
            """
            UPDATE disputes
               SET state = 'REJECTED',
                   updated_at = %s
             WHERE dispute_id = %s
            """,
            (event["occurred_at"], event["dispute_id"]),
        )
    
    elif event["event_type"] == "CHARGEBACK_POSTED":
        # Update dispute to chargeback_posted
        cur.execute(
            """
            UPDATE disputes
               SET state = 'CHARGEBACK_POSTED',
                   updated_at = %s
             WHERE dispute_id = %s
            """,
            (event["occurred_at"], event["dispute_id"]),
        )
    
    elif event["event_type"] == "DISPUTE_CLOSED":
        # Update dispute to closed
        cur.execute(
            """
            UPDATE disputes
               SET state = 'CLOSED',
                   updated_at = %s
             WHERE dispute_id = %s
            """,
            (event["occurred_at"], event["dispute_id"]),
        )
```

---

## 4.6 Projector Modes

### Full Rebuild

Truncate projection and replay all events:

```bash
python modules/card_auth/imperative_shell/card_auth_projector.py --rebuild
```

**Use case:** Disaster recovery, schema migration, verification

### Incremental Update

Apply only new events since last projection:

```bash
python modules/card_auth/imperative_shell/card_auth_projector.py --incremental
```

**Use case:** Production operation, continuous sync

### Verify Consistency

Compare projection with replayed state:

```bash
python modules/card_auth/imperative_shell/card_auth_projector.py --verify
```

**Use case:** Drift detection, audit, testing

---

## 4.7 Projection Lag

**Projection lag** is the time between event emission and projection update.

### Monitoring

```sql
SELECT
  MAX(occurred_at) AS latest_event,
  NOW() AS current_time,
  NOW() - MAX(occurred_at) AS lag
FROM card_auth_domain_events;
```

### Alerting

Alert if lag exceeds threshold (e.g., 1 minute):

```python
if lag > timedelta(minutes=1):
    alert("Card auth projection lag exceeds 1 minute")
```

---

## 4.8 Projection Metadata

Track projection state in metadata table:

```sql
CREATE TABLE projection_metadata (
  projection_name TEXT PRIMARY KEY,
  last_seq_id     BIGINT NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Usage

```python
# Get last processed seq_id
last_seq_id = db.query(
    "SELECT last_seq_id FROM projection_metadata WHERE projection_name = %s",
    ("card_auth_holds",)
)

# Fetch new events
new_events = db.query(
    "SELECT * FROM card_auth_domain_events WHERE seq_id > %s ORDER BY seq_id",
    (last_seq_id,)
)

# Apply new events
for event in new_events:
    apply_event(event)

# Update metadata
db.execute(
    """
    UPDATE projection_metadata
       SET last_seq_id = %s,
           updated_at = NOW()
     WHERE projection_name = %s
    """,
    (new_events[-1]["seq_id"], "card_auth_holds")
)
```

---

## 4.9 Implementation Example

### TuringCore-v3 Reference

**Card Auth Projector:**
- `modules/card_auth/imperative_shell/card_auth_projector.py`

**Disputes Projector:**
- `modules/disputes/imperative_shell/disputes_projector.py`

**Ledger Replay Tool:**
- `tools/replay/rebuild_accounts_from_postings.py`

---

## 4.10 Invariants

### Invariant 1: Projection Consistency

**Replaying events yields the same state as current projection:**

```python
def verify_projection_consistency():
    # Rebuild into temp table
    rebuild_projection_temp()
    
    # Compare temp with live
    mismatches = db.query(
        """
        SELECT COUNT(*) FROM card_auth_holds a
        FULL OUTER JOIN card_auth_holds_temp b USING (auth_id)
        WHERE a.auth_id IS NULL
           OR b.auth_id IS NULL
           OR a.state != b.state
        """
    )
    
    assert mismatches == 0, f"Found {mismatches} projection mismatches"
```

### Invariant 2: No Orphaned Projections

**Every projection row has at least one event:**

```sql
SELECT COUNT(*) FROM card_auth_holds h
WHERE NOT EXISTS (
  SELECT 1 FROM card_auth_domain_events e WHERE e.auth_id = h.auth_id
);
-- MUST return 0
```

### Invariant 3: Monotonic Seq_id

**Events are never reordered:**

```sql
SELECT seq_id FROM card_auth_domain_events ORDER BY seq_id;
-- MUST be strictly increasing (no gaps allowed after replay)
```

---

## Next Steps

1. Read [Part 5 - Replay & Determinism](part5_replay.md) for recovery procedures
2. Review [Part 6 - Agentic AI & ML](part6_ai_ml.md) for AI integration patterns
3. Study [Part 7 - Turing Layer](part7_tl.md) for governance enforcement

---

**Storage = Projections. Truth = Events.**
