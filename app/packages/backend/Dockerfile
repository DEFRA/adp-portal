# This dockerfile builds an image for the backend package.
# It should be executed with the root of the repo as docker context.
#
# Before building this image, be sure to have run the following commands in the repo root:
#
# yarn install
# yarn tsc
# yarn build:backend
#
# Once the commands have been run, you can build the image using `yarn build-image`

FROM node:18-bookworm-slim AS base

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    # Install isolate-vm dependencies, these are needed by the @backstage/plugin-scaffolder-backend.
    apt-get install -y --no-install-recommends python3 g++ build-essential && \
    # Install python
    apt-get install -y python3 python3-pip python3-venv && \
    # Clean out apt caches
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

ENV PYTHON /usr/bin/python3
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv "$VIRTUAL_ENV"
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
# This switches many Node.js dependencies to production mode.
ENV NODE_ENV production

RUN pip3 install mkdocs-techdocs-core

USER node
WORKDIR /app

# ================================================================================= #

FROM base AS skeleton
# Contains the application skeleton which is enough to run yarn install and nothing else.

COPY --chown=node:node yarn.lock .yarnrc.yml package.json packages/backend/dist/skeleton.tar.gz ./
COPY --chown=node:node .yarn ./.yarn
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

# Yarn should exclusively be looking in the checked in cache directory
ENV YARN_ENABLE_OFFLINE_MODE=1
RUN yarn workspaces focus --all --production && \
    # Yarn isnt needed to run the application, so all its files can be deleted
    rm -rf .yarn yarn.lock .yarnrc.yml

# ================================================================================= #

FROM base AS bundle
# Contains the application bundle and any other files needed at runtime.

COPY --chown=node:node packages/backend/dist/bundle.tar.gz app-config*.yaml *configuration.yaml ./
COPY --chown=node:node config/*.yaml ./config/
COPY --chown=node:node --chmod=0755 packages/backend/src/opentelemetry.js ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

# ================================================================================= #

FROM base AS application
# Contains the actual application, consisting of the skeleton and bundle merged together

COPY --from=skeleton --chown=node:node /app ./
COPY --from=bundle --chown=node:node /app ./

CMD ["node", "--require", "./opentelemetry.js", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.production.yaml"]
