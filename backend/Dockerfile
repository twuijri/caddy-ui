FROM node:24-alpine

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
# Fork review distribution only: expose the Arabic draft in the language picker.
# An explicit deployment environment variable can override this default.
ENV CADDY_UI_ADDITIONAL_LANGUAGES=ar

RUN apk add --no-cache docker-cli

# Caddy binary for caddy fmt, validation and version detection in local mode
# (instances without a container name). Docker mode uses the container's own.
COPY --from=caddy:latest /usr/bin/caddy /usr/bin/caddy

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

EXPOSE 3001

CMD ["node", "src/index.js"]
