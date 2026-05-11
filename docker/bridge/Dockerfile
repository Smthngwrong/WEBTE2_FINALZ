FROM node:20-bullseye-slim

# Octave is the only addition over a plain Node.js image
RUN apt-get update && apt-get install -y \
    octave \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
