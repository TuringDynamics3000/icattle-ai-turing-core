# Part 2 — Ledger Model

## 2.1 Monetary Semantics

**Core Principle:** All monetary state transitions MUST occur via **PostingSets**.

Direct mutations of account balances are **strictly forbidden**. This ensures:

- **Double-entry enforcement** — Every debit has a corresponding credit
- **Auditability** — Complete history of all money movements
- **Replay capability** — Balances can be reconstructed from postings
- **Hash integrity** — Cryptographic verification of ledger operations

---

## 2.2 Posting Definition

A **Posting** is an atomic ledger entry:

```python
Posting = {
    account_id: str,      # Account being debited or credited
    direction: str,       # "DEBIT" or "CREDIT"
    amount: Decimal,      # Monetary amount (positive, non-zero)
    currency: str,        # ISO 4217 currency code (e.g., "AUD", "USD")
    description: str,     # Human-readable description
    metadata: dict        # Optional structured metadata
}
```

### Constraints

1. `amount` MUST be positive and non-zero
2. `direction` MUST be either "DEBIT" or "CREDIT"
3. `currency` MUST be a valid ISO 4217 code
4. All postings within a PostingSet MUST have the same currency

---

## 2.3 PostingSet Definition

A **PostingSet** is a collection of postings that balance:

```python
PostingSet = {
    ledger_name: str,         # Logical ledger (e.g., "CARD_AUTH", "DISPUTES")
    event_type: str,          # Event type (e.g., "CARD_AUTH_CLEARED")
    event_ref: str,           # Event reference (e.g., auth_id, dispute_id)
    idempotency_key: str,     # Unique key for idempotent processing
    postings: [Posting],      # List of postings
    metadata: dict            # Optional structured metadata
}
```

### Balance Constraint

**MUST satisfy:**

```
SUM(postings where direction="DEBIT") == SUM(postings where direction="CREDIT")
```

This is the **fundamental invariant** of double-entry bookkeeping.

---

## 2.4 FCIS — Functional Core, Imperative Shell

The Turing Protocol enforces a strict separation between:

### Functional Core (Pure Functions)

**Responsibility:** Deterministic PostingSet creation

```python
def build_transfer_postings(cmd: TransferCommand) -> PostingSet:
    """
    Pure function: builds PostingSet from command.
    No side effects, no I/O, no database access.
    """
    return PostingSet(
        ledger_name=cmd.ledger_name,
        event_type=cmd.event_type,
        event_ref=cmd.event_ref,
        idempotency_key=cmd.idempotency_key,
        postings=[
            Posting(
                account_id=cmd.source_account_id,
                direction="DEBIT",
                amount=cmd.money.amount,
                currency=cmd.money.currency,
                description=cmd.description,
            ),
            Posting(
                account_id=cmd.destination_account_id,
                direction="CREDIT",
                amount=cmd.money.amount,
                currency=cmd.money.currency,
                description=cmd.description,
            ),
        ],
    )
```

### Imperative Shell (Side Effects)

**Responsibility:** Atomic commit + event emission

```python
def postings_apply(posting_set: PostingSet) -> (journal_id, ledger_event_id):
    """
    Imperative shell: performs atomic database commit.
    Returns (journal_id, ledger_event_id) for domain event linkage.
    """
    with db.transaction(isolation="SERIALIZABLE"):
        # 1. Validate PostingSet
        validate_posting_set(posting_set)
        
        # 2. Lock affected accounts
        accounts = lock_accounts([p.account_id for p in posting_set.postings])
        
        # 3. Check balances (enforce non-negative)
        check_sufficient_funds(posting_set, accounts)
        
        # 4. Create journal
        journal_id = create_journal(posting_set)
        
        # 5. Insert postings
        insert_postings(journal_id, posting_set.postings)
        
        # 6. Update account balances
        update_balances(posting_set.postings)
        
        # 7. Record idempotency
        record_idempotency(posting_set.idempotency_key, journal_id)
        
        # 8. Emit canonical ledger event
        ledger_event_id = emit_ledger_event(journal_id, posting_set)
        
        return (journal_id, ledger_event_id)
```

---

## 2.5 Canonical Ledger Events

Each PostingSet commit generates a `LEDGER_POSTED` event in the `ledger_events` table:

### Schema

```sql
CREATE TABLE ledger_events (
  seq_id           BIGSERIAL PRIMARY KEY,
  event_id         UUID NOT NULL UNIQUE,
  occurred_at      TIMESTAMPTZ NOT NULL,
  journal_id       UUID NOT NULL REFERENCES journals(journal_id),
  ledger_name      TEXT NOT NULL,
  event_type       TEXT NOT NULL,
  event_ref        TEXT NOT NULL,
  idempotency_key  TEXT NOT NULL UNIQUE,
  correlation_id   TEXT,
  causation_id     TEXT,
  postings_hash    TEXT NOT NULL,  -- SHA-256 hash of canonical postings
  payload_json     JSONB NOT NULL,
  schema_version   INTEGER NOT NULL DEFAULT 1
);
```

### Event Payload

```json
{
  "event_type": "LEDGER_POSTED",
  "protocol_version": "2.0",
  "journal_id": "550e8400-e29b-41d4-a716-446655440000",
  "ledger_name": "CARD_AUTH",
  "source_event_type": "CARD_AUTH_CLEARED",
  "event_ref": "auth-12345",
  "idempotency_key": "card-clear:auth-12345",
  "correlation_id": null,
  "causation_id": null,
  "postings": [
    {
      "account_id": "ACC-CARD-001",
      "direction": "DEBIT",
      "amount": 100.00,
      "currency": "AUD",
      "description": "CARD_AUTH_CLEARED auth-12345",
      "metadata": {}
    },
    {
      "account_id": "ACC-MERCH-001",
      "direction": "CREDIT",
      "amount": 100.00,
      "currency": "AUD",
      "description": "CARD_AUTH_CLEARED auth-12345",
      "metadata": {}
    }
  ],
  "timestamp": "2025-12-03T10:30:00Z"
}
```

---

## 2.6 Hash Integrity

The `postings_hash` provides cryptographic verification of ledger operations.

### Hash Computation

```python
def compute_postings_hash(posting_set: PostingSet) -> str:
    """
    Compute deterministic SHA-256 hash of PostingSet.
    """
    canonical = {
        "ledger_name": posting_set.ledger_name,
        "event_type": posting_set.event_type,
        "event_ref": posting_set.event_ref,
        "idempotency_key": posting_set.idempotency_key,
        "postings": [
            {
                "account_id": p.account_id,
                "direction": p.direction,
                "amount": str(p.amount),
                "currency": p.currency,
                "description": p.description,
                "metadata": p.metadata or {},
            }
            for p in sorted(
                posting_set.postings,
                key=lambda x: (x.account_id, x.direction, str(x.amount))
            )
        ],
    }
    
    raw = json.dumps(canonical, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
```

### Hash Verification

Any mismatch between stored `postings_hash` and recomputed hash signals **corruption** or **tampering**.

```python
def verify_ledger_integrity():
    """
    Verify that all ledger events have valid hashes.
    """
    for event in ledger_events:
        posting_set = reconstruct_posting_set(event)
        computed_hash = compute_postings_hash(posting_set)
        
        if event.postings_hash != computed_hash:
            raise IntegrityError(f"Hash mismatch for event {event.event_id}")
```

---

## 2.7 Idempotency

The `idempotency_key` ensures safe retries:

```sql
CREATE TABLE ledger_idempotency (
  idempotency_key TEXT PRIMARY KEY,
  journal_id      UUID NOT NULL REFERENCES journals(journal_id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Idempotent Processing

```python
def postings_apply(posting_set: PostingSet):
    # Check if already processed
    existing = db.query(
        "SELECT journal_id FROM ledger_idempotency WHERE idempotency_key = %s",
        (posting_set.idempotency_key,)
    )
    
    if existing:
        # Already processed - return existing journal_id
        return existing.journal_id
    
    # Process normally...
```

---

## 2.8 Concurrency Control

The Turing Protocol uses **SERIALIZABLE** isolation to prevent race conditions:

```python
with db.transaction(isolation="SERIALIZABLE"):
    # Lock affected accounts
    db.execute(
        "SELECT * FROM accounts WHERE account_id = ANY(%s) FOR UPDATE",
        (account_ids,)
    )
    
    # Perform posting...
```

---

## 2.9 Implementation Example

### TuringCore-v3 Reference

See `TuringCore-v3/modules/ledger/imperative_shell/postings_apply.py` for the canonical implementation.

**Key files:**
- `modules/ledger/core_fn/postings_engine.py` — Functional core (PostingSet builders)
- `modules/ledger/imperative_shell/postings_apply.py` — Imperative shell (atomic commit)
- `migrations/110_ledger_events_turing_protocol.sql` — Schema migration

---

## 2.10 Invariants

### Invariant 1: Double-Entry Balance

**For every journal, debits equal credits:**

```sql
SELECT journal_id, SUM(CASE WHEN direction='DEBIT' THEN amount ELSE 0 END) AS debits,
                   SUM(CASE WHEN direction='CREDIT' THEN amount ELSE 0 END) AS credits
FROM postings
GROUP BY journal_id
HAVING debits != credits;
-- MUST return 0 rows
```

### Invariant 2: Hash Integrity

**For every ledger event, the postings_hash matches the computed hash:**

```python
for event in ledger_events:
    assert event.postings_hash == compute_postings_hash(event)
```

### Invariant 3: Replay Consistency

**Replaying postings yields current account balances:**

```python
for account in accounts:
    replayed_balance = sum_postings_for_account(account.account_id)
    assert account.balance == replayed_balance
```

---

## Next Steps

1. Read [Part 3 - Event Model](part3_events.md) for domain event patterns
2. Review [Part 4 - State Model](part4_state.md) for projection architecture
3. Study [Part 5 - Replay & Determinism](part5_replay.md) for recovery procedures

---

**Money = Ledger. No exceptions.**
