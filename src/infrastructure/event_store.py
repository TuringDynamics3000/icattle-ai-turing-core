"""
Event Store - Async implementation with connection pooling
Part of the Imperative Shell (handles I/O and side effects)
"""

import asyncpg
import json
from typing import Optional, List, Dict, Any
from datetime import datetime
from contextlib import asynccontextmanager


class EventStore:
    """Async event store with connection pooling"""
    
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
    
    async def save_event(
        self,
        event_id: str,
        aggregate_id: str,
        aggregate_type: str,
        event_type: str,
        version: int,
        payload: Dict[str, Any],
        metadata: Dict[str, Any],
        topic: str = "agritech.animal.events"
    ) -> int:
        """Save event to both event store and outbox table (transactional)"""
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                # 1. Save to event store
                event_db_id = await conn.fetchval(
                    """
                    INSERT INTO turing_events (
                        event_id, aggregate_id, aggregate_type, event_type,
                        version, payload, metadata, timestamp
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id
                    """,
                    event_id, aggregate_id, aggregate_type, event_type,
                    version, json.dumps(payload), json.dumps(metadata),
                    datetime.utcnow()
                )
                
                # 2. Save to outbox for Kafka publishing
                await conn.execute(
                    """
                    INSERT INTO event_outbox (
                        event_id, aggregate_id, event_type, topic,
                        partition_key, payload, status
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, 'pending')
                    """,
                    event_id, aggregate_id, event_type, topic, aggregate_id,
                    json.dumps({
                        "event_id": event_id,
                        "aggregate_id": aggregate_id,
                        "event_type": event_type,
                        "version": version,
                        "payload": payload,
                        "metadata": metadata,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                )
                
                return event_db_id
    
    async def get_events_for_aggregate(
        self, aggregate_id: str, from_version: int = 0
    ) -> List[Dict[str, Any]]:
        """Retrieve all events for a specific aggregate"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT event_id, aggregate_id, event_type, version,
                       payload, metadata, timestamp
                FROM turing_events
                WHERE aggregate_id = $1 AND version > $2
                ORDER BY version ASC
                """,
                aggregate_id, from_version
            )
            return [dict(row) for row in rows]


@asynccontextmanager
async def create_event_store(database_url: str, min_size: int = 10, max_size: int = 20):
    """Create event store with connection pooling"""
    pool = await asyncpg.create_pool(
        database_url, min_size=min_size, max_size=max_size, command_timeout=60
    )
    try:
        yield EventStore(pool)
    finally:
        await pool.close()
