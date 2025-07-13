#!/bin/bash

echo "🚀 Starting Traffic Violation Frontend..."

# Build and start container
docker-compose up --build

# Cleanup on exit
trap 'echo "🛑 Stopping container..."; docker-compose down' EXIT
