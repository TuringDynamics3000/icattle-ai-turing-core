# Turing Protocol v3

**AI-Native | Ledger-Centric | Cryptographically Verifiable**

**Version:** 3.0  
**Status:** Production Ready  
**Release Date:** December 2025

---

## Overview

The **Turing Protocol v3** is the specification for a financial core that is:

- **Ledger-perfect** — All monetary state transitions occur via PostingSets
- **Event-sourced** — Domain behavior captured in immutable event streams (structurally, not culturally)
- **Replayable** — State can be deterministically reconstructed from events
- **AI-native** — Agentic AI and ML models are first-class citizens with governance
- **Fully governed** — Turing Layer (TL) enforces regulatory compliance at runtime
- **Cryptographically verifiable** — RedBelly provides tamper-proof history

---

## Why Turing Protocol v3?

Traditional banking cores (Temenos, Mambu, ThoughtMachine, FIS, Fiserv) suffer from:

- ❌ **Mutable state** — Direct database updates without event history
- ❌ **Cultural event sourcing** — Events are emitted as side effects (can be skipped)
- ❌ **No replay capability** — Cannot reconstruct state from events
- ❌ **No hash integrity** — No cryptographic verification of ledger operations
- ❌ **AI bolted on** — ML models are not structurally integrated
- ❌ **No governance layer** — Regulatory compliance is manual

**Turing Protocol v3 solves all of these problems structurally.**

---

## Core Invariants

A deployment is **Protocol-compliant** only if it satisfies:

1. **Monetary Invariant**: All money movements MUST flow through PostingSets
2. **Event Invariant**: All domain events MUST be immutable and append-only
3. **Hash Invariant**: All ledger events MUST have valid `postings_hash`
4. **Replay Invariant**: All projections MUST satisfy `live_state == replay(events)`
5. **Linkage Invariant**: All monetary domain events MUST reference `ledger_event_id`

---

## Documentation

### Specification (11 Parts)

1. **[Purpose & Scope](docs/parts/part1_purpose.md)** — Why Turing Protocol v3 exists
2. **[Ledger Model](docs/parts/part2_ledger.md)** — PostingSets, hash integrity, FCIS pattern
3. **[Event Model](docs/parts/part3_events.md)** — Domain events, immutability, ledger linkage
4. **[State Model](docs/parts/part4_state.md)** — Projections, rebuilders, consistency verification
5. **[Replay & Determinism](docs/parts/part5_replay.md)** — Crash recovery, audit, divergence detection
6. **[Agentic AI & ML](docs/parts/part6_ai_ml.md)** — Agent architecture, lineage, drift detection
7. **[Turing Layer (TL)](docs/parts/part7_tl.md)** — Regulatory compliance, explainability, policy gating
8. **[DataMesh](docs/parts/part8_datamesh.md)** — Event-backed data products, schema versioning, SLAs
9. **[Modern Control Plane (MCP)](docs/parts/part9_mcp.md)** — Runtime enforcement, self-healing, chaos testing
10. **[RedBelly Trust Layer](docs/parts/part10_redbelly.md)** — Cryptographic notarization, Merkle roots
11. **[Conformance & Competitive Positioning](docs/parts/part11_conformance.md)** — Compliance checklist, certification

### Additional Resources

- **[Implementation Examples](docs/implementation_examples.md)** — Code examples from TuringCore-v3
- **[Whitepaper](docs/Turing_Protocol_v3_Whitepaper.md)** — Complete specification in single document

---

## Reference Implementation

**TuringCore-v3** is the canonical reference implementation:

**Repository:** https://github.com/TuringDynamics3000/TuringCore-v3

### Key Commits

- **Ledger Protocol:** [b5a4e54](https://github.com/TuringDynamics3000/TuringCore-v3/commit/b5a4e54) — SHARPER Turing Protocol with hash-based integrity
- **Card Auth Protocol:** [4d6fc6d](https://github.com/TuringDynamics3000/TuringCore-v3/commit/4d6fc6d) — Protocol-grade card authorization with domain events
- **Disputes Protocol:** [f5d7063](https://github.com/TuringDynamics3000/TuringCore-v3/commit/f5d7063) — Protocol-grade disputes with projections

---

## Quick Start

### 1. Read the Specification

Start with [Part 1 - Purpose & Scope](docs/parts/part1_purpose.md) to understand the goals and principles.

### 2. Review Implementation Examples

See [Implementation Examples](docs/implementation_examples.md) for concrete code from TuringCore-v3.

### 3. Run Conformance Tests

```bash
# Clone reference implementation
git clone https://github.com/TuringDynamics3000/TuringCore-v3.git
cd TuringCore-v3

# Run conformance tests
pytest tests/turing_protocol/test_turing_protocol_conformance.py -v
```

### 4. Verify Replay Capability

```bash
# Rebuild account balances from postings
python tools/replay/rebuild_accounts_from_postings.py --rebuild

# Verify hash integrity
python tools/replay/rebuild_accounts_from_postings.py --verify-integrity

# Rebuild card auth projection
python modules/card_auth/imperative_shell/card_auth_projector.py --rebuild

# Rebuild disputes projection
python modules/disputes/imperative_shell/disputes_projector.py --rebuild
```

---

## Competitive Positioning

| Feature | Temenos | Mambu | ThoughtMachine | FIS | Fiserv | **Turing Protocol v3** |
|---------|---------|-------|----------------|-----|--------|------------------------|
| **Event Sourcing** | Cultural | Cultural | Cultural | No | No | **Structural** |
| **Hash Integrity** | No | No | No | No | No | **Yes (SHA-256)** |
| **Replay Capability** | No | No | Partial | No | No | **Yes (Full)** |
| **AI Governance** | Bolt-on | Bolt-on | Bolt-on | No | No | **Native (TL)** |
| **DataMesh** | No | No | No | No | No | **Yes** |
| **MCP Enforcement** | No | No | No | No | No | **Yes** |
| **RedBelly Notarization** | No | No | No | No | No | **Yes** |

**Turing Protocol v3 is the only financial core that is structurally event-sourced, replayable, AI-native, and cryptographically verifiable.**

---

## Certification

Organizations can be **Turing Protocol Certified** if they:

1. ✅ Pass all conformance tests
2. ✅ Have automated Protocol enforcement (MCP)
3. ✅ Have RedBelly commitments for critical events
4. ✅ Have regulator-verifiable audit trail

---

## Key Principles

### 1. Structure Over Culture

Event sourcing is a **structural property** enforced by database triggers and schema design, not a cultural practice that can be bypassed.

### 2. Money = Ledger

All monetary movements MUST flow through the canonical `ledger_events` table. No exceptions.

### 3. Behavior = Events

All domain behavior MUST be captured in immutable event streams. Projections are derived, not primary.

### 4. Storage = Projections

All query-optimized tables are projections that can be rebuilt from events.

### 5. AI = Governed

All AI/ML decisions MUST have lineage, explainability, and drift detection.

### 6. Trust = Cryptographic

All critical state transitions MUST be cryptographically notarized via RedBelly.

---

## Versioning

**Current Version:** 3.0  
**Release Date:** December 2025  
**Status:** Production Ready

### Version History

- **v1.0** (2023) — Initial ledger model and event sourcing
- **v2.0** (2024) — Added AI/ML governance and DataMesh
- **v3.0** (2025) — Added RedBelly Trust Layer and MCP enforcement

---

## Contributing

This is a **specification repository**. For implementation contributions, see:

- **TuringCore-v3:** https://github.com/TuringDynamics3000/TuringCore-v3

For specification improvements, please:

1. Open an issue describing the proposed change
2. Reference specific invariants or principles affected
3. Provide implementation examples if applicable

---

## License

This specification is released under the **MIT License**.

Reference implementations may have different licenses.

---

## Contact

For questions or feedback:

- **GitHub Issues:** https://github.com/TuringDynamics3000/TuringProtocol_v3_repo/issues
- **Reference Implementation:** https://github.com/TuringDynamics3000/TuringCore-v3

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

---

**Read the specification:** [docs/parts/part1_purpose.md](docs/parts/part1_purpose.md)  
**See implementation examples:** [docs/implementation_examples.md](docs/implementation_examples.md)  
**Explore reference implementation:** https://github.com/TuringDynamics3000/TuringCore-v3
