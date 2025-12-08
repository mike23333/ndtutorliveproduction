# Gemini Live API Server Dockerfile
# Optimized for Cloud Run deployment with WebSocket support

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Cloud Run uses PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Run with uvicorn
# - host 0.0.0.0 for container accessibility
# - workers 1 for WebSocket (stateful connections)
# - timeout-keep-alive for long WebSocket connections
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1", "--timeout-keep-alive", "300"]
