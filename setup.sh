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

echo "🔥 Welcome to the AquilaCyber CTF Lab Setup! 🔥"
sleep 1
typing_effect "I'll get everything ready for you..."
echo

# --- Dependency Checks ---
typing_effect "First, let's check for the necessary tools."
sleep 1

# Function to install a package if it's missing
install_package() {
    PKG_NAME=$1
    if ! command -v $PKG_NAME &> /dev/null; then
        typing_effect "Uh-oh! '$PKG_NAME' is missing."
        read -p "Shall I install it for you? (y/n): " choice
        if [[ "$choice" == "y" || "$choice" == "Y" ]]; then
            typing_effect "Excellent! Installing $PKG_NAME..."
            if [ "$(id -u)" -ne 0 ]; then
                typing_effect "I'll need sudo access to do this."
                sudo apt-get update && sudo apt-get install -y $PKG_NAME
            else
                apt-get update && apt-get install -y $PKG_NAME
            fi
            if ! command -v $PKG_NAME &> /dev/null; then
                typing_effect "It seems the installation failed. Please install $PKG_NAME manually."
                exit 1
            fi
        else
            typing_effect "Alright, but some parts of the lab might not work without it."
        fi
    else
        typing_effect "Awesome! '$PKG_NAME' is already here."
    fi
    sleep 1
}

install_package "php"
install_package "python3"

# --- Docker and Docker Compose ---
if ! command -v docker &> /dev/null; then
    typing_effect "The final and most important tool is Docker. It's missing."
    typing_effect "The Web SQLi challenge needs it to run."
    for i in {5..1}; do
        echo -ne "I'll start the installation in $i seconds... (Press Ctrl+C to cancel)\r"
        sleep 1
    done
    echo
    typing_effect "Here we go! Installing Docker..."
    if [ "$(id -u)" -ne 0 ]; then
        typing_effect "I'll need sudo access for this part."
        sudo apt-get update && sudo apt-get install -y docker.io
        sudo systemctl start docker && sudo systemctl enable docker
    else
        apt-get update && apt-get install -y docker.io
        systemctl start docker && systemctl enable docker
    fi
    if ! command -v docker &> /dev/null; then
        typing_effect "Something went wrong with the Docker installation. Please install it manually."
        exit 1
    fi
    typing_effect "Docker is now installed and running! 🐳"
else
    typing_effect "Docker is already installed. Fantastic!"
fi
sleep 1

# --- Starting the Lab ---
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
    docker compose up 
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
    typing_effect "Skipping the SQLi challenge because Docker isn't available."
fi
sleep 1

# --- Final Instructions ---
echo
typing_effect "Starting the PHP server for the main homepage..."
php -S localhost:8000 -t homepage > /dev/null 2>&1 &
sleep 2
typing_effect "The homepage is now running at http://localhost:8000"
typing_effect "Open this URL in your browser to start exploring the CTF."
echo


typing_effect "Starting the XOR Crypto Flask challenge on port 5002..."
# Check for Flask, install if missing
if ! python3 -c "import flask" 2>/dev/null; then
    typing_effect "Flask is not installed for Python 3. Installing..."
    pip3 install flask
fi
# Start the XOR Flask app in the background
nohup python3 crypto-xor/challenge.py > /dev/null 2>&1 &
sleep 2
typing_effect "The XOR Crypto challenge is now running at http://localhost:5002 (open http://localhost:5002 in your browser to solve it)"

typing_effect "Starting the Forensics Steganography Flask challenge on port 5004..."
nohup python3 forensics-stego/embed_flag.py > /dev/null 2>&1 &
sleep 2
typing_effect "The Forensics Steganography challenge is now running at http://localhost:5004 (open http://localhost:5004 in your browser to solve it)"

typing_effect "Starting the CrackMe Flask challenge on port 5003..."
if [ -f reverse-pyc/secret_check.py ]; then
    typing_effect "Compiling secret_check.py to .pyc for the challenge..."
    python3 -m py_compile reverse-pyc/secret_check.py
    # Move the .pyc to a predictable name for import
    pyc_file=$(ls reverse-pyc/__pycache__/secret_check*.pyc | head -n1)
    mv "$pyc_file" reverse-pyc/secret_check.cpython-311.pyc
    rm reverse-pyc/secret_check.py
    rm -rf reverse-pyc/__pycache__
    typing_effect "Obfuscated password check ready. Source removed."
fi
nohup python3 reverse-pyc/crackme.py > /dev/null 2>&1 &
sleep 2
typing_effect "The CrackMe challenge is now running at http://localhost:5003"

echo
typing_effect "Setup complete. Happy hacking! 🔥🦅"
