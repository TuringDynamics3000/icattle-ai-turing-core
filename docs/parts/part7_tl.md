# Part 7 — Turing Layer (TL)

## Overview

The **Turing Layer (TL)** enforces regulatory compliance and AI governance at runtime.

**Core Principle:** Compliance is structural, not cultural.

---

## 7.1 TL Responsibilities

### 1. ASIC RG255/277 Explainability

All material financial decisions MUST have:
- **Input features** — What data was used
- **Model lineage** — Which model version made the decision
- **Rationale** — Why this decision was made
- **Confidence** — How confident the model is

### 2. DDO Suitability (Design & Distribution Obligations)

All product recommendations MUST:
- Match customer needs
- Have documented suitability assessment
- Include risk warnings

### 3. AML/CTF Rules

All transactions MUST:
- Pass AML screening
- Have KYC verification
- Flag suspicious activity

### 4. Bias/Feature Governance

All ML models MUST:
- Monitor feature distributions for bias
- Detect protected attribute leakage
- Enforce fairness constraints

### 5. Policy Gating for Agents

All agent decisions MUST:
- Pass policy checks before execution
- Have audit trail
- Be reversible

---

## 7.2 Explainability Record

Every material decision produces an **Explainability Record**:

```python
class ExplainabilityRecord:
    decision_id: str
    agent_name: str
    model_version: str
    input_features: dict
    output: dict
    rationale: str
    confidence: float
    ledger_event_id: Optional[str]
    policy_checks: List[PolicyCheck]
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
  "policy_checks": [
    {"policy": "AML_SCREENING", "result": "PASS"},
    {"policy": "KYC_VERIFIED", "result": "PASS"},
    {"policy": "BIAS_CHECK", "result": "PASS"}
  ],
  "timestamp": "2025-12-03T10:30:00Z"
}
```

---

## 7.3 Policy Gating

Agents MUST pass policy checks before acting:

```python
def execute_agent_decision(agent_name, decision):
    """
    Execute agent decision with policy gating.
    """
    # 1. Check policies
    policy_results = check_policies(agent_name, decision)
    
    # 2. If any policy fails, reject
    if any(p.result == "FAIL" for p in policy_results):
        raise PolicyViolation(f"Policy check failed: {policy_results}")
    
    # 3. Execute decision
    execute_decision(decision)
    
    # 4. Record explainability record
    emit_explainability_record(
        decision_id=decision.id,
        agent_name=agent_name,
        policy_checks=policy_results,
        ...
    )
```

---

## 7.4 Bias Detection

TL monitors feature distributions for bias:

### Protected Attributes

```python
PROTECTED_ATTRIBUTES = [
    "gender",
    "race",
    "religion",
    "age",
    "disability",
    "sexual_orientation",
]
```

### Bias Detection

```python
def detect_bias(model_name, feature_name):
    """
    Detect bias in feature distribution.
    """
    # Get feature distribution by protected attribute
    distribution = db.query(
        """
        SELECT protected_attribute, AVG(feature_value) AS mean
        FROM model_inferences
        WHERE model_name = %s AND feature_name = %s
        GROUP BY protected_attribute
        """,
        (model_name, feature_name)
    )
    
    # Check for significant differences
    if max(distribution.mean) - min(distribution.mean) > BIAS_THRESHOLD:
        alert(f"Bias detected in {model_name}.{feature_name}")
```

---

## 7.5 Audit Trail

All TL decisions are recorded in `tl_audit_log`:

```sql
CREATE TABLE tl_audit_log (
  audit_id          UUID PRIMARY KEY,
  occurred_at       TIMESTAMPTZ NOT NULL,
  agent_name        TEXT NOT NULL,
  decision_id       TEXT NOT NULL,
  policy_checks     JSONB NOT NULL,
  result            TEXT NOT NULL,  -- PASS, FAIL
  details           JSONB NOT NULL
);
```

---

## 7.6 Regulatory Compliance

### ASIC RG255/277 (AI Governance)

- ✅ All ML decisions have explainability records
- ✅ Model lineage is tracked
- ✅ Drift is monitored
- ✅ Bias is detected

### APRA CPS 230/234 (Operational Resilience)

- ✅ Event sourcing enables replay
- ✅ Hash integrity prevents tampering
- ✅ MCP enforces runtime correctness
- ✅ RedBelly provides cryptographic verification

### AML/CTF Act (Anti-Money Laundering)

- ✅ All transactions are screened
- ✅ KYC verification is enforced
- ✅ Suspicious activity is flagged
- ✅ Audit trail is complete

---

## Next Steps

1. Read [Part 8 - DataMesh](part8_datamesh.md) for data product architecture
2. Review [Part 9 - MCP](part9_mcp.md) for control plane operations
3. Study [Part 10 - RedBelly](part10_redbelly.md) for cryptographic verification

---

**Compliance is structural, not cultural.**
