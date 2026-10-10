FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY apps ./apps
COPY packages ./packages
COPY tsconfig.json ./
COPY scripts ./scripts
RUN npm ci && npm run build -w @dayly/api
FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=build /app /app
USER node
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@dayly/api"]
