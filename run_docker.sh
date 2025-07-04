#!/bin/bash

# Function to create a typing effect
typing_effect() {
    text="$1"
    delay=0.05
    for ((i = 0; i < ${#text}; i++)); do
        echo -n "${text:$i:1}"
        sleep $delay
    done
    echo
}

typing_effect "All checks passed! Let's fire up the lab environment."
sleep 1
if command -v docker &> /dev/null; then
    typing_effect "Starting the Web SQLi challenge with Docker Compose..."
    if ! docker info > /dev/null 2>&1; then
        typing_effect "Docker daemon is not running or you do not have permission to access it."
        typing_effect "Please ensure your user is in the 'docker' group and the daemon is running."
        typing_effect "Try: sudo usermod -aG docker $USER && newgrp docker"
        exit 1
    fi
    docker compose up -d
    if [ $? -ne 0 ]; then
        typing_effect "Docker Compose failed. Checking Docker daemon status..."
        if ! docker info > /dev/null 2>&1; then
            typing_effect "Docker daemon is not running."
            # Detect if Docker Desktop is being used
            if docker info 2>&1 | grep -q "Operating System: Docker Desktop"; then
                typing_effect "Docker Desktop detected. Please start Docker Desktop manually and rerun the script."
                exit 1
            fi
            typing_effect "Automatic Docker daemon start is not supported on this system."
            typing_effect "Please start the Docker daemon manually and rerun the script."
            exit 1
        fi
    fi
    echo
    typing_effect "The SQLi challenge is now running on http://localhost:5001"
else
    typing_effect "Exiting... Docker is not installed, so the lab cannot be started."
fi
sleep 1
