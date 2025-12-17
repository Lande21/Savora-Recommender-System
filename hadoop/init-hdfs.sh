#!/bin/bash

# Wait for NameNode to start up
echo "========================================================"
echo "HDFS Initialization Script Starting"
echo "========================================================"

echo "Waiting for NameNode to become available..."
until curl -sf http://namenode:9870/ > /dev/null 2>&1; do
  echo "  - NameNode not ready yet, waiting 5 seconds..."
  sleep 5
done

echo "NameNode is up and running!"
echo "========================================================"

# Create directories for Savora events
echo "Creating HDFS directory structure for event storage..."

# Create user directory if it doesn't exist
hdfs dfs -mkdir -p /user

# Create savora user directory
hdfs dfs -mkdir -p /user/savora

# Create events base directory
hdfs dfs -mkdir -p /user/savora/events

# Create directories for each event type
hdfs dfs -mkdir -p /user/savora/events/cuisine_events
hdfs dfs -mkdir -p /user/savora/events/dietary_events
hdfs dfs -mkdir -p /user/savora/events/restaurant_view_events
hdfs dfs -mkdir -p /user/savora/events/bookmark_events
hdfs dfs -mkdir -p /user/savora/events/search_events

# Set permissions (making it accessible to all users)
echo "Setting permissions on HDFS directories..."
hdfs dfs -chmod -R 777 /user/savora

# List created directories
echo "========================================================"
echo "HDFS Directory Structure:"
hdfs dfs -ls -R /user/savora

echo "========================================================"
echo "HDFS initialization complete"
echo "========================================================"

# Check for local event data directory
if [ -d "/events_data" ]; then
  echo "Found local event data, checking for migration needs..."
  
  # Loop through event type directories
  for dir in cuisine_events dietary_events restaurant_view_events bookmark_events search_events; do
    if [ -d "/events_data/$dir" ] && [ "$(ls -A /events_data/$dir 2>/dev/null)" ]; then
      echo "Found local data for $dir, migrating to HDFS..."
      
      # Copy files to HDFS
      for file in /events_data/$dir/*.json; do
        if [ -f "$file" ]; then
          filename=$(basename "$file")
          echo "  - Copying $filename to HDFS..."
          hdfs dfs -put -f $file /user/savora/events/$dir/
        fi
      done
    fi
  done
  
  echo "Migration complete"
else
  echo "No local event data found for migration"
fi

echo "========================================================"
echo "Verifying HDFS content after migration:"
hdfs dfs -ls -R /user/savora/events
echo "========================================================"

# Add a healthy delay to ensure all operations are complete before other services start
echo "Waiting 5 seconds for HDFS operations to stabilize..."
sleep 5

echo "All HDFS initialization tasks completed successfully!"
echo "========================================================"

# Keep the log output preserved
exit 0