#!/bin/bash

# Define the GitHub repository URL and the local directory
REPO_URL="https://github.com/Aquilacyber/Zero-Day-Arena"
LOCAL_DIR="Zero-Day-Arena"
RAVEN_DIR="$LOCAL_DIR/Raven-Recon"

# Check if the local directory exists
if [ -d "$RAVEN_DIR" ]; then
    # Change to the Raven-Recon directory
    cd "$RAVEN_DIR" || exit

    # Fetch the latest changes from the remote repository
    git fetch origin

    # Check if there are any changes to pull for raven.py
    if git diff --quiet origin/main -- raven.py; then
        echo "raven.py is up to date."
    else
        # Pull the latest changes for raven.py
        git pull origin main -- raven.py
        echo "raven.py has been updated."
    fi
else
    echo "The local repository does not exist. Cloning it now..."
    git clone "$REPO_URL" "$LOCAL_DIR"
    cd "$RAVEN_DIR" || exit
    echo "raven.py has been cloned."
fi
