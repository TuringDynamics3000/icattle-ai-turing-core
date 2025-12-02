# Turing Protocol v3 — Implementation Examples

This document provides concrete implementation examples from the **TuringCore-v3** reference implementation.

**Repository:** https://github.com/TuringDynamics3000/TuringCore-v3

---

## Table of Contents

1. [Ledger Implementation](#ledger-implementation)
2. [Card Auth Implementation](#card-auth-implementation)
3. [Disputes Implementation](#disputes-implementation)
4. [Replay Tools](#replay-tools)

---

## Ledger Implementation

### Migration: Canonical Ledger Events

**File:** `migrations/110_ledger_events_turing_protocol.sql`

```sql
CREATE TABLE ledger_events (
  seq_id           BIGSERIAL PRIMARY KEY,
  event_id         UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  occurred_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  journal_id       UUID NOT NULL REFERENCES journals(journal_id),
  ledger_name      TEXT NOT NULL,
  event_type       TEXT NOT NULL,
  event_ref        TEXT NOT NULL,
  idempotency_key  TEXT NOT NULL UNIQUE,
  correlation_id   TEXT,
  causation_id     TEXT,
  postings_hash    TEXT NOT NULL,
  payload_json     JSONB NOT NULL,
  schema_version   INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_ledger_events_journal_id ON ledger_events(journal_id);
CREATE INDEX idx_ledger_events_occurred_at ON ledger_events(occurred_at);
CREATE INDEX idx_ledger_events_idempotency_key ON ledger_events(idempotency_key);
```

### Imperative Shell: Postings Apply

**File:** `modules/ledger/imperative_shell/postings_apply.py`

```python
def postings_apply(posting_set: PostingSet) -> Tuple[str, str]:
    """
    Apply PostingSet atomically with ledger event emission.
    Returns (journal_id, ledger_event_id) for domain event linkage.
    """
    with db.transaction(isolation="SERIALIZABLE"):
        # 1. Validate PostingSet
        validate_posting_set(posting_set)
        
        # 2. Check idempotency
        existing = check_idempotency(posting_set.idempotency_key)
        if existing:
            return existing.journal_id, existing.ledger_event_id
        
        # 3. Lock affected accounts
        accounts = lock_accounts([p.account_id for p in posting_set.postings])
        
        # 4. Check balances
        check_sufficient_funds(posting_set, accounts)
        
        # 5. Create journal
        journal_id = create_journal(posting_set)
        
        # 6. Insert postings
        insert_postings(journal_id, posting_set.postings)
        
        # 7. Update account balances
        update_balances(posting_set.postings)
        
        # 8. Compute postings hash
        postings_hash = compute_postings_hash(posting_set)
        
        # 9. Emit canonical ledger event
        ledger_event_id = emit_ledger_event(
            journal_id=journal_id,
            posting_set=posting_set,
            postings_hash=postings_hash,
        )
        
        # 10. Record idempotency
        record_idempotency(posting_set.idempotency_key, journal_id, ledger_event_id)
        
        return journal_id, ledger_event_id
```

### Hash Computation

**File:** `modules/ledger/imperative_shell/postings_apply.py`

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

---

## Card Auth Implementation

### Migration: Card Auth Domain Events

**File:** `migrations/111_card_auth_domain_events.sql`

```sql
CREATE TABLE card_auth_domain_events (
  seq_id                BIGSERIAL PRIMARY KEY,
  occurred_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
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

CREATE INDEX idx_card_auth_events_auth_id ON card_auth_domain_events(auth_id);
CREATE INDEX idx_card_auth_events_occurred_at ON card_auth_domain_events(occurred_at);
```

### Event Emission Helpers

**File:** `modules/card_auth/imperative_shell/card_auth_events.py`

```python
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

### Card Clear Flow

**File:** `modules/card_auth/imperative_shell/card_clear.py`

```python
def card_clear(auth_id: str):
    """
    Clear card authorization with ledger posting and domain event.
    """
    with db.transaction():
        # 1. Get authorization hold
        hold = db.query("SELECT * FROM card_auth_holds WHERE auth_id = %s", (auth_id,))
        
        # 2. Execute ledger posting (returns journal_id, ledger_event_id)
        journal_id, ledger_event_id = run_card_auth_posting(
            source_account_id=hold.card_account_id,
            destination_account_id=hold.merchant_account_id,
            amount=hold.amount,
            currency=hold.currency,
            event_ref=auth_id,
            idempotency_key=f"card-clear:{auth_id}",
            description=f"CARD_AUTH_CLEARED {auth_id}",
        )
        
        # 3. Emit domain event with ledger linkage
        emit_card_auth_cleared(
            cur,
            auth_id=auth_id,
            card_account_id=hold.card_account_id,
            merchant_account_id=hold.merchant_account_id,
            amount=hold.amount,
            currency=hold.currency,
            journal_id=journal_id,
            ledger_event_id=ledger_event_id,
            extra={"clearing_timestamp": now()},
        )
        
        # 4. Update projection
        db.execute(
            "UPDATE card_auth_holds SET state='CLEARED', cleared_amount=%s WHERE auth_id=%s",
            (hold.amount, auth_id)
        )
```

### Card Auth Projector

**File:** `modules/card_auth/imperative_shell/card_auth_projector.py`

```python
#!/usr/bin/env python3
"""
Card Auth Projector: Rebuild card_auth_holds from card_auth_domain_events.
"""

def rebuild():
    """Full rebuild: truncate and replay all events."""
    with db.transaction():
        # 1. Truncate projection
        db.execute("TRUNCATE TABLE card_auth_holds")
        
        # 2. Fetch all events
        events = db.query(
            "SELECT * FROM card_auth_domain_events ORDER BY seq_id"
        )
        
        # 3. Apply each event
        for event in events:
            apply_event(event)

def apply_event(event):
    """Apply a single event to the projection."""
    if event.event_type == "CARD_AUTH_HELD":
        db.execute(
            """
            INSERT INTO card_auth_holds (
              auth_id, card_account_id, merchant_account_id,
              amount, currency, state, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                event.auth_id,
                event.card_account_id,
                event.merchant_account_id,
                event.amount,
                event.currency,
                "HELD",
                event.occurred_at,
                event.occurred_at,
            ),
        )
    elif event.event_type == "CARD_AUTH_CLEARED":
        db.execute(
            """
            UPDATE card_auth_holds
               SET state = 'CLEARED',
                   cleared_amount = %s,
                   updated_at = %s
             WHERE auth_id = %s
            """,
            (event.amount, event.occurred_at, event.auth_id),
        )
    # ... handle other event types

if __name__ == "__main__":
    import sys
    if "--rebuild" in sys.argv:
        rebuild()
    elif "--verify" in sys.argv:
        verify()
```

---

## Disputes Implementation

### Migration: Disputes Domain Events

**File:** `migrations/112_disputes_domain_events.sql`

```sql
CREATE TABLE disputes_domain_events (
  seq_id                BIGSERIAL PRIMARY KEY,
  occurred_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
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

CREATE INDEX idx_disputes_events_dispute_id ON disputes_domain_events(dispute_id);
CREATE INDEX idx_disputes_events_occurred_at ON disputes_domain_events(occurred_at);
```

### Chargeback Flow

**File:** `modules/disputes/imperative_shell/chargeback_apply.py`

```python
def chargeback_apply(dispute_id: str):
    """
    Apply chargeback with ledger posting and domain event.
    """
    with db.transaction():
        # 1. Get dispute
        dispute = db.query("SELECT * FROM disputes WHERE dispute_id = %s", (dispute_id,))
        
        # 2. Execute ledger posting (returns journal_id, ledger_event_id)
        journal_id, ledger_event_id = run_chargeback_posting(
            merchant_account_id=dispute.merchant_account_id,
            cardholder_account_id=dispute.cardholder_account_id,
            amount=dispute.amount,
            currency=dispute.currency,
            event_ref=dispute_id,
            idempotency_key=f"chargeback:{dispute_id}",
            description=f"CHARGEBACK_POSTED {dispute_id}",
        )
        
        # 3. Emit domain event with ledger linkage
        emit_chargeback_posted(
            cur,
            dispute_id=dispute_id,
            cardholder_account_id=dispute.cardholder_account_id,
            merchant_account_id=dispute.merchant_account_id,
            amount=dispute.amount,
            currency=dispute.currency,
            journal_id=journal_id,
            ledger_event_id=ledger_event_id,
            extra={"timestamp": now()},
        )
        
        # 4. Update projection
        db.execute(
            "UPDATE disputes SET state='CHARGEBACK_POSTED' WHERE dispute_id=%s",
            (dispute_id,)
        )
```

---

## Replay Tools

### Ledger Replay Tool

**File:** `tools/replay/rebuild_accounts_from_postings.py`

```python
#!/usr/bin/env python3
"""
Rebuild account balances from ledger_events (postings).
"""

def rebuild():
    """Full rebuild: reset balances and replay all postings."""
    with db.transaction():
        # 1. Reset all balances to zero
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

def verify_integrity():
    """Verify that all ledger events have valid hashes."""
    events = db.query("SELECT * FROM ledger_events ORDER BY seq_id")
    
    for event in events:
        posting_set = reconstruct_posting_set(event)
        computed_hash = compute_postings_hash(posting_set)
        
        if event.postings_hash != computed_hash:
            raise IntegrityError(f"Hash mismatch for event {event.event_id}")

if __name__ == "__main__":
    import sys
    if "--rebuild" in sys.argv:
        rebuild()
    elif "--verify-integrity" in sys.argv:
        verify_integrity()
```

---

## Summary

All implementation examples follow the **Turing Protocol v3** pattern:

1. **Ledger events** are canonical (hash-protected, immutable)
2. **Domain events** reference ledger events for monetary operations
3. **Projections** are rebuilt from events (deterministic replay)
4. **Replay tools** verify integrity and consistency

**This is not philosophy. This is structure.**

For complete implementation, see: https://github.com/TuringDynamics3000/TuringCore-v3
