# Part 5 — Replay & Determinism

## Overview

Replay is the ability to deterministically reconstruct state from events.

**Core Principle:** State is not stored. State is computed from events.

---

## 5.1 What Replay Must Reconstruct

Replay must be able to rebuild:

1. **Account balances** from `ledger_events` (postings)
2. **Domain projections** from domain event streams
3. **Drift metrics** (differences between live and replayed state)
4. **Projection correctness** (verification of consistency)

---

## 5.2 When Replay is Required

Replay is **mandatory** for:

### 1. Crash Recovery

After a system crash, replay ensures state is consistent:

```bash
# Rebuild all projections from events
python tools/replay/rebuild_accounts_from_postings.py --rebuild
python modules/card_auth/imperative_shell/card_auth_projector.py --rebuild
python modules/disputes/imperative_shell/disputes_projector.py --rebuild
```

### 2. Regulator Audits

Regulators can verify that current balances match historical postings:

```bash
# Verify ledger integrity
python tools/replay/rebuild_accounts_from_postings.py --verify-integrity

# Generate audit report
python tools/replay/rebuild_accounts_from_postings.py --audit-report
```

### 3. Divergence Detection

Detect drift between live state and replayed state:

```bash
# Check for mismatches
python modules/card_auth/imperative_shell/card_auth_projector.py --verify
```

### 4. MCP Self-Healing

Modern Control Plane (MCP) uses replay to automatically repair divergences:

```python
def self_heal_projection(projection_name):
    """
    Detect and repair projection divergence.
    """
    # 1. Rebuild into temp table
    rebuild_temp(projection_name)
    
    # 2. Compare temp with live
    divergences = detect_divergences(projection_name)
    
    # 3. If divergences found, replace live with temp
    if divergences:
        alert(f"Divergence detected in {projection_name}: {len(divergences)} rows")
        swap_tables(projection_name)
        log(f"Self-healed {projection_name}")
```

---

## 5.3 Ledger Replay

### Algorithm

```python
def rebuild_accounts_from_postings():
    """
    Rebuild account balances from ledger_events.
    """
    # 1. Clear account balances
    db.execute("UPDATE accounts SET balance = 0")
    
    # 2. Fetch all postings in order
    postings = db.query(
        """
        SELECT p.account_id, p.direction, p.amount
        FROM ledger_events e
        JOIN journals j ON j.journal_id = e.journal_id
        JOIN postings p ON p.journal_id = j.journal_id
        ORDER BY e.seq_id, p.posting_id
        """
    )
    
    # 3. Apply each posting
    for posting in postings:
        if posting.direction == "DEBIT":
            db.execute(
                "UPDATE accounts SET balance = balance - %s WHERE account_id = %s",
                (posting.amount, posting.account_id)
            )
        else:  # CREDIT
            db.execute(
                "UPDATE accounts SET balance = balance + %s WHERE account_id = %s",
                (posting.amount, posting.account_id)
            )
    
    # 4. Verify non-negative balances
    negative_balances = db.query(
        "SELECT account_id, balance FROM accounts WHERE balance < 0"
    )
    
    if negative_balances:
        raise ReplayError(f"Negative balances detected: {negative_balances}")
```

### Hash Verification

During replay, verify that each ledger event's `postings_hash` matches:

```python
def verify_ledger_integrity():
    """
    Verify that all ledger events have valid hashes.
    """
    events = db.query("SELECT * FROM ledger_events ORDER BY seq_id")
    
    for event in events:
        # Reconstruct PostingSet from event
        posting_set = reconstruct_posting_set(event)
        
        # Compute hash
        computed_hash = compute_postings_hash(posting_set)
        
        # Verify
        if event.postings_hash != computed_hash:
            raise IntegrityError(
                f"Hash mismatch for event {event.event_id}: "
                f"stored={event.postings_hash}, computed={computed_hash}"
            )
```

---

## 5.4 Domain Projection Replay

### Algorithm

```python
def rebuild_projection(event_stream_table, projection_table, apply_event_fn):
    """
    Generic projection rebuilder.
    """
    # 1. Clear projection
    db.execute(f"TRUNCATE TABLE {projection_table}")
    
    # 2. Fetch events in order
    events = db.query(
        f"SELECT * FROM {event_stream_table} ORDER BY seq_id"
    )
    
    # 3. Apply each event
    for event in events:
        apply_event_fn(event, projection_table)
    
    # 4. Verify consistency
    verify_projection(projection_table)
```

### Example: Card Auth Replay

```bash
# Full rebuild
python modules/card_auth/imperative_shell/card_auth_projector.py --rebuild

# Output:
# === Card Auth Projector: Full Rebuild ===
# Truncating card_auth_holds...
# Fetching events from card_auth_domain_events...
# Found 12,345 events to replay
#   Processed 1000/12345 events...
#   Processed 2000/12345 events...
#   ...
# ✓ Rebuilt card_auth_holds from 12,345 events
```

---

## 5.5 Determinism Requirements

Replay MUST be **deterministic**:

### 1. Event Ordering

Events MUST be processed in `seq_id` order:

```sql
SELECT * FROM card_auth_domain_events ORDER BY seq_id;
```

### 2. No External Dependencies

Replay MUST NOT depend on:
- Current time (use `occurred_at` from events)
- External APIs (use cached data from events)
- Random number generators (use deterministic seeds from events)

### 3. Idempotent Operations

Replay MUST be idempotent:

```python
replay(events) == replay(events)
```

### 4. No Side Effects

Replay MUST NOT:
- Send emails
- Call external APIs
- Emit new events

---

## 5.6 Divergence Detection

### Algorithm

```python
def detect_divergences(projection_table):
    """
    Detect differences between live and replayed state.
    """
    # 1. Rebuild into temp table
    rebuild_temp(projection_table)
    
    # 2. Compare live with temp
    divergences = db.query(
        f"""
        SELECT
          COALESCE(a.id, b.id) AS id,
          a.state AS live_state,
          b.state AS replayed_state
        FROM {projection_table} a
        FULL OUTER JOIN {projection_table}_temp b USING (id)
        WHERE a.id IS NULL
           OR b.id IS NULL
           OR a.state != b.state
        """
    )
    
    return divergences
```

### Example Output

```
Divergence detected in card_auth_holds:
  auth-12345: live_state=CLEARED, replayed_state=HELD
  auth-67890: live_state=EXPIRED, replayed_state=CLEARED
```

---

## 5.7 Replay Performance

### Optimization Strategies

1. **Batch processing** — Apply events in batches (e.g., 1000 at a time)
2. **Parallel replay** — Replay independent projections in parallel
3. **Incremental replay** — Only replay new events since last checkpoint
4. **Snapshot + incremental** — Start from snapshot, apply incremental events

### Example: Incremental Replay

```python
def incremental_replay(projection_table, event_stream_table):
    """
    Apply only new events since last checkpoint.
    """
    # Get last processed seq_id
    last_seq_id = db.query(
        "SELECT last_seq_id FROM projection_metadata WHERE projection_name = %s",
        (projection_table,)
    )
    
    # Fetch new events
    new_events = db.query(
        f"SELECT * FROM {event_stream_table} WHERE seq_id > %s ORDER BY seq_id",
        (last_seq_id,)
    )
    
    # Apply new events
    for event in new_events:
        apply_event(event, projection_table)
    
    # Update checkpoint
    db.execute(
        "UPDATE projection_metadata SET last_seq_id = %s WHERE projection_name = %s",
        (new_events[-1].seq_id, projection_table)
    )
```

---

## 5.8 Implementation Example

### TuringCore-v3 Reference

**Ledger Replay:**
- `tools/replay/rebuild_accounts_from_postings.py`

**Card Auth Replay:**
- `modules/card_auth/imperative_shell/card_auth_projector.py`

**Disputes Replay:**
- `modules/disputes/imperative_shell/disputes_projector.py`

---

## 5.9 Replay Testing

### Test Cases

1. **Full rebuild** — Verify that replayed state matches live state
2. **Incremental replay** — Verify that incremental updates are correct
3. **Hash verification** — Verify that all ledger events have valid hashes
4. **Negative balance detection** — Verify that replay detects negative balances
5. **Divergence detection** — Verify that divergences are detected

### Example Test

```python
def test_card_auth_replay():
    """
    Test that card auth replay is deterministic.
    """
    # 1. Capture current state
    original_state = db.query("SELECT * FROM card_auth_holds ORDER BY auth_id")
    
    # 2. Rebuild projection
    rebuild_projection("card_auth_domain_events", "card_auth_holds", apply_card_auth_event)
    
    # 3. Capture replayed state
    replayed_state = db.query("SELECT * FROM card_auth_holds ORDER BY auth_id")
    
    # 4. Compare
    assert original_state == replayed_state, "Replay is not deterministic"
```

---

## 5.10 Invariants

### Invariant 1: Replay Consistency

**Replaying events yields the same state as current projection:**

```python
assert live_state == replay(events)
```

### Invariant 2: Hash Integrity

**All ledger events have valid hashes:**

```python
for event in ledger_events:
    assert event.postings_hash == compute_postings_hash(event)
```

### Invariant 3: Non-Negative Balances

**Replay never produces negative balances:**

```python
for account in accounts:
    assert account.balance >= 0
```

---

## Next Steps

1. Read [Part 6 - Agentic AI & ML](part6_ai_ml.md) for AI integration patterns
2. Review [Part 7 - Turing Layer](part7_tl.md) for governance enforcement
3. Study [Part 8 - DataMesh](part8_datamesh.md) for data product architecture

---

**State is not stored. State is computed from events.**
