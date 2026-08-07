FROM node:22-bookworm-slim

# System packages: git/curl for source + Bun installer, unzip for the Bun archive,
# ca-certificates for HTTPS, sudo so the agent user can install extras if needed.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        curl \
        ca-certificates \
        unzip \
        sudo \
    && rm -rf /var/lib/apt/lists/*

# Bun is this project's package manager (bun.lock) and is also required at build time
# by scripts/split-db.js, which imports "bun:sqlite". Install it system-wide.
RUN curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash \
    && bun --version

# Grant the existing non-root `node` user passwordless sudo.
RUN echo 'node ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

# Answer the Angular CLI's interactive analytics prompt non-interactively so
# `ng serve` / `ng build` never block waiting for input.
ENV NG_CLI_ANALYTICS=false

USER node
