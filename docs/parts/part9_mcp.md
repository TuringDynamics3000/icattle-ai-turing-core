# Part 9 — Modern Control Plane (MCP)

## Overview

MCP enforces Protocol correctness **at runtime**.

**Core Principle:** Protocol enforcement is automated, not manual.

---

## 9.1 MCP Planes

### 1. Orchestration Plane

Manages jobs, agents, and workflows:

- **Job scheduling** — Cron jobs, event-driven jobs
- **Agent orchestration** — Agent lifecycle management
- **Workflow execution** — Multi-step workflows

### 2. Observation Plane

Monitors metrics, logs, traces, and drift:

- **Metrics** — Prometheus, Grafana
- **Logs** — Structured logging (JSON)
- **Traces** — Distributed tracing (OpenTelemetry)
- **Drift detectors** — Model drift, feature drift, prediction drift

### 3. Governance Plane

Enforces TL runtime policies:

- **Policy adjudication** — Evaluate policies before execution
- **Feature privacy** — PII masking, anonymization
- **Bias detection** — Monitor feature distributions

### 4. Reliability Plane

Ensures system resilience:

- **Replay** — Rebuild projections from events
- **Divergence repair** — Detect and fix projection drift
- **Failover** — Automatic failover to standby
- **Chaos testing** — Inject failures to test resilience
- **Projection rehydration** — Rebuild projections after crash

### 5. Security & Identity Plane

Enforces zero-trust security:

- **Zero-trust IAM** — Authenticate and authorize every request
- **KMS encryption** — Encrypt data at rest and in transit
- **Data minimization gates** — Limit data exposure

---

## 9.2 Runtime Protocol Enforcement

MCP enforces Protocol invariants at runtime:

### Invariant 1: Monetary Invariant

**All money movements MUST flow through PostingSets:**

```python
def enforce_monetary_invariant():
    """
    Detect direct balance mutations (Protocol violation).
    """
    # Check for UPDATE statements on accounts.balance
    violations = db.query(
        """
        SELECT query, timestamp
        FROM pg_stat_statements
        WHERE query LIKE '%UPDATE accounts SET balance%'
          AND query NOT LIKE '%postings_apply%'
        """
    )
    
    if violations:
        alert("PROTOCOL VIOLATION: Direct balance mutation detected")
        raise ProtocolViolation(violations)
```

### Invariant 2: Event Immutability

**No events can be updated or deleted:**

```python
def enforce_event_immutability():
    """
    Detect event mutations (Protocol violation).
    """
    violations = db.query(
        """
        SELECT table_name, operation, timestamp
        FROM audit_log
        WHERE table_name LIKE '%_domain_events'
          AND operation IN ('UPDATE', 'DELETE')
        """
    )
    
    if violations:
        alert("PROTOCOL VIOLATION: Event mutation detected")
        raise ProtocolViolation(violations)
```

### Invariant 3: Hash Integrity

**All ledger events MUST have valid hashes:**

```python
def enforce_hash_integrity():
    """
    Verify that all ledger events have valid hashes.
    """
    events = db.query("SELECT * FROM ledger_events ORDER BY seq_id")
    
    for event in events:
        posting_set = reconstruct_posting_set(event)
        computed_hash = compute_postings_hash(posting_set)
        
        if event.postings_hash != computed_hash:
            alert(f"PROTOCOL VIOLATION: Hash mismatch for event {event.event_id}")
            raise ProtocolViolation(f"Hash mismatch: {event.event_id}")
```

---

## 9.3 Self-Healing

MCP automatically repairs divergences:

```python
def self_heal():
    """
    Detect and repair projection divergences.
    """
    projections = ["card_auth_holds", "disputes", "loan_positions"]
    
    for projection in projections:
        # Detect divergences
        divergences = detect_divergences(projection)
        
        # If divergences found, rebuild
        if divergences:
            alert(f"Divergence detected in {projection}: {len(divergences)} rows")
            rebuild_projection(projection)
            log(f"Self-healed {projection}")
```

---

## 9.4 Chaos Testing

MCP injects failures to test resilience:

```python
def chaos_test():
    """
    Inject random failures to test system resilience.
    """
    # Kill random pod
    kill_random_pod()
    
    # Verify system recovers
    wait_for_recovery()
    
    # Verify projections are consistent
    verify_all_projections()
```

---

## Next Steps

1. Read [Part 10 - RedBelly](part10_redbelly.md) for cryptographic verification
2. Review [Part 11 - Conformance](part11_conformance.md) for compliance checklist

---

**Protocol enforcement is automated, not manual.**
