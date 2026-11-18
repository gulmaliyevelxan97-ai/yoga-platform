FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends util-linux ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY *.mjs package.json ./
COPY deploy/start-worker.sh ./start-worker.sh
RUN chmod 0755 /app/start-worker.sh
ENV NODE_ENV=production
ENTRYPOINT ["/app/start-worker.sh"]
