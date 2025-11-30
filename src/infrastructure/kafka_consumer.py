from confluent_kafka import Consumer, KafkaException
import json
import sys

# --- Configuration ---
KAFKA_CONFIG = {
    "bootstrap.servers": "localhost:9093",
    "group.id": "agritech-ml-processor-group", # Unique consumer group ID
    "auto.offset.reset": "earliest"
}

KAFKA_TOPIC = "agritech.animal.events"

def start_consumer():
    """Starts the Kafka consumer to listen for events."""
    
    print(f"Starting Kafka Consumer for topic: {KAFKA_TOPIC}...")
    
    consumer = Consumer(KAFKA_CONFIG)
    
    try:
        consumer.subscribe([KAFKA_TOPIC])
        
        while True:
            # Poll for messages with a timeout
            msg = consumer.poll(timeout=1.0)
            
            if msg is None:
                continue
            if msg.error():
                if msg.error().fatal():
                    sys.stderr.write(f"Fatal Consumer Error: {msg.error()}\n")
                    break
                continue
            
            # Process the message
            try:
                event = json.loads(msg.value().decode('utf-8'))
                
                print("\n" + "="*50)
                print("✅ EVENT RECEIVED FROM KAFKA (Turing Protocol Enforced)")
                print(f"Topic: {msg.topic()} | Partition: {msg.partition()} | Offset: {msg.offset()}")
                print(f"Aggregate ID (Muzzle Hash): {event['aggregate_id']}")
                print(f"Event Type: {event['event_type']}")
                print(f"Tenant ID: {event['metadata']['tenant_id']}")
                print(f"User ID: {event['metadata']['user_id']}")
                print(f"S3 Key: {event['payload']['s3_key']}")
                print("="*50 + "\n")
                
            except Exception as e:
                sys.stderr.write(f"Error processing message: {e}\n")
                
    except KeyboardInterrupt:
        sys.stderr.write('%% Aborted by user\n')
    except KafkaException as e:
        sys.stderr.write(f"Kafka Exception: {e}\n")
    finally:
        # Close down consumer to commit final offsets.
        consumer.close()

if __name__ == "__main__":
    start_consumer()
