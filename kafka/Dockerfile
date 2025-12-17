FROM python:3.9-slim

# Install necessary packages including dependencies for HDFS client
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    libkrb5-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the consumer script
COPY kafka-consumer.py .

# Command to run the consumer
CMD ["python", "kafka-consumer.py"]
