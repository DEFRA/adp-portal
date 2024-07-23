ARG PARENT_VERSION=18-bookworm-slim
ARG PORT_DEBUG=9229

# Development
FROM node:${PARENT_VERSION}
ARG PARENT_VERSION
LABEL uk.gov.defra.adp.parent-image=defradigital/node-development:${PARENT_VERSION}
ARG PORT_DEBUG
EXPOSE ${PORT_DEBUG}
# RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
# --mount=type=cache,target=/var/lib/apt,sharing=locked \
#   apt-get update && \
#   apt-get install -y \
#     make \
#     g++ \
#     jpeg-dev \
#     cairo-dev \
#     giflib-dev \
#     pango-dev \
#     libtool \
#     autoconf \
#     automake && \
#     # Clean out apt caches
#   rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*
USER node
WORKDIR /home/node
