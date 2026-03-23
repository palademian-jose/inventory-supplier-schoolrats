FROM docker.io/library/node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src ./src
COPY .env.example ./.env.example

EXPOSE 5000

CMD ["node", "src/server.js"]
