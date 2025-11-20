# Usa una immagine leggera con Node 18 (compatibile con la tua app)
FROM node:18-alpine

# Crea cartella di lavoro
WORKDIR /app

# Copia solo i manifest del server per sfruttare la cache Docker
COPY server/package*.json ./server/

# Installa dipendenze (production). Se ti serve tutto (es. per build), rimuovi --only=production
WORKDIR /app/server
RUN npm ci --only=production

# Copia il codice del server
COPY server ./

# Imposta variabili d'ambiente base
ENV NODE_ENV=production

# Railway fornisce PORT; non è obbligatorio EXPOSE, ma non fa male
EXPOSE 3000

# Avvia il server (server.js legge process.env.PORT || 5000)
CMD ["node", "server.js"]