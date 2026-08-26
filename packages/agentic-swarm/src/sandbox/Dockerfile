# Sandbox runner image. Built once, reused across runs — no per-run image build,
# no network access required inside the container (deps come from the read-only
# /store bind mount seeded from the host's pnpm store).
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10 --activate \
  && addgroup -g 10001 swarm && adduser -D -u 10001 -G swarm swarm \
  && apk add --no-cache chromium

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Scripts live OUTSIDE /work deliberately: /work is a named-volume mount point
# at runtime, which masks anything baked into that path in the image layer.
COPY apply-edits.mjs verify-assertion.mjs run-patch.sh /opt/agent/
RUN chmod +x /opt/agent/run-patch.sh

WORKDIR /work
USER swarm:swarm
ENTRYPOINT ["/opt/agent/run-patch.sh"]
