import psycopg2
from psycopg2.extras import RealDictCursor
import json
from typing import Dict, Any

# --- Database Configuration ---
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 5433,
    "database": "icattle_db",
    "user": "turing_user",
    "password": "turing_password"
}

def save_event(event: Dict[str, Any]) -> int:
    """
    Saves an event to the PostgreSQL Event Store.
    Returns the event ID (database primary key).
    """
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO events (aggregate_id, aggregate_type, event_type, version, payload, metadata)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            event["aggregate_id"],
            event["aggregate_type"],
            event["event_type"],
            event["version"],
            json.dumps(event["payload"]),
            json.dumps(event["metadata"])
        ))

        event_id = cursor.fetchone()[0]
        conn.commit()

        print(f"? Event persisted to PostgreSQL (Event ID: {event_id})")
        return event_id

    except Exception as e:
        conn.rollback()
        raise Exception(f"Failed to save event to database: {e}")

    finally:
        cursor.close()
        conn.close()
