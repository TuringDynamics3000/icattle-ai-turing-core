#!/bin/bash
#
# Initialize Kafka topics for iCattle
# Connects to TuringCore-v3 Kafka infrastructure
#
# Usage: ./scripts/init-kafka-topics.sh [kafka-broker]
#

KAFKA_BROKER=${1:-localhost:9093}

echo "========================================="
echo "iCattle Kafka Topic Initialization"
echo "========================================="
echo "Kafka Broker: $KAFKA_BROKER"
echo ""

# Check if kafka-topics command is available
if ! command -v kafka-topics &> /dev/null; then
    echo "ERROR: kafka-topics command not found"
    echo "Please install Kafka or use Docker:"
    echo "  docker exec turingcore-kafka kafka-topics ..."
    exit 1
fi

# Create cattle events topic
echo "Creating topic: icattle.cattle.events"
kafka-topics --bootstrap-server $KAFKA_BROKER \
  --create \
  --if-not-exists \
  --topic icattle.cattle.events \
  --partitions 6 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config compression.type=snappy

# Create provenance events topic
echo "Creating topic: icattle.provenance.events"
kafka-topics --bootstrap-server $KAFKA_BROKER \
  --create \
  --if-not-exists \
  --topic icattle.provenance.events \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000

# Create fraud detection topic
echo "Creating topic: icattle.fraud.alerts"
kafka-topics --bootstrap-server $KAFKA_BROKER \
  --create \
  --if-not-exists \
  --topic icattle.fraud.alerts \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=2592000000

echo ""
echo "========================================="
echo "Topic List:"
echo "========================================="
kafka-topics --bootstrap-server $KAFKA_BROKER --list | grep icattle

echo ""
echo "========================================="
echo "Topic Details:"
echo "========================================="
kafka-topics --bootstrap-server $KAFKA_BROKER --describe --topic icattle.cattle.events

echo ""
echo "✅ Kafka topics initialized successfully!"
