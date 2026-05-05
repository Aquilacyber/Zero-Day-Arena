FROM nginx:alpine

# Install Python, pip, zip utility for generating dynamic artifacts
RUN apk add --no-cache python3 py3-pip zip unzip

WORKDIR /usr/share/nginx/html

# Clear default nginx content
RUN rm -rf ./*

# Copy scripts and raw assets
COPY assets/ /opt/assets/
COPY generate_footprint.py /opt/generate_footprint.py
COPY entrypoint.sh /opt/entrypoint.sh

# Install piexif library for EXIF injection
RUN pip3 install --no-cache-dir piexif --break-system-packages || pip3 install --no-cache-dir piexif

# Fix Windows CRLF line endings and set permissions
RUN sed -i 's/\r$//' /opt/entrypoint.sh /opt/generate_footprint.py && \
    chmod +x /opt/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/opt/entrypoint.sh"]
