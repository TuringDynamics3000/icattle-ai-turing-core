/**
 * EVENT REPLAY ENGINE
 * 
 * Reconstructs cattle state from event stream (Golden Record).
 * Demonstrates true event sourcing - the event log is the source of truth.
 * 
 * Key capabilities:
 * - Rebuild complete cattle state from events
 * - Point-in-time state reconstruction
 * - State comparison (current DB vs reconstructed)
 * - Audit trail verification
 */

import type { EventEnvelope } from './turingProtocol';

export interface ReconstructedCattleState {
  cattle_id: number;
  visual_id?: string;
  nlis_id?: string;
  biometric_id?: string;
  breed?: string;
  sex?: string;
  color?: string;
  date_of_birth?: string;
  current_weight?: number;
  current_location?: string;
  current_value?: number;
  health_status?: string;
  owner?: string;
  status?: string;
  
  // Metadata
  total_events: number;
  first_event_at?: string;
  last_event_at?: string;
  reconstruction_timestamp: string;
}

export interface StateComparison {
  cattle_id: number;
  current_state: any;
  reconstructed_state: ReconstructedCattleState;
  differences: StateDifference[];
  integrity_status: 'MATCH' | 'MISMATCH' | 'PARTIAL_MATCH';
}

export interface StateDifference {
  field: string;
  current_value: any;
  reconstructed_value: any;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

/**
 * Reconstruct cattle state from event stream
 */
export function reconstructStateFromEvents(
  events: EventEnvelope<any>[]
): ReconstructedCattleState {
  if (events.length === 0) {
    throw new Error('No events provided for reconstruction');
  }

  // Sort events by occurred_at (oldest first)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.metadata.occurred_at).getTime() - new Date(b.metadata.occurred_at).getTime()
  );

  const cattle_id = sortedEvents[0].metadata.cattle_id;
  
  // Initialize empty state
  const state: ReconstructedCattleState = {
    cattle_id,
    total_events: events.length,
    first_event_at: sortedEvents[0].metadata.occurred_at,
    last_event_at: sortedEvents[sortedEvents.length - 1].metadata.occurred_at,
    reconstruction_timestamp: new Date().toISOString(),
  };

  // Replay events in chronological order
  for (const event of sortedEvents) {
    applyEventToState(state, event);
  }

  return state;
}

/**
 * Apply a single event to the state
 */
function applyEventToState(
  state: ReconstructedCattleState,
  event: EventEnvelope<any>
): void {
  const { event_type } = event.metadata;
  const payload = event.payload;

  switch (event_type) {
    case 'CATTLE_CREATED':
      state.visual_id = payload.visual_id;
      state.nlis_id = payload.nlis_id;
      state.biometric_id = payload.biometric_id;
      state.breed = payload.breed;
      state.sex = payload.sex;
      state.color = payload.color;
      state.date_of_birth = payload.date_of_birth;
      state.current_weight = payload.weight;
      state.current_location = payload.location;
      state.current_value = payload.value;
      state.owner = payload.owner;
      state.status = 'active';
      break;

    case 'WEIGHT_RECORDED':
      state.current_weight = payload.weight || payload.new_weight;
      break;

    case 'MOVEMENT':
    case 'LOCATION_MOVED':
      state.current_location = payload.to_location || payload.new_location;
      break;

    case 'HEALTH_CHECK':
    case 'HEALTH_RECORD':
      state.health_status = payload.health_status || payload.status;
      break;

    case 'VALUATION_UPDATE':
      state.current_value = payload.new_value || payload.value;
      break;

    case 'OWNERSHIP_TRANSFER':
      state.owner = payload.new_owner || payload.to_owner;
      break;

    case 'TAG_CHANGED':
      if (payload.new_nlis_id) {
        state.nlis_id = payload.new_nlis_id;
      }
      if (payload.new_visual_id) {
        state.visual_id = payload.new_visual_id;
      }
      break;

    case 'DEATH_RECORDED':
      state.status = 'deceased';
      break;

    case 'SALE_COMPLETED':
      state.status = 'sold';
      state.owner = payload.buyer || payload.new_owner;
      break;

    // Ignore other event types for state reconstruction
    default:
      break;
  }
}

/**
 * Reconstruct state at a specific point in time
 */
export function reconstructStateAtTime(
  events: EventEnvelope<any>[],
  targetTime: Date
): ReconstructedCattleState {
  // Filter events up to target time
  const eventsUpToTime = events.filter(event => 
    new Date(event.metadata.occurred_at) <= targetTime
  );

  if (eventsUpToTime.length === 0) {
    throw new Error('No events found before target time');
  }

  return reconstructStateFromEvents(eventsUpToTime);
}

/**
 * Compare current database state with reconstructed state
 */
export function compareStates(
  currentState: any,
  reconstructedState: ReconstructedCattleState
): StateComparison {
  const differences: StateDifference[] = [];

  // Fields to compare
  const fieldsToCompare = [
    'visual_id',
    'nlis_id',
    'biometric_id',
    'breed',
    'sex',
    'color',
    'current_weight',
    'current_location',
    'current_value',
    'health_status',
    'owner',
    'status',
  ];

  for (const field of fieldsToCompare) {
    const currentValue = currentState[field];
    const reconstructedValue = reconstructedState[field as keyof ReconstructedCattleState];

    // Skip if both are null/undefined
    if (currentValue == null && reconstructedValue == null) {
      continue;
    }

    // Check for differences
    if (currentValue !== reconstructedValue) {
      differences.push({
        field,
        current_value: currentValue,
        reconstructed_value: reconstructedValue,
        severity: determineSeverity(field, currentValue, reconstructedValue),
      });
    }
  }

  // Determine overall integrity status
  let integrity_status: 'MATCH' | 'MISMATCH' | 'PARTIAL_MATCH';
  if (differences.length === 0) {
    integrity_status = 'MATCH';
  } else if (differences.some(d => d.severity === 'CRITICAL')) {
    integrity_status = 'MISMATCH';
  } else {
    integrity_status = 'PARTIAL_MATCH';
  }

  return {
    cattle_id: reconstructedState.cattle_id,
    current_state: currentState,
    reconstructed_state: reconstructedState,
    differences,
    integrity_status,
  };
}

/**
 * Determine severity of a state difference
 */
function determineSeverity(
  field: string,
  currentValue: any,
  reconstructedValue: any
): 'CRITICAL' | 'WARNING' | 'INFO' {
  // Critical fields (identity and compliance)
  const criticalFields = ['nlis_id', 'biometric_id', 'visual_id', 'status'];
  if (criticalFields.includes(field)) {
    return 'CRITICAL';
  }

  // Warning fields (financial and operational)
  const warningFields = ['current_value', 'owner', 'current_location'];
  if (warningFields.includes(field)) {
    return 'WARNING';
  }

  // Info fields (descriptive)
  return 'INFO';
}

/**
 * Verify event chain integrity
 */
export function verifyEventChainIntegrity(
  events: EventEnvelope<any>[]
): {
  is_valid: boolean;
  broken_links: Array<{
    event_id: string;
    expected_previous_hash: string | undefined;
    actual_previous_hash: string | undefined;
  }>;
} {
  if (events.length === 0) {
    return { is_valid: true, broken_links: [] };
  }

  // Sort events by occurred_at
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.metadata.occurred_at).getTime() - new Date(b.metadata.occurred_at).getTime()
  );

  const broken_links: Array<{
    event_id: string;
    expected_previous_hash: string | undefined;
    actual_previous_hash: string | undefined;
  }> = [];

  // Check chain integrity
  for (let i = 1; i < sortedEvents.length; i++) {
    const currentEvent = sortedEvents[i];
    const previousEvent = sortedEvents[i - 1];

    // Current event should reference previous event's hash
    if (currentEvent.previous_hash !== previousEvent.payload_hash) {
      broken_links.push({
        event_id: currentEvent.metadata.event_id,
        expected_previous_hash: previousEvent.payload_hash,
        actual_previous_hash: currentEvent.previous_hash,
      });
    }
  }

  return {
    is_valid: broken_links.length === 0,
    broken_links,
  };
}

/**
 * Calculate state reconstruction confidence score
 */
export function calculateReconstructionConfidence(
  events: EventEnvelope<any>[],
  reconstructedState: ReconstructedCattleState
): {
  score: number;
  factors: {
    event_count: number;
    chain_integrity: boolean;
    time_coverage_days: number;
    completeness: number;
  };
} {
  const chainIntegrity = verifyEventChainIntegrity(events);
  
  // Calculate time coverage
  const firstEvent = new Date(reconstructedState.first_event_at || 0);
  const lastEvent = new Date(reconstructedState.last_event_at || 0);
  const timeCoverageDays = (lastEvent.getTime() - firstEvent.getTime()) / (1000 * 60 * 60 * 24);

  // Calculate completeness (how many key fields are populated)
  const keyFields = [
    'visual_id',
    'nlis_id',
    'breed',
    'sex',
    'current_weight',
    'current_location',
    'current_value',
    'owner',
  ];
  const populatedFields = keyFields.filter(
    field => reconstructedState[field as keyof ReconstructedCattleState] != null
  );
  const completeness = populatedFields.length / keyFields.length;

  // Calculate overall confidence score (0-100)
  let score = 0;
  score += chainIntegrity.is_valid ? 40 : 0; // Chain integrity: 40 points
  score += Math.min(events.length / 10, 1) * 30; // Event count: 30 points (max at 10+ events)
  score += completeness * 30; // Completeness: 30 points

  return {
    score: Math.round(score),
    factors: {
      event_count: events.length,
      chain_integrity: chainIntegrity.is_valid,
      time_coverage_days: Math.round(timeCoverageDays),
      completeness: Math.round(completeness * 100),
    },
  };
}
