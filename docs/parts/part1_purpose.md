# Part 1 — Purpose & Scope

## Overview

The **Turing Protocol v3** defines the minimum non-negotiable requirements for a financial core that is:

- **Ledger-perfect** — All monetary state transitions occur via PostingSets
- **Event-sourced** — Domain behavior captured in immutable event streams
- **Replayable** — State can be deterministically reconstructed from events
- **AI-native** — Agentic AI and ML models are first-class citizens
- **Fully governed** — Turing Layer (TL) enforces regulatory compliance
- **Cryptographically verifiable** — RedBelly provides tamper-proof history

---

## Compliance Definition

A deployment that violates any Protocol invariant is **non-compliant**.

### Core Invariants

1. **Monetary Invariant**: All money movements MUST flow through PostingSets
2. **Event Invariant**: All domain events MUST be immutable and append-only
3. **Hash Invariant**: All ledger events MUST have valid `postings_hash`
4. **Replay Invariant**: All projections MUST satisfy `live_state == replay(events)`
5. **Linkage Invariant**: All monetary domain events MUST reference `ledger_event_id`

---

## Why Turing Protocol v3?

### The Problem with Traditional Cores

Traditional banking cores (Temenos, Mambu, ThoughtMachine, FIS, Fiserv) suffer from:

- **Mutable state** — Direct database updates without event history
- **Cultural event sourcing** — Events are emitted as side effects (can be skipped)
- **No replay capability** — Cannot reconstruct state from events
- **No hash integrity** — No cryptographic verification of ledger operations
- **AI bolted on** — ML models are not structurally integrated
- **No governance layer** — Regulatory compliance is manual

### The Turing Protocol Solution

Turing Protocol v3 makes event sourcing and ledger integrity **structural properties**, not cultural practices:

```
Traditional Core:              Turing Protocol v3:
┌─────────────────┐           ┌─────────────────────────┐
│ Mutable Tables  │           │ Immutable Event Streams │
│ (source of      │           │ (source of truth)       │
│  truth)         │           └───────────┬─────────────┘
└────────┬────────┘                       │
         │                                │
         ▼                                ▼
┌─────────────────┐           ┌─────────────────────────┐
│ Events (maybe)  │           │ Projections (derived)   │
│ (side effect)   │           │ (query-optimized)       │
└─────────────────┘           └─────────────────────────┘
```

---

## Scope

The Turing Protocol v3 specification covers:

### 1. Ledger Model (Part 2)
- PostingSet definition and validation
- Canonical ledger events (`ledger_events` table)
- Hash-based integrity (`postings_hash`)
- Idempotency and concurrency control

### 2. Event Model (Part 3)
- Domain event streams (card auth, disputes, lending, payments)
- Event immutability enforcement
- Ledger linkage for monetary events

### 3. State Model (Part 4)
- Projections as derived state
- Projection rebuilders (deterministic replay)
- Consistency verification

### 4. Replay & Determinism (Part 5)
- Replay tools and algorithms
- Divergence detection
- Crash recovery procedures

### 5. Agentic AI & ML (Part 6)
- Agent architecture (Allocator, Credit Oracle, Fraud Sentinel, etc.)
- ML model lineage and drift detection
- Explainability records

### 6. Turing Layer (Part 7)
- Regulatory compliance enforcement (ASIC RG255/277, AML/CTF)
- Policy gating for agents
- Explainability and auditability

### 7. DataMesh (Part 8)
- Event-backed data products
- Schema versioning and SLAs
- Lineage and governance

### 8. Modern Control Plane (Part 9)
- Orchestration, Observation, Governance, Reliability, Security planes
- Runtime Protocol enforcement
- Projection rehydration and failover

### 9. RedBelly Trust Layer (Part 10)
- Cryptographic notarization of events
- Merkle root commitments
- Non-repudiation and multi-party trust

### 10. Conformance (Part 11)
- Compliance checklist
- Competitive positioning
- Certification criteria

---

## Target Audience

This specification is for:

- **Platform Engineers** — Building financial cores
- **Regulators** — Auditing compliance (APRA CPS 230/234, ASIC RG255/277)
- **AI/ML Engineers** — Integrating models with governance
- **Data Engineers** — Building event-backed data products
- **Security Teams** — Implementing zero-trust and cryptographic verification

---

## Non-Goals

The Turing Protocol v3 does NOT specify:

- **UI/UX** — User interfaces are implementation-specific
- **Deployment topology** — Can run on-prem, cloud, or hybrid
- **Programming language** — Reference implementation is Python, but any language works
- **Database vendor** — PostgreSQL is recommended, but not required

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

## Next Steps

1. Read [Part 2 - Ledger Model](part2_ledger.md) to understand PostingSets and hash integrity
2. Review [Part 3 - Event Model](part3_events.md) for domain event patterns
3. Explore [Part 4 - State Model](part4_state.md) for projection architecture
4. Study [Part 5 - Replay & Determinism](part5_replay.md) for recovery procedures

---

**This is not philosophy. This is structure.**
