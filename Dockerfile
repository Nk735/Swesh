# Dockerfile per il backend (server)
FROM node:18-alpine

WORKDIR /app

# Copia solo i manifest per caching layer
COPY server/package*.json ./server/

WORKDIR /app/server
RUN npm ci --only=production

# Copia il codice del server
COPY server ./

ENV NODE_ENV=production
# Railway fornisce automaticamente la variabile PORT al runtime
CMD ["node", "server.js"]
