# ============================================================
# AquilaCyber CTF Platform — Docker Image
# Multi-stage build for optimal image size
# ============================================================

# ---- Stage 1: Build (install deps & generate evidence) ----
FROM node:18 AS builder

WORKDIR /app

# Copy package manifests
COPY package.json ./

# Install all npm dependencies (including sharp for evidence generation)
RUN npm install --omit=dev

# Copy the evidence generator and its base image
COPY phantom-insider/generate.js ./phantom-insider/generate.js
COPY phantom-insider/meetup_base.png ./phantom-insider/meetup_base.png
COPY phantom-insider/static/ ./phantom-insider/static/

# Generate the dynamic evidence files (meetup_spot.jpg with EXIF, stolen_data.zip)
RUN node phantom-insider/generate.js


# ---- Stage 2: Runtime (lean production image) ----
FROM node:18-slim

WORKDIR /app

# Install runtime dependencies:
#   - iputils-ping: required by Challenge 4 (Ping / Command Injection)
#   - libvips: required by sharp at runtime for image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy generated evidence files from builder stage
COPY --from=builder /app/phantom-insider/static/ ./phantom-insider/static/

# Copy application source code
COPY . .

# Create the ping sandbox with its flag (isolated from root dir)
RUN mkdir -p /app/ping_sandbox \
    && echo "CTF{cmd_inj_root_access_pwned}" > /app/ping_sandbox/flag_ping.txt

# Create flag files for other filesystem-reading challenges
# Challenge 6 (Calculator / Eval RCE):
RUN echo "CTF{rce_eval_is_evil_math}" > /app/flag_calc.txt
# Challenge 9 (XXE):
RUN echo "CTF{xxe_entity_expansion_pro}" > /app/flag_xxe.txt

# Create uploads and data-persist directories
RUN mkdir -p /app/uploads /app/data-persist

# Expose the application port
EXPOSE 3000

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=3000
ENV SESSION_SECRET=change_me_in_production
ENV JWT_SECRET=super_secret_jwt_key
ENV DB_PATH=/app/data-persist/aquila.json

# Healthcheck — verify the app is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "const http = require('http'); http.get('http://localhost:3000/auth/login', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the server
CMD ["node", "server.js"]
