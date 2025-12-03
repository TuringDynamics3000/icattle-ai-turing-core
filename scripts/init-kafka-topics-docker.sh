#!/bin/bash
#
# Initialize Kafka topics for iCattle using Docker
# Connects to TuringCore-v3 Kafka container
#
# Usage: ./scripts/init-kafka-topics-docker.sh
#

KAFKA_CONTAINER="turingcore-kafka"

echo "========================================="
echo "iCattle Kafka Topic Initialization (Docker)"
echo "========================================="
echo "Kafka Container: $KAFKA_CONTAINER"
echo ""

# Check if Kafka container is running
if ! docker ps | grep -q $KAFKA_CONTAINER; then
    echo "ERROR: Kafka container '$KAFKA_CONTAINER' is not running"
    echo "Please start TuringCore-v3 Kafka first:"
    echo "  cd /path/to/TuringCore-v3"
    echo "  docker-compose up -d zookeeper kafka"
    exit 1
fi

# Create cattle events topic
echo "Creating topic: icattle.cattle.events"
docker exec $KAFKA_CONTAINER kafka-topics \
  --bootstrap-server localhost:9092 \
  --create \
  --if-not-exists \
  --topic icattle.cattle.events \
  --partitions 6 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config compression.type=snappy

# Create provenance events topic
echo "Creating topic: icattle.provenance.events"
docker exec $KAFKA_CONTAINER kafka-topics \
  --bootstrap-server localhost:9092 \
  --create \
  --if-not-exists \
  --topic icattle.provenance.events \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000

# Create fraud detection topic
echo "Creating topic: icattle.fraud.alerts"
docker exec $KAFKA_CONTAINER kafka-topics \
  --bootstrap-server localhost:9092 \
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
docker exec $KAFKA_CONTAINER kafka-topics \
  --bootstrap-server localhost:9092 \
  --list | grep icattle

echo ""
echo "========================================="
echo "Topic Details:"
echo "========================================="
docker exec $KAFKA_CONTAINER kafka-topics \
  --bootstrap-server localhost:9092 \
  --describe \
  --topic icattle.cattle.events

echo ""
echo "✅ Kafka topics initialized successfully!"
echo ""
echo "To test the connection from iCattle:"
echo "  1. Set KAFKA_BROKERS=your-local-ip:9093 in .env"
echo "  2. Restart iCattle server"
echo "  3. Publish a test event"
