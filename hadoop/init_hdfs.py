import hdfs
import os

# HDFS configuration
HDFS_URL = os.getenv('HDFS_URL', 'http://namenode:9870')
HDFS_USER = os.getenv('HDFS_USER', 'hdfs')
HDFS_BASE_PATH = '/user/savora/events'

# Event types to file paths mapping
EVENT_PATHS = {
    'cuisine_events': 'cuisine_events',
    'dietary_events': 'dietary_events',
    'restaurant_view_events': 'restaurant_view_events',
    'bookmark_events': 'bookmark_events',
    'search_events': 'search_events'
}

# Create HDFS client
client = hdfs.InsecureClient(HDFS_URL, user=HDFS_USER)

# Create base directory if it doesn't exist
if not client.status(HDFS_BASE_PATH, strict=False):
    client.makedirs(HDFS_BASE_PATH)
    print(f"Created HDFS base directory: {HDFS_BASE_PATH}")

# Create directories for each event type
for event_type, path in EVENT_PATHS.items():
    full_path = f"{HDFS_BASE_PATH}/{path}"
    if not client.status(full_path, strict=False):
        client.makedirs(full_path)
        print(f"Created HDFS directory: {full_path}")

print("HDFS initialization complete.")