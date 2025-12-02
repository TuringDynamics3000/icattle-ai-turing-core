# Part 6 — Agentic AI & ML

## Overview

Agentic AI and ML models are **first-class citizens** in the Turing Protocol.

**Core Principle:** Agents NEVER mutate state directly. They emit commands and events.

---

## 6.1 Agent Architecture

### Canonical Agents

| Agent | Responsibility | Outputs |
|-------|---------------|---------|
| **Allocator** | Credit limit allocation | LIMIT_ALLOCATED events |
| **Credit Oracle** | Credit risk scoring | CREDIT_SCORED events |
| **Fraud Sentinel** | Fraud detection | FRAUD_DETECTED events |
| **Dispute Adjudicator** | Dispute resolution | DISPUTE_ADJUDICATED events |
| **KYC/AML Agent** | Identity verification | KYC_VERIFIED, AML_FLAGGED events |
| **Ops Reconciliation Agent** | Ledger reconciliation | RECONCILIATION_COMPLETED events |

---

## 6.2 Agent Output Pattern

Agents emit three types of outputs:

### 1. Commands → PostingSets

For monetary operations:

```python
# Agent emits command
command = TransferCommand(
    ledger_name="LENDING",
    event_type="LOAN_ORIGINATED",
    source_account_id=pool_account,
    destination_account_id=borrower_account,
    money=Money(amount=10000, currency="AUD"),
    description="Loan originated by Allocator agent",
)

# Command is converted to PostingSet
posting_set = build_transfer_postings(command)

# PostingSet is applied atomically
journal_id, ledger_event_id = postings_apply(posting_set)
```

### 2. Domain Events

For non-monetary state changes:

```python
# Agent emits domain event
emit_credit_scored(
    cur,
    customer_id=customer_id,
    score=750,
    model_version="credit-oracle-v2.1",
    features={"income": 80000, "debt_ratio": 0.3, "credit_history_months": 48},
    confidence=0.92,
    rationale="Strong income, low debt ratio, established credit history",
)
```

### 3. AGENT_DECISION Events

For explainability and audit:

```python
emit_agent_decision(
    cur,
    agent_name="CreditOracle",
    decision_type="CREDIT_SCORE",
    entity_id=customer_id,
    model_version="credit-oracle-v2.1",
    features={"income": 80000, "debt_ratio": 0.3},
    output={"score": 750, "confidence": 0.92},
    rationale="Strong income, low debt ratio",
    timestamp=now,
)
```

---

## 6.3 ML Model Lineage

All ML models MUST emit lineage events:

### Model Training Event

```python
emit_model_trained(
    cur,
    model_name="CreditOracle",
    model_version="v2.1",
    training_dataset="credit-scores-2025-q1",
    algorithm="XGBoost",
    hyperparameters={"max_depth": 6, "learning_rate": 0.1},
    metrics={"auc": 0.87, "precision": 0.82, "recall": 0.79},
    trained_at=now,
)
```

### Model Deployment Event

```python
emit_model_deployed(
    cur,
    model_name="CreditOracle",
    model_version="v2.1",
    environment="production",
    deployed_at=now,
)
```

---

## 6.4 ML Inference Events

All ML inferences MUST be recorded:

```python
emit_model_inference(
    cur,
    model_name="CreditOracle",
    model_version="v2.1",
    input_features={"income": 80000, "debt_ratio": 0.3},
    output={"score": 750, "confidence": 0.92},
    inference_time_ms=45,
    timestamp=now,
)
```

**Replay uses past inference events, never recomputed values.**

This ensures:
- **Deterministic replay** — Same inference results every time
- **Auditability** — Complete history of all ML decisions
- **Explainability** — Features and outputs are recorded

---

## 6.5 Drift Detection

ML models MUST emit drift metrics:

### Feature Drift

```python
emit_feature_drift(
    cur,
    model_name="CreditOracle",
    model_version="v2.1",
    feature_name="income",
    training_mean=75000,
    production_mean=82000,
    drift_score=0.15,
    timestamp=now,
)
```

### Prediction Drift

```python
emit_prediction_drift(
    cur,
    model_name="CreditOracle",
    model_version="v2.1",
    training_distribution={"mean": 720, "std": 50},
    production_distribution={"mean": 735, "std": 48},
    drift_score=0.08,
    timestamp=now,
)
```

---

## 6.6 Explainability Records

All material decisions MUST produce an **Explainability Record**:

```python
class ExplainabilityRecord:
    decision_id: str
    agent_name: str
    model_version: str
    input_features: dict
    output: dict
    rationale: str
    confidence: float
    ledger_event_id: Optional[str]  # Link to ledger if monetary
    timestamp: datetime
```

### Example

```json
{
  "decision_id": "dec-12345",
  "agent_name": "CreditOracle",
  "model_version": "v2.1",
  "input_features": {
    "income": 80000,
    "debt_ratio": 0.3,
    "credit_history_months": 48
  },
  "output": {
    "score": 750,
    "confidence": 0.92
  },
  "rationale": "Strong income, low debt ratio, established credit history",
  "confidence": 0.92,
  "ledger_event_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-12-03T10:30:00Z"
}
```

---

## 6.7 Agent Governance

Agents are governed by the **Turing Layer** (Part 7):

- **Policy gating** — Agents must pass policy checks before acting
- **Bias detection** — Feature distributions are monitored for bias
- **Explainability enforcement** — All decisions must have rationale
- **Drift monitoring** — Models are retrained when drift exceeds threshold

---

## Next Steps

1. Read [Part 7 - Turing Layer](part7_tl.md) for governance enforcement
2. Review [Part 8 - DataMesh](part8_datamesh.md) for data product architecture
3. Study [Part 9 - MCP](part9_mcp.md) for control plane operations

---

**AI = Governed. No exceptions.**
