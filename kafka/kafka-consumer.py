import json
import os
import time
import traceback
import random
import socket
from datetime import datetime
from kafka import KafkaConsumer
import hdfs

print("========== KAFKA CONSUMER STARTING ==========")
print(f"KAFKA_BROKERS = {os.getenv('KAFKA_BROKERS', 'kafka:9093')}")
print(f"KAFKA_TOPIC = {os.getenv('KAFKA_TOPIC', 'user-events')}")
print(f"HDFS_URL = {os.getenv('HDFS_URL', 'http://namenode:9870')}")
print(f"HDFS_BASE_PATH = {os.getenv('HDFS_BASE_PATH', '/user/savora/events')}")
print("HOSTNAME = ", socket.gethostname())
print("IP ADDRESS = ", socket.gethostbyname(socket.gethostname()))
print("=============================================")

# Kafka configuration
KAFKA_BROKERS = os.getenv('KAFKA_BROKERS', 'kafka:9093')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'user-events')
KAFKA_GROUP_ID = os.getenv('KAFKA_GROUP_ID', 'hdfs-consumer-group')

# HDFS configuration
HDFS_URL = os.getenv('HDFS_URL', 'http://namenode:9870')
HDFS_USER = os.getenv('HDFS_USER', 'hdfs')
HDFS_BASE_PATH = os.getenv('HDFS_BASE_PATH', '/user/savora/events')

# Event types to file paths mapping
EVENT_PATHS = {
    'CUISINE_SELECTED': 'cuisine_events',
    'DIETARY_PREFERENCE_SELECTED': 'dietary_events',
    'RESTAURANT_VIEWED': 'restaurant_view_events',
    'RESTAURANT_BOOKMARKED': 'bookmark_events',
    'SEARCH_PERFORMED': 'search_events'
}

# Maximum retries for HDFS operations
MAX_HDFS_RETRIES = 5
RETRY_DELAY = 2  # seconds

# Generate a unique client ID for this instance to avoid lease conflicts
CLIENT_ID = f"consumer_{socket.gethostname()}_{os.getpid()}_{int(time.time())}"

def wait_for_kafka(timeout=60):
    """Wait for Kafka to become available"""
    print(f"Waiting for Kafka at {KAFKA_BROKERS}...")
    kafka_host, kafka_port = KAFKA_BROKERS.split(':')
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((kafka_host, int(kafka_port)))
            sock.close()
            
            if result == 0:
                print(f"Successfully connected to Kafka at {KAFKA_BROKERS}")
                return True
            
            print(f"Waiting for Kafka... (elapsed: {int(time.time() - start_time)}s)")
            time.sleep(5)
        except Exception as e:
            print(f"Error checking Kafka: {e}")
            time.sleep(5)
    
    print(f"Timed out waiting for Kafka after {timeout} seconds")
    return False

def ensure_hdfs_paths():
    """Ensure all required HDFS paths exist"""
    try:
        print(f"Connecting to HDFS at {HDFS_URL} as user {HDFS_USER}")
        # Create HDFS client
        client = hdfs.InsecureClient(HDFS_URL, user=HDFS_USER)
        
        # Create base directory if it doesn't exist
        if not client.status(HDFS_BASE_PATH, strict=False):
            print(f"Creating base directory: {HDFS_BASE_PATH}")
            client.makedirs(HDFS_BASE_PATH)
        
        # Create directories for event types
        for event_type, path in EVENT_PATHS.items():
            full_path = f"{HDFS_BASE_PATH}/{path}"
            if not client.status(full_path, strict=False):
                print(f"Creating HDFS directory: {full_path}")
                client.makedirs(full_path)
                
        # Create a directory for user-specific events
        user_events_path = f"{HDFS_BASE_PATH}/by_user"
        if not client.status(user_events_path, strict=False):
            print(f"Creating HDFS directory for user events: {user_events_path}")
            client.makedirs(user_events_path)
        
        print("HDFS directory structure verified")
        
        # List all directories to confirm
        print("Current HDFS directory structure:")
        try:
            for path in client.list(HDFS_BASE_PATH):
                print(f" - {path}")
        except Exception as e:
            print(f"Error listing HDFS directories: {e}")
            
    except Exception as e:
        print(f"Error ensuring HDFS paths: {e}")
        traceback.print_exc()

def get_output_filename(event_type, timestamp=None, user_id=None):
    """
    Generate output filename based on event type and date
    If user_id is provided, also save to user-specific directory
    """
    if timestamp:
        # Extract date from timestamp
        try:
            date_part = timestamp.split('T')[0]
        except (AttributeError, IndexError):
            date_part = datetime.now().strftime('%Y-%m-%d')
    else:
        date_part = datetime.now().strftime('%Y-%m-%d')
    
    path = EVENT_PATHS.get(event_type, 'other_events')
    
    # Main event file path - use consistent filename based on date
    main_file = f"{HDFS_BASE_PATH}/{path}/{date_part}.json"
    
    # If user_id is provided, also return a user-specific file path
    if user_id:
        user_path = f"{HDFS_BASE_PATH}/by_user/{user_id}"
        user_file = f"{user_path}/{event_type}_{date_part}.json"
        return main_file, user_file
    
    return main_file, None

def write_to_hdfs_with_retry(client, filepath, content, append_mode=True):
    """Write content to HDFS with retries, supporting both append and overwrite modes"""
    for attempt in range(MAX_HDFS_RETRIES):
        try:
            # Ensure directory exists
            directory = os.path.dirname(filepath)
            if not client.status(directory, strict=False):
                print(f"Creating directory: {directory}")
                client.makedirs(directory)
            
            # Check if file already exists
            file_exists = client.status(filepath, strict=False) is not None
            
            if append_mode and file_exists:
                # Append to existing file
                try:
                    with client.write(filepath, append=True) as writer:
                        writer.write(content)
                    print(f"Successfully appended to file: {filepath}")
                    return True
                except hdfs.util.HdfsError as e:
                    # If append fails with lease error, fall back to read-modify-write pattern
                    if "lease" in str(e).lower() or "recovery" in str(e).lower():
                        print(f"Append failed with lease error, trying read-modify-write: {e}")
                        # Read existing content
                        try:
                            with client.read(filepath) as reader:
                                existing_content = reader.read()
                            
                            # Write back with new content appended
                            with client.write(filepath, overwrite=True) as writer:
                                writer.write(existing_content)
                                writer.write(content)  # Append the new content
                            
                            print(f"Successfully used read-modify-write to append to: {filepath}")
                            return True
                        except Exception as inner_e:
                            print(f"Read-modify-write failed: {inner_e}")
                            raise inner_e
                    else:
                        # Some other HDFS error occurred
                        raise e
            else:
                # Use overwrite mode for new files or when append_mode is False
                mode = "overwrite" if file_exists else "create"
                with client.write(filepath, overwrite=file_exists) as writer:
                    writer.write(content)
                print(f"Successfully {mode}d file: {filepath}")
                return True
                
        except hdfs.util.HdfsError as e:
            print(f"HDFS error on attempt {attempt+1}: {e}")
            if attempt < MAX_HDFS_RETRIES - 1:
                delay = RETRY_DELAY * (attempt + 1)  # Exponential backoff
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                # On final retry, try creating a new file with timestamp suffix
                if attempt == MAX_HDFS_RETRIES - 1:
                    try:
                        timestamp = int(time.time())
                        new_filepath = f"{filepath}.{timestamp}"
                        print(f"Final attempt: Creating new file with timestamp: {new_filepath}")
                        with client.write(new_filepath, overwrite=True) as writer:
                            writer.write(content)
                        print(f"Successfully wrote to alternative file: {new_filepath}")
                        return True
                    except Exception as fallback_error:
                        print(f"Fallback attempt also failed: {fallback_error}")
                
                print(f"Failed after {MAX_HDFS_RETRIES} attempts")
                return False
        except Exception as e:
            print(f"Unexpected error on attempt {attempt+1}: {e}")
            traceback.print_exc()
            if attempt < MAX_HDFS_RETRIES - 1:
                delay = RETRY_DELAY * (attempt + 1)
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                print(f"Failed after {MAX_HDFS_RETRIES} attempts")
                return False
    
    return False

def process_message(msg):
    """Process and store a Kafka message to HDFS"""
    try:
        print("\n" + "-" * 40)
        print("Processing new message from Kafka...")
        # Parse JSON payload from Kafka
        raw_value = msg.value.decode('utf-8')
        print(f"Raw message: {raw_value}")
        
        event = json.loads(raw_value)
        event_type = event.get('eventType')
        user_id = event.get('userId')
        
        print(f"Received event of type: {event_type}")
        if user_id:
            print(f"Event associated with user ID: {user_id}")
        
        if not event_type:
            print(f"Warning: Event missing eventType: {event}")
            return
        
        # Get the appropriate filenames for this event
        timestamp = event.get('timestamp')
        main_file, user_file = get_output_filename(event_type, timestamp, user_id)
        
        # Convert event to JSON string
        event_json = json.dumps(event) + "\n"  # Add newline for JSON Lines format
        event_bytes = event_json.encode('utf-8')
        
        # Create HDFS client
        client = hdfs.InsecureClient(HDFS_URL, user=HDFS_USER)
        
        # Write to main event file
        print(f"Writing to main event file: {main_file}")
        main_success = write_to_hdfs_with_retry(client, main_file, event_bytes, append_mode=True)
        
        # If user_id is provided, also write to user-specific file
        user_success = True
        if user_file:
            print(f"Writing to user-specific file: {user_file}")
            user_success = write_to_hdfs_with_retry(client, user_file, event_bytes, append_mode=True)
        
        if main_success and user_success:
            print(f"Successfully stored event of type {event_type} to HDFS")
        else:
            print(f"Warning: Failed to store event to one or more locations")
            
        print("-" * 40)
        
    except Exception as e:
        print(f"Error processing message: {e}")
        traceback.print_exc()

def main():
    """Main consumer loop"""
    print(f"Starting Kafka consumer for topic {KAFKA_TOPIC} with client ID {CLIENT_ID}")
    
    # Wait for Kafka to be available
    if not wait_for_kafka(timeout=120):
        print("Kafka not available, exiting")
        return
    
    # Ensure HDFS paths exist
    ensure_hdfs_paths()
    
    # Create Kafka consumer
    try:
        consumer = KafkaConsumer(
            KAFKA_TOPIC,
            bootstrap_servers=KAFKA_BROKERS,
            group_id=KAFKA_GROUP_ID,
            client_id=CLIENT_ID,  # Set a unique client ID
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            value_deserializer=lambda x: x,  # Keep raw bytes, we'll decode in process_message
            session_timeout_ms=30000,  # Increase timeouts for stability
            request_timeout_ms=40000,
            max_poll_interval_ms=300000
        )
        
        print(f"Successfully connected to Kafka at {KAFKA_BROKERS}")
        print("Waiting for messages...")
        
        # Process messages
        for msg in consumer:
            process_message(msg)
    except Exception as e:
        print(f"Error in Kafka consumer: {e}")
        traceback.print_exc()
        raise

if __name__ == "__main__":
    # Add retry logic for initial connection
    retries = 5
    for i in range(retries):
        try:
            print(f"Attempt {i+1} to start Kafka consumer")
            main()
            break
        except Exception as e:
            if i < retries - 1:
                print(f"Error connecting to Kafka, retrying in 10 seconds: {e}")
                time.sleep(10)
            else:
                print(f"Failed to connect after {retries} retries: {e}")
                raise