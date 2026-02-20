FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create app user and necessary directories with proper permissions
RUN useradd -m -u 1000 appuser && \
    mkdir -p /tmp/app_data && \
    mkdir -p /tmp/app_data/ultralytics && \
    mkdir -p /tmp/app_data/.keras && \
    chmod -R 777 /tmp/app_data && \
    chown -R appuser:appuser /app /tmp/app_data

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set proper ownership for app directory
RUN chown -R appuser:appuser /app

# Set environment variables for ML libraries
ENV ULTRALYTICS_CONFIG_DIR=/tmp/app_data/ultralytics
ENV KERAS_HOME=/tmp/app_data/.keras
ENV FLASK_APP=app.py
ENV FLASK_RUN_PORT=7860
ENV FLASK_RUN_HOST=0.0.0.0

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 7860

# Run the application
CMD ["flask", "run"]