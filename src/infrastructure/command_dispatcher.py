import psycopg2
from confluent_kafka import Producer
import json
from typing import Dict, Any

# --- Configuration ---
# NOTE: This assumes the user is running the API on their host machine,
# and the Docker containers are accessible via 'localhost'.
DB_CONFIG = {
    "host": "localhost",
    "database": "icattle_db",
    "user": "turing_user",
    "password": "turing_password",
    "port": 5432
}

KAFKA_CONFIG = {
    "bootstrap.servers": "localhost:9093" # Port exposed by docker-compose
}

KAFKA_TOPIC = "agritech.animal.events"

# --- Infrastructure Clients ---
def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def get_kafka_producer():
    return Producer(KAFKA_CONFIG)

# --- Core Dispatcher Logic ---

def persist_event_to_db(event: Dict[str, Any], conn):
    """Persists the event to the PostgreSQL Event Store."""
    cursor = conn.cursor()
    
    # Extract fields from the event dictionary
    aggregate_id = event["aggregate_id"]
    aggregate_type = event["aggregate_type"]
    event_type = event["event_type"]
    version = event["version"]
    payload = json.dumps(event["payload"])
    metadata = json.dumps(event["metadata"])
    
    # SQL INSERT statement
    sql = """
    INSERT INTO events (aggregate_id, aggregate_type, event_type, version, payload, metadata)
    VALUES (%s, %s, %s, %s, %s, %s)
    RETURNING id;
    """
    
    cursor.execute(sql, (aggregate_id, aggregate_type, event_type, version, payload, metadata))
    event_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    return event_id

def publish_event_to_kafka(producer: Producer, event: Dict[str, Any]):
    """Publishes the event to the Kafka Event Bus."""
    
    # Use the Muzzle Hash as the Kafka key for deterministic partitioning
    key = event["aggregate_id"].encode('utf-8')
    value = json.dumps(event).encode('utf-8')
    
    producer.produce(
        topic=KAFKA_TOPIC,
        key=key,
        value=value,
        callback=lambda err, msg: print(f"Kafka Delivery Error: {err}") if err else None
    )
    producer.flush()

def dispatch_command(event: Dict[str, Any]):
    """
    The main Command Dispatcher function: Persist to DB, then Publish to Kafka.
    This is the core of the Turing Protocol's bank-grade auditability.
    """
    conn = None
    producer = None
    try:
        # 1. Persist to Event Store (PostgreSQL)
        conn = get_db_connection()
        event_id = persist_event_to_db(event, conn)
        
        # 2. Publish to Kafka
        producer = get_kafka_producer()
        publish_event_to_kafka(producer, event)
        
        return {"status": "Command Dispatched and Persisted", "event_id": event_id}
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"FATAL DISPATCH ERROR: {e}")
        raise e
        
    finally:
        if conn:
            conn.close()
        # Note: Producer flush is done inside publish_event_to_kafka
