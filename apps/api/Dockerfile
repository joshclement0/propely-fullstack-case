FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends g++ make python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN npm ci \
  --include-workspace-root \
  --workspace @propely-case/api \
  --workspace @propely-case/contracts

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev:api"]
