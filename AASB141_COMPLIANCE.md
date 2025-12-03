# AASB 141 Agriculture - Compliance Guide for iCattle Asset Management

## Overview

The iCattle platform must comply with **AASB 141 Agriculture** (Australian equivalent of IAS 41) for livestock accounting. This standard prescribes how biological assets (livestock) must be measured and reported.

## Key Requirements for Livestock

### 1. Biological Assets Definition
- **Biological asset**: A living animal (cattle in our case)
- **Agricultural produce**: Harvested product (milk, meat after slaughter)
- **Costs to sell**: Incremental costs directly attributable to disposal (excluding finance costs and income taxes)

### 2. Measurement Standard

**Primary Rule: Fair Value Less Costs to Sell**

Livestock must be measured at:
- **Initial recognition**: Fair value less costs to sell
- **Each reporting period end**: Fair value less costs to sell

**Fair value** = Market price in an orderly transaction between market participants at measurement date

**Example for cattle:**
- Market price for similar cattle: $5,000
- Transport costs to market: $200
- Agent fees: $100
- **Fair value less costs to sell = $4,700**

### 3. Profit/Loss Recognition

**All changes in fair value are recognized in profit or loss** for the period in which they occur.

**Example:**
- Cattle valued at $4,000 on 1 Jan 2025
- Cattle valued at $4,700 on 31 Dec 2025
- **Gain of $700 recognized in P&L for 2025**

### 4. When Fair Value Cannot Be Measured Reliably

If fair value cannot be measured reliably (rare for livestock):
- Measure at **cost less accumulated depreciation and impairment**
- Once fair value becomes reliably measurable, switch to fair value model

### 5. Government Grants

If livestock receive government grants:
- **Unconditional grants**: Recognize in P&L when receivable
- **Conditional grants**: Recognize in P&L only when conditions are met

## iCattle Implementation Requirements

### For Xero/MYOB Integration

1. **Asset Classification**
   - Livestock = Biological Assets (separate category from Fixed Assets)
   - Use account type: "Biological Assets" or "Livestock" under Non-Current Assets

2. **Valuation Method**
   - Push **fair value less costs to sell** (not historical cost)
   - Update valuations at each reporting period (monthly/quarterly/annually)
   - Calculate costs to sell: transport + agent fees + other direct costs

3. **P&L Impact**
   - Fair value gains/losses go to P&L (not balance sheet revaluation reserve)
   - Create journal entries for valuation changes
   - Account: "Fair Value Gain/Loss on Biological Assets"

4. **Disclosure Requirements**
   - Reconciliation of carrying amount (opening balance → purchases → sales → fair value changes → closing balance)
   - Description of livestock groups (breeding, feedlot, dairy)
   - Nature of activities (breeding, fattening, milk production)
   - Quantitative information (number of animals, weight, age)

### iCattle Platform Features for AASB 141 Compliance

1. **Real-time Fair Value Calculation**
   - Market-based pricing engine
   - Automatic calculation of "fair value less costs to sell"
   - Transport and selling cost estimates

2. **Valuation Adjustments**
   - Track fair value changes period-over-period
   - Generate journal entries for Xero/MYOB
   - Separate realized gains (sales) from unrealized gains (holding)

3. **Audit Trail**
   - Turing Protocol ensures all valuation changes are cryptographically verified
   - Complete history of fair value measurements
   - Justification for valuation inputs (market prices, weight, breed, certification tier)

4. **Reporting**
   - AASB 141 compliant disclosure reports
   - Reconciliation of biological asset carrying amounts
   - Quantitative and qualitative descriptions

## Example Journal Entries

### Purchase of Cattle
```
DR Biological Assets - Cattle          $10,000
   CR Cash/Accounts Payable                     $10,000
```

### Fair Value Increase (end of period)
```
DR Biological Assets - Cattle          $1,500
   CR Fair Value Gain on Biological Assets     $1,500
```

### Fair Value Decrease (end of period)
```
DR Fair Value Loss on Biological Assets  $800
   CR Biological Assets - Cattle                $800
```

### Sale of Cattle
```
DR Cash                                $12,000
   CR Biological Assets - Cattle                $11,200
   CR Gain on Sale of Biological Assets         $800
```

## Integration with iCattle Certified™

The iCattle Certified tier system aligns with AASB 141:

- **Gold/Silver/Bronze Certified**: Higher fair values due to verified provenance
- **Non-Certified**: Lower fair values due to provenance risk
- **Tier-adjusted LTV**: Reflects fair value less costs to sell

This provides **objective, market-based fair value measurements** that comply with AASB 141.

## References

- AASB 141 Agriculture (effective 1 January 2005)
- IAS 41 Agriculture (international equivalent)
- AASB 1053 Application of Tiers (RDR framework)
