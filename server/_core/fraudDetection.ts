/**
 * FRAUD DETECTION SERVICE
 * 
 * Real-time fraud detection using Turing Protocol-verified events.
 * All events MUST pass protocol enforcement before analysis.
 * 
 * Detection algorithms:
 * 1. Tag swap detection - Same NLIS on different cattle
 * 2. Rapid movement detection - Impossible travel times
 * 3. Price anomaly detection - Suspicious valuation spikes
 * 4. Ownership churn detection - Rapid ownership changes
 * 5. Location anomaly detection - Unexpected location patterns
 */

import { TuringProtocol } from './turingProtocol';
import { enforceOnFraudDetection, hasCriticalViolations } from './protocolEnforcement';
import type { EventEnvelope } from './turingProtocol';
import type { ProtocolViolation } from './protocolEnforcement';

export interface FraudAlert {
  alert_id: string;
  fraud_type: 'TAG_SWAP' | 'RAPID_MOVEMENT' | 'PRICE_ANOMALY' | 'OWNERSHIP_CHURN' | 'LOCATION_ANOMALY' | 'PROTOCOL_VIOLATION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cattle_id: number;
  title: string;
  description: string;
  evidence: any;
  detected_at: string;
  status: 'NEW' | 'INVESTIGATING' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'RESOLVED';
  confidence_score: number; // 0-100
}

export interface FraudDetectionResult {
  cattle_id: number;
  alerts: FraudAlert[];
  risk_score: number; // 0-100
  protocol_compliant: boolean;
  protocol_violations: ProtocolViolation[];
  analyzed_events: number;
  analysis_timestamp: string;
}

/**
 * Analyze events for fraud
 * Enforces Turing Protocol before analysis
 */
export async function analyzeForFraud(
  cattle_id: number,
  events: EventEnvelope<any>[]
): Promise<FraudDetectionResult> {
  const alerts: FraudAlert[] = [];

  // STEP 1: Enforce Turing Protocol
  const protocolResult = enforceOnFraudDetection(events);
  
  // If critical protocol violations, create alert and stop analysis
  if (hasCriticalViolations(protocolResult.violations)) {
    alerts.push({
      alert_id: generateAlertId(),
      fraud_type: 'PROTOCOL_VIOLATION',
      severity: 'CRITICAL',
      cattle_id,
      title: 'Critical Protocol Violation Detected',
      description: 'Event chain has been tampered with or contains invalid data. This cattle cannot be trusted for lending.',
      evidence: { violations: protocolResult.violations },
      detected_at: new Date().toISOString(),
      status: 'NEW',
      confidence_score: 100,
    });

    return {
      cattle_id,
      alerts,
      risk_score: 100, // Maximum risk
      protocol_compliant: false,
      protocol_violations: protocolResult.violations,
      analyzed_events: events.length,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // STEP 2: Run fraud detection algorithms (only on protocol-compliant events)
  const tagSwapAlerts = detectTagSwap(cattle_id, events);
  const rapidMovementAlerts = detectRapidMovement(cattle_id, events);
  const priceAnomalyAlerts = detectPriceAnomaly(cattle_id, events);
  const ownershipChurnAlerts = detectOwnershipChurn(cattle_id, events);
  const locationAnomalyAlerts = detectLocationAnomaly(cattle_id, events);

  alerts.push(...tagSwapAlerts);
  alerts.push(...rapidMovementAlerts);
  alerts.push(...priceAnomalyAlerts);
  alerts.push(...ownershipChurnAlerts);
  alerts.push(...locationAnomalyAlerts);

  // STEP 3: Calculate overall risk score
  const risk_score = calculateRiskScore(alerts);

  return {
    cattle_id,
    alerts,
    risk_score,
    protocol_compliant: protocolResult.is_valid,
    protocol_violations: protocolResult.violations,
    analyzed_events: events.length,
    analysis_timestamp: new Date().toISOString(),
  };
}

/**
 * Detect tag swap fraud
 * Same NLIS ID appearing on different cattle
 */
function detectTagSwap(cattle_id: number, events: EventEnvelope<any>[]): FraudAlert[] {
  const alerts: FraudAlert[] = [];
  
  // Look for TAG_CHANGED events
  const tagChanges = events.filter(e => e.metadata.event_type === 'TAG_CHANGED');
  
  if (tagChanges.length > 2) {
    // Multiple tag changes are suspicious
    alerts.push({
      alert_id: generateAlertId(),
      fraud_type: 'TAG_SWAP',
      severity: 'HIGH',
      cattle_id,
      title: 'Multiple Tag Changes Detected',
      description: `This cattle has had ${tagChanges.length} tag changes, which is unusual and may indicate tag swapping fraud.`,
      evidence: {
        tag_change_count: tagChanges.length,
        tag_changes: tagChanges.map(e => ({
          occurred_at: e.metadata.occurred_at,
          old_nlis: e.payload.old_nlis_id,
          new_nlis: e.payload.new_nlis_id,
        })),
      },
      detected_at: new Date().toISOString(),
      status: 'NEW',
      confidence_score: Math.min(tagChanges.length * 30, 90),
    });
  }

  return alerts;
}

/**
 * Detect rapid movement fraud
 * Impossible travel times between locations
 */
function detectRapidMovement(cattle_id: number, events: EventEnvelope<any>[]): FraudAlert[] {
  const alerts: FraudAlert[] = [];
  
  // Get movement events
  const movements = events
    .filter(e => e.metadata.event_type === 'MOVEMENT' || e.metadata.event_type === 'LOCATION_MOVED')
    .sort((a, b) => new Date(a.metadata.occurred_at).getTime() - new Date(b.metadata.occurred_at).getTime());

  // Check for rapid movements (< 24 hours between movements)
  for (let i = 1; i < movements.length; i++) {
    const prevMovement = movements[i - 1];
    const currMovement = movements[i];
    
    const timeDiff = new Date(currMovement.metadata.occurred_at).getTime() - 
                     new Date(prevMovement.metadata.occurred_at).getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      alerts.push({
        alert_id: generateAlertId(),
        fraud_type: 'RAPID_MOVEMENT',
        severity: 'MEDIUM',
        cattle_id,
        title: 'Rapid Movement Detected',
        description: `Cattle moved ${Math.round(hoursDiff)} hours after previous movement. This may indicate fraudulent location reporting.`,
        evidence: {
          time_between_movements_hours: Math.round(hoursDiff * 10) / 10,
          from_location: prevMovement.payload.to_location || prevMovement.payload.new_location,
          to_location: currMovement.payload.to_location || currMovement.payload.new_location,
          first_movement_at: prevMovement.metadata.occurred_at,
          second_movement_at: currMovement.metadata.occurred_at,
        },
        detected_at: new Date().toISOString(),
        status: 'NEW',
        confidence_score: hoursDiff < 6 ? 80 : 60,
      });
    }
  }

  return alerts;
}

/**
 * Detect price anomaly fraud
 * Suspicious valuation spikes
 */
function detectPriceAnomaly(cattle_id: number, events: EventEnvelope<any>[]): FraudAlert[] {
  const alerts: FraudAlert[] = [];
  
  // Get valuation events
  const valuations = events
    .filter(e => e.metadata.event_type === 'VALUATION_UPDATE')
    .sort((a, b) => new Date(a.metadata.occurred_at).getTime() - new Date(b.metadata.occurred_at).getTime());

  // Check for sudden price spikes (>50% increase)
  for (let i = 1; i < valuations.length; i++) {
    const prevValuation = valuations[i - 1];
    const currValuation = valuations[i];
    
    const prevValue = prevValuation.payload.new_value || prevValuation.payload.value;
    const currValue = currValuation.payload.new_value || currValuation.payload.value;

    if (prevValue && currValue) {
      const percentChange = ((currValue - prevValue) / prevValue) * 100;

      if (percentChange > 50) {
        alerts.push({
          alert_id: generateAlertId(),
          fraud_type: 'PRICE_ANOMALY',
          severity: percentChange > 100 ? 'HIGH' : 'MEDIUM',
          cattle_id,
          title: 'Suspicious Valuation Spike',
          description: `Valuation increased by ${Math.round(percentChange)}% in a single update. This may indicate fraudulent valuation inflation.`,
          evidence: {
            percent_change: Math.round(percentChange * 10) / 10,
            previous_value: prevValue,
            current_value: currValue,
            previous_valuation_at: prevValuation.metadata.occurred_at,
            current_valuation_at: currValuation.metadata.occurred_at,
          },
          detected_at: new Date().toISOString(),
          status: 'NEW',
          confidence_score: Math.min(percentChange, 95),
        });
      }
    }
  }

  return alerts;
}

/**
 * Detect ownership churn fraud
 * Rapid ownership changes
 */
function detectOwnershipChurn(cattle_id: number, events: EventEnvelope<any>[]): FraudAlert[] {
  const alerts: FraudAlert[] = [];
  
  // Get ownership transfer events
  const transfers = events.filter(e => 
    e.metadata.event_type === 'OWNERSHIP_TRANSFER' || 
    e.metadata.event_type === 'SALE_COMPLETED'
  );

  // More than 3 ownership changes is suspicious
  if (transfers.length > 3) {
    alerts.push({
      alert_id: generateAlertId(),
      fraud_type: 'OWNERSHIP_CHURN',
      severity: 'MEDIUM',
      cattle_id,
      title: 'Excessive Ownership Changes',
      description: `This cattle has changed ownership ${transfers.length} times. High ownership churn may indicate money laundering or fraud.`,
      evidence: {
        transfer_count: transfers.length,
        transfers: transfers.map(e => ({
          occurred_at: e.metadata.occurred_at,
          new_owner: e.payload.new_owner || e.payload.buyer,
        })),
      },
      detected_at: new Date().toISOString(),
      status: 'NEW',
      confidence_score: Math.min(transfers.length * 20, 85),
    });
  }

  return alerts;
}

/**
 * Detect location anomaly fraud
 * Unexpected location patterns
 */
function detectLocationAnomaly(cattle_id: number, events: EventEnvelope<any>[]): FraudAlert[] {
  const alerts: FraudAlert[] = [];
  
  // Get movement events
  const movements = events.filter(e => 
    e.metadata.event_type === 'MOVEMENT' || 
    e.metadata.event_type === 'LOCATION_MOVED'
  );

  // Check for location loops (returning to same location multiple times)
  const locationCounts = new Map<string, number>();
  for (const movement of movements) {
    const location = movement.payload.to_location || movement.payload.new_location;
    if (location) {
      locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
    }
  }

  // If any location appears more than 3 times, it's suspicious
  for (const [location, count] of Array.from(locationCounts.entries())) {
    if (count > 3) {
      alerts.push({
        alert_id: generateAlertId(),
        fraud_type: 'LOCATION_ANOMALY',
        severity: 'LOW',
        cattle_id,
        title: 'Unusual Location Pattern',
        description: `Cattle has been moved to "${location}" ${count} times. This circular movement pattern may indicate fraudulent activity.`,
        evidence: {
          location,
          visit_count: count,
        },
        detected_at: new Date().toISOString(),
        status: 'NEW',
        confidence_score: Math.min(count * 15, 70),
      });
    }
  }

  return alerts;
}

/**
 * Calculate overall risk score
 */
function calculateRiskScore(alerts: FraudAlert[]): number {
  if (alerts.length === 0) {
    return 0;
  }

  // Weight by severity
  const severityWeights = {
    CRITICAL: 40,
    HIGH: 25,
    MEDIUM: 15,
    LOW: 5,
  };

  let totalScore = 0;
  for (const alert of alerts) {
    totalScore += severityWeights[alert.severity];
  }

  // Cap at 100
  return Math.min(totalScore, 100);
}

/**
 * Generate unique alert ID
 */
function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get fraud alerts for multiple cattle
 */
export async function analyzeBatchForFraud(
  cattleEvents: Map<number, EventEnvelope<any>[]>
): Promise<Map<number, FraudDetectionResult>> {
  const results = new Map<number, FraudDetectionResult>();

  for (const [cattle_id, events] of Array.from(cattleEvents.entries())) {
    const result = await analyzeForFraud(cattle_id, events);
    results.set(cattle_id, result);
  }

  return results;
}

/**
 * Get high-risk cattle (risk score > 70)
 */
export function getHighRiskCattle(
  results: Map<number, FraudDetectionResult>
): FraudDetectionResult[] {
  return Array.from(results.values())
    .filter(r => r.risk_score > 70)
    .sort((a, b) => b.risk_score - a.risk_score);
}

/**
 * Get protocol non-compliant cattle
 */
export function getNonCompliantCattle(
  results: Map<number, FraudDetectionResult>
): FraudDetectionResult[] {
  return Array.from(results.values())
    .filter(r => !r.protocol_compliant);
}
