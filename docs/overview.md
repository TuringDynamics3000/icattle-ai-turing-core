# Turing Protocol v3 — Overview

**AI-Native | Ledger-Centric | Cryptographically Verifiable**

---

## What is the Turing Protocol?

The **Turing Protocol v3** is a specification for building financial cores that are:

1. **Structurally event-sourced** — Event sourcing is enforced by database schema, not culture
2. **Hash-verified** — All ledger operations have cryptographic integrity (SHA-256)
3. **Fully replayable** — State can be deterministically reconstructed from events
4. **AI-native** — Agentic AI and ML models are governed first-class citizens
5. **Compliance-enforced** — Regulatory requirements are structural, not manual
6. **Cryptographically notarized** — Critical events are committed to RedBelly blockchain

---

## The Problem with Traditional Cores

Traditional banking cores (Temenos, Mambu, ThoughtMachine, FIS, Fiserv) have fundamental architectural flaws:

### 1. Cultural Event Sourcing

Events are emitted as **side effects** that can be skipped:

```python
# Traditional core (WRONG)
db.execute("UPDATE accounts SET balance = balance - 100")
emit_event("BALANCE_UPDATED")  # Optional, can be skipped
```

**Result:** Incomplete event history, no replay capability.

### 2. No Hash Integrity

No cryptographic verification of ledger operations:

```
Q: "How do we know this ledger event is valid?"
A: "We trust the database."
```

**Result:** No tamper detection, no regulator verification.

### 3. No Replay Capability

Cannot rebuild state from events:

```
Q: "Can you rebuild account balances from scratch?"
A: "No, balances are the source of truth."
```

**Result:** No crash recovery, no audit trail verification.

### 4. AI Bolted On

ML models are added as an afterthought:

```
Q: "Where's your ML model lineage?"
A: "We don't track that."
```

**Result:** No explainability, no drift detection, no governance.

---

## The Turing Protocol Solution

### 1. Structural Event Sourcing

Events are **mandatory**, not optional:

```python
# Turing Protocol (CORRECT)
journal_id, ledger_event_id = postings_apply(posting_set)  # Event is atomic
```

**Database triggers prevent direct mutations:**

```sql
CREATE TRIGGER enforce_event_immutability
  BEFORE UPDATE OR DELETE ON ledger_events
  FOR EACH ROW EXECUTE FUNCTION prevent_event_mutation();
```

**Result:** Complete event history, full replay capability.

### 2. Hash Integrity

Every ledger event has a **SHA-256 hash**:

```python
postings_hash = sha256(canonical_postings)
```

**Verification:**

```python
if event.postings_hash != compute_postings_hash(event):
    raise IntegrityError("Tamper detected")
```

**Result:** Cryptographic tamper detection, regulator verification.

### 3. Full Replay Capability

State is **computed from events**, not stored:

```bash
# Rebuild account balances from postings
python tools/replay/rebuild_accounts_from_postings.py --rebuild
```

**Result:** Crash recovery, audit trail verification, divergence detection.

### 4. AI-Native Governance

ML models are **first-class citizens** with:

- **Lineage tracking** — Every model version is recorded
- **Inference events** — Every prediction is logged
- **Drift detection** — Feature and prediction drift are monitored
- **Explainability** — Every decision has a rationale

**Result:** Regulatory compliance (ASIC RG255/277), auditability, trust.

---

## Architecture

### The Turing Protocol Pattern

```
Command → Domain Event → Projection
           ↓
      (if money moves)
           ↓
      Ledger Event → Journal → Postings
```

### Example: Card Authorization Clearing

```python
# 1. Execute ledger posting (returns journal_id, ledger_event_id)
journal_id, ledger_event_id = run_card_auth_posting(
    source_account_id=card_account,
    destination_account_id=merchant_account,
    amount=100.00,
    currency="AUD",
    event_ref=auth_id,
    idempotency_key=f"card-clear:{auth_id}",
)

# 2. Emit domain event with ledger linkage
emit_card_auth_cleared(
    cur,
    auth_id=auth_id,
    card_account_id=card_account,
    merchant_account_id=merchant_account,
    amount=100.00,
    currency="AUD",
    journal_id=journal_id,           # Link to ledger
    ledger_event_id=ledger_event_id, # Link to ledger
)

# 3. Update projection
db.execute("UPDATE card_auth_holds SET state='CLEARED' WHERE auth_id=%s", (auth_id,))
```

**Audit trail:**

```
Domain Event (CARD_AUTH_CLEARED)
  ├─> journal_id (550e8400-...)
  └─> ledger_event_id (660e8400-...)
        ├─> postings_hash (a3f2b1c...)
        └─> journal (550e8400-...)
              ├─> posting (DR card_account 100.00)
              └─> posting (CR merchant_account 100.00)
```

---

## Components

### 1. Ledger Model (Part 2)

- **PostingSets** — All money movements flow through PostingSets
- **Hash integrity** — SHA-256 verification of all postings
- **Idempotency** — Safe retries via `idempotency_key`
- **FCIS pattern** — Functional core (pure), imperative shell (side effects)

### 2. Event Model (Part 3)

- **Domain event streams** — Card auth, disputes, lending, payments
- **Immutability** — Database triggers prevent UPDATE/DELETE
- **Ledger linkage** — Monetary events reference `ledger_event_id`

### 3. State Model (Part 4)

- **Projections** — All mutable tables are derived from events
- **Rebuilders** — Deterministic replay from events
- **Consistency verification** — `live_state == replay(events)`

### 4. Replay & Determinism (Part 5)

- **Crash recovery** — Rebuild state after failure
- **Audit verification** — Regulators can verify history
- **Divergence detection** — Detect drift between live and replayed state

### 5. Agentic AI & ML (Part 6)

- **Agent architecture** — Allocator, Credit Oracle, Fraud Sentinel, etc.
- **ML lineage** — Model training, deployment, inference events
- **Drift detection** — Feature drift, prediction drift
- **Explainability** — Every decision has a rationale

### 6. Turing Layer (Part 7)

- **Regulatory compliance** — ASIC RG255/277, AML/CTF, APRA CPS 230/234
- **Policy gating** — Agents must pass policy checks
- **Bias detection** — Monitor feature distributions
- **Explainability enforcement** — All decisions have rationale

### 7. DataMesh (Part 8)

- **Event-backed data products** — Projections of event streams
- **Schema versioning** — Semantic versioning (v1.2.3)
- **SLAs** — Latency, freshness, availability guarantees
- **Lineage** — Upstream events and transformations

### 8. Modern Control Plane (Part 9)

- **Orchestration** — Jobs, agents, workflows
- **Observation** — Metrics, logs, traces, drift detectors
- **Governance** — TL runtime enforcement
- **Reliability** — Replay, divergence repair, failover
- **Security** — Zero-trust IAM, KMS encryption

### 9. RedBelly Trust Layer (Part 10)

- **Cryptographic notarization** — Merkle roots committed to blockchain
- **Non-repudiation** — Events cannot be denied
- **Tamper-proof history** — Any tampering is detectable
- **Regulator verification** — Independent verification of commitments

### 10. Conformance (Part 11)

- **Compliance checklist** — Automated verification
- **Competitive positioning** — Comparison with traditional cores
- **Certification** — Turing Protocol Certified organizations

---

## Invariants

A system is **Protocol-compliant** only if it satisfies:

1. **Monetary Invariant**: All money movements MUST flow through PostingSets
2. **Event Invariant**: All domain events MUST be immutable and append-only
3. **Hash Invariant**: All ledger events MUST have valid `postings_hash`
4. **Replay Invariant**: All projections MUST satisfy `live_state == replay(events)`
5. **Linkage Invariant**: All monetary domain events MUST reference `ledger_event_id`

---

## Reference Implementation

**TuringCore-v3** is the canonical reference implementation:

- **Repository:** https://github.com/TuringDynamics3000/TuringCore-v3
- **Ledger Protocol:** [b5a4e54](https://github.com/TuringDynamics3000/TuringCore-v3/commit/b5a4e54)
- **Card Auth Protocol:** [4d6fc6d](https://github.com/TuringDynamics3000/TuringCore-v3/commit/4d6fc6d)
- **Disputes Protocol:** [f5d7063](https://github.com/TuringDynamics3000/TuringCore-v3/commit/f5d7063)

---

## Next Steps

1. **Read the specification:** Start with [Part 1 - Purpose & Scope](parts/part1_purpose.md)
2. **Review implementation examples:** See [Implementation Examples](implementation_examples.md)
3. **Explore reference implementation:** Clone [TuringCore-v3](https://github.com/TuringDynamics3000/TuringCore-v3)
4. **Run conformance tests:** Verify Protocol compliance

---

## Summary

**Turing Protocol v3 is the only financial core specification that is:**

✅ **Ledger-perfect** — All money flows through PostingSets  
✅ **Event-sourced (structurally)** — Database triggers enforce immutability  
✅ **Replayable** — State is computed from events, not stored  
✅ **AI-native** — Agents and ML models are first-class citizens  
✅ **Fully governed** — TL enforces compliance at runtime  
✅ **Cryptographically verifiable** — RedBelly provides tamper-proof history  

**This is not philosophy. This is structure.**

**No traditional core can make this claim.**
