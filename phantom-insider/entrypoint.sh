#!/bin/sh

# Run the generation script
cd /usr/share/nginx/html
python3 /opt/generate_footprint.py

# Start NGINX
nginx -g "daemon off;"
