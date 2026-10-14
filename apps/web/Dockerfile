FROM node:22-bookworm-slim

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN npm ci \
  --include-workspace-root \
  --workspace @propely-case/web \
  --workspace @propely-case/contracts

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--workspace", "apps/web", "--", "--host", "0.0.0.0"]
