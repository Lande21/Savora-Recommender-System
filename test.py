import json
import os
from datetime import datetime
from kafka import KafkaProducer
import time

# Kafka configuration - will work both inside and outside container
KAFKA_BROKERS = os.getenv('KAFKA_BROKERS', 'kafka:9093')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'user-events')

def send_test_event():
    print("Creating Kafka producer...")
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BROKERS,
        value_serializer=lambda x: json.dumps(x).encode('utf-8')
    )
    
    # Create test event
    test_event = {
        "eventType": "DIETARY_PREFERENCE_SELECTED",
        "timestamp": datetime.now().isoformat(),
        "data": {
            "preference": "TEST_PREFERENCE"
        }
    }
    
    print(f"Sending test event to {KAFKA_TOPIC}: {test_event}")
    
    # Send event
    producer.send(KAFKA_TOPIC, test_event)
    producer.flush()
    
    print("Test event sent successfully")
    
if __name__ == "__main__":
    # Try 3 times with delays to ensure message is sent
    for i in range(3):
        try:
            send_test_event()
            time.sleep(2)  # Wait between sends
        except Exception as e:
            print(f"Error sending test event: {e}")