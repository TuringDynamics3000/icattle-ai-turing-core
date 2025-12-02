# Part 10 — RedBelly Trust Layer (RBL)

## Overview

RedBelly provides **cryptographic notarization** of critical state transitions.

**Core Principle:** Trust is cryptographic, not cultural.

---

## 10.1 What RedBelly Notarizes

RBL provides tamper-proof history for:

- **Ledger events** — All monetary movements
- **Projections** — Snapshots of projection state
- **Agent decisions** — All AI/ML decisions
- **ML lineage** — Model training and deployment
- **DataMesh schemas** — Schema versions and changes
- **MCP policy actions** — Policy decisions and enforcement

---

## 10.2 RBL Commit Flow

### Step 1: MCP Forms RBL Bundle

```python
def form_rbl_bundle():
    """
    Form bundle of events to commit to RedBelly.
    """
    bundle = {
        "ledger_events": fetch_uncommitted_ledger_events(),
        "domain_events": fetch_uncommitted_domain_events(),
        "agent_decisions": fetch_uncommitted_agent_decisions(),
        "timestamp": now(),
    }
    return bundle
```

### Step 2: Compute Merkle Root

```python
def compute_merkle_root(bundle):
    """
    Compute Merkle root of bundle.
    """
    # Hash each event
    event_hashes = [sha256(json.dumps(e)) for e in bundle["ledger_events"]]
    
    # Build Merkle tree
    merkle_tree = build_merkle_tree(event_hashes)
    
    # Return root
    return merkle_tree.root
```

### Step 3: Submit to RedBelly Network

```python
def submit_to_redbelly(merkle_root):
    """
    Submit Merkle root to RedBelly network.
    """
    response = redbelly_client.submit(
        data=merkle_root,
        metadata={"source": "TuringCore", "timestamp": now()},
    )
    
    return response.tx_id
```

### Step 4: RedBelly Finalizes with Consensus

RedBelly network:
1. Validates the submission
2. Achieves consensus (Byzantine Fault Tolerant)
3. Finalizes the transaction
4. Returns attestation

### Step 5: Store RBL Attestation

```python
def store_rbl_attestation(bundle, tx_id, attestation):
    """
    Store RBL attestation in local database.
    """
    db.execute(
        """
        INSERT INTO rbl_commitments (
          bundle_id, merkle_root, rbl_tx_id, rbl_block_hash, rbl_attestation, committed_at
        )
        VALUES (%s, %s, %s, %s, %s, now())
        """,
        (
            bundle.id,
            bundle.merkle_root,
            tx_id,
            attestation.block_hash,
            json.dumps(attestation),
        ),
    )
```

---

## 10.3 RBL Schema

```sql
CREATE TABLE rbl_commitments (
  commitment_id   UUID PRIMARY KEY,
  bundle_id       UUID NOT NULL,
  merkle_root     TEXT NOT NULL,
  rbl_tx_id       TEXT NOT NULL,
  rbl_block_hash  TEXT NOT NULL,
  rbl_attestation JSONB NOT NULL,
  committed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 10.4 Benefits

### 1. Non-Repudiation

Once committed to RedBelly, events cannot be denied:

```
"This ledger event was committed to RedBelly at block 12345, tx abc123"
```

### 2. Tamper-Proof History

Any tampering is detectable:

```python
def verify_rbl_commitment(commitment_id):
    """
    Verify that local events match RedBelly commitment.
    """
    commitment = db.query("SELECT * FROM rbl_commitments WHERE commitment_id = %s", (commitment_id,))
    
    # Recompute Merkle root
    bundle = reconstruct_bundle(commitment.bundle_id)
    recomputed_root = compute_merkle_root(bundle)
    
    # Verify
    if commitment.merkle_root != recomputed_root:
        raise TamperDetected(f"Merkle root mismatch: {commitment_id}")
```

### 3. Multi-Party Trust

Multiple parties can verify the same commitment:

```
Regulator: "Show me proof that this ledger event occurred"
Bank: "Here's the RedBelly attestation: block 12345, tx abc123"
Regulator: "Verified ✓"
```

### 4. Regulator-Verifiable Integrity

Regulators can independently verify:

```python
def regulator_verify(rbl_tx_id):
    """
    Regulator independently verifies RedBelly commitment.
    """
    # Query RedBelly network
    attestation = redbelly_client.get_transaction(rbl_tx_id)
    
    # Verify attestation
    if attestation.status == "FINALIZED":
        return "VERIFIED"
    else:
        return "NOT_VERIFIED"
```

---

## 10.5 Commitment Frequency

RBL commitments are batched:

- **Ledger events** — Every 1 minute or 1000 events
- **Domain events** — Every 5 minutes or 5000 events
- **Agent decisions** — Every 10 minutes or 1000 decisions

---

## Next Steps

1. Read [Part 11 - Conformance](part11_conformance.md) for compliance checklist

---

**Trust is cryptographic, not cultural.**
