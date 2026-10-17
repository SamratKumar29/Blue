# Build stage: client (Vite) + server (tsc)
FROM node:20-slim AS build
WORKDIR /app
COPY client/package*.json client/
COPY server/package*.json server/
RUN cd client && npm ci && cd ../server && npm ci
COPY . .
RUN cd client && npm run build && cd ../server && npm run build

# Runtime stage: server only, serving the built client from server/public
FROM node:20-slim
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/client/dist ./public
USER node
EXPOSE 8080
CMD ["node", "dist/index.js"]
