from confluent_kafka import Producer
import json
from typing import Dict, Any
from .event_store import save_event

# --- Kafka Configuration ---
KAFKA_CONFIG = {
    "bootstrap.servers": "localhost:9093",
    "client.id": "icattle-api-gateway"
}

KAFKA_TOPIC = "agritech.animal.events"

def dispatch_command(event: Dict[str, Any]) -> Dict[str, str]:
    """
    Implements the Persist-then-Publish pattern:
    1. Persist the event to PostgreSQL (Event Store)
    2. Publish the event to Kafka (Event Bus)
    
    Returns the event_id and aggregate_id for confirmation.
    """
    try:
        # Step 1: Persist to PostgreSQL (Guarantees durability)
        event_id = save_event(event)
        
        # Step 2: Publish to Kafka (Enables downstream processing)
        producer = Producer(KAFKA_CONFIG)
        
        producer.produce(
            KAFKA_TOPIC,
            key=event["aggregate_id"].encode('utf-8'),
            value=json.dumps(event).encode('utf-8')
        )
        
        producer.flush()
        
        print(f"✅ Event published to Kafka (Topic: {KAFKA_TOPIC})")
        
        return {
            "status": "success",
            "event_id": str(event_id),
            "aggregate_id": event["aggregate_id"]
        }
        
    except Exception as e:
        raise Exception(f"Infrastructure Error: {e}")
