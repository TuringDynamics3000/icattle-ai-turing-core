"""
PostgreSQL Event Store Implementation

Turing Protocol v2-compliant event store with:
- Immutable append-only event log
- Event replay capabilities
- Projection management
- Optimistic concurrency control
"""

import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from dataclasses import asdict
import psycopg2
from psycopg2.extras import RealDictCursor
import os

from ..services.turingbank_base import Event


class EventStore:
    """
    PostgreSQL-backed event store for Turing Protocol v2.
    
    Provides:
    - Append-only event log
    - Event replay by aggregate
    - Snapshot/projection management
    - Optimistic concurrency control
    """
    
    def __init__(self, connection_string: Optional[str] = None):
        """Initialize event store with PostgreSQL connection."""
        self.connection_string = connection_string or os.getenv(
            'DATABASE_URL',
            'postgresql://postgres:password@localhost:5432/turingbank'
        )
        self._connection = None
    
    def _get_connection(self):
        """Get or create database connection."""
        if self._connection is None or self._connection.closed:
            self._connection = psycopg2.connect(self.connection_string)
        return self._connection
    
    def append_events(
        self,
        aggregate_id: str,
        aggregate_type: str,
        events: List[Event],
        expected_version: Optional[int] = None,
        tenant_id: Optional[str] = None
    ) -> None:
        """
        Append events to the event store.
        
        Args:
            aggregate_id: ID of the aggregate
            aggregate_type: Type of aggregate (e.g., 'account', 'loan')
            events: List of events to append
            expected_version: Expected current version (for optimistic locking)
            tenant_id: Tenant ID for multi-tenancy
            
        Raises:
            ConcurrencyError: If expected_version doesn't match current version
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Check current version if optimistic locking is enabled
            if expected_version is not None:
                cursor.execute(
                    """
                    SELECT COALESCE(MAX(version), 0) as current_version
                    FROM events
                    WHERE aggregate_id = %s AND aggregate_type = %s
                    """,
                    (aggregate_id, aggregate_type)
                )
                result = cursor.fetchone()
                current_version = result[0] if result else 0
                
                if current_version != expected_version:
                    raise ConcurrencyError(
                        f"Expected version {expected_version}, but current version is {current_version}"
                    )
            
            # Get next version number
            cursor.execute(
                """
                SELECT COALESCE(MAX(version), 0) + 1 as next_version
                FROM events
                WHERE aggregate_id = %s AND aggregate_type = %s
                """,
                (aggregate_id, aggregate_type)
            )
            next_version = cursor.fetchone()[0]
            
            # Append each event
            for i, event in enumerate(events):
                event_id = str(uuid.uuid4())
                event_type = type(event).__name__
                event_data = asdict(event) if hasattr(event, '__dataclass_fields__') else event.__dict__
                
                cursor.execute(
                    """
                    INSERT INTO events (
                        event_id, aggregate_id, aggregate_type, event_type,
                        event_data, version, timestamp, tenant_id, metadata
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        event_id,
                        aggregate_id,
                        aggregate_type,
                        event_type,
                        json.dumps(event_data),
                        next_version + i,
                        datetime.now(),
                        tenant_id,
                        json.dumps({})
                    )
                )
            
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise
        finally:
            cursor.close()
    
    def get_events(
        self,
        aggregate_id: str,
        aggregate_type: Optional[str] = None,
        from_version: int = 0,
        to_version: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get events for an aggregate.
        
        Args:
            aggregate_id: ID of the aggregate
            aggregate_type: Optional type filter
            from_version: Start version (inclusive)
            to_version: End version (inclusive)
            
        Returns:
            List of event dictionaries
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            query = """
                SELECT event_id, aggregate_id, aggregate_type, event_type,
                       event_data, version, timestamp, tenant_id, metadata
                FROM events
                WHERE aggregate_id = %s
            """
            params = [aggregate_id]
            
            if aggregate_type:
                query += " AND aggregate_type = %s"
                params.append(aggregate_type)
            
            if from_version > 0:
                query += " AND version >= %s"
                params.append(from_version)
            
            if to_version is not None:
                query += " AND version <= %s"
                params.append(to_version)
            
            query += " ORDER BY version ASC"
            
            cursor.execute(query, params)
            events = cursor.fetchall()
            
            return [dict(event) for event in events]
            
        finally:
            cursor.close()
    
    def get_all_events(
        self,
        aggregate_type: Optional[str] = None,
        tenant_id: Optional[str] = None,
        limit: int = 1000
    ) -> List[Dict[str, Any]]:
        """Get all events, optionally filtered by type and tenant."""
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            query = "SELECT * FROM events WHERE 1=1"
            params = []
            
            if aggregate_type:
                query += " AND aggregate_type = %s"
                params.append(aggregate_type)
            
            if tenant_id:
                query += " AND tenant_id = %s"
                params.append(tenant_id)
            
            query += " ORDER BY timestamp DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            events = cursor.fetchall()
            
            return [dict(event) for event in events]
            
        finally:
            cursor.close()
    
    def save_projection(
        self,
        projection_name: str,
        aggregate_id: str,
        state: Dict[str, Any],
        version: int
    ) -> None:
        """
        Save or update a projection (read model).
        
        Args:
            projection_name: Name of the projection
            aggregate_id: ID of the aggregate
            state: Current state to save
            version: Version number
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                """
                INSERT INTO projections (projection_name, aggregate_id, state, version, updated_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (projection_name, aggregate_id)
                DO UPDATE SET state = %s, version = %s, updated_at = %s
                """,
                (
                    projection_name,
                    aggregate_id,
                    json.dumps(state),
                    version,
                    datetime.now(),
                    json.dumps(state),
                    version,
                    datetime.now()
                )
            )
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise
        finally:
            cursor.close()
    
    def get_projection(
        self,
        projection_name: str,
        aggregate_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a projection by name and aggregate ID."""
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute(
                """
                SELECT state, version, updated_at
                FROM projections
                WHERE projection_name = %s AND aggregate_id = %s
                """,
                (projection_name, aggregate_id)
            )
            result = cursor.fetchone()
            
            if result:
                return dict(result)
            return None
            
        finally:
            cursor.close()
    
    def close(self):
        """Close database connection."""
        if self._connection and not self._connection.closed:
            self._connection.close()


class ConcurrencyError(Exception):
    """Raised when optimistic concurrency check fails."""
    pass
