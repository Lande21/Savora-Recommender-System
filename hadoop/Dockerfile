FROM python:3.9-slim

# Install necessary packages including Kerberos and PostgreSQL development libraries
RUN apt-get update && apt-get install -y \
    curl \
    libkrb5-dev \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip install pandas matplotlib seaborn requests numpy \
    hdfs requests-kerberos psycopg2-binary

WORKDIR /app

# Copy analytics scripts
COPY analytics.py .

# Create directories
RUN mkdir -p /output

# Set executable permission for the script
RUN chmod +x /app/analytics.py

# Command to run
CMD ["python", "analytics.py"]
