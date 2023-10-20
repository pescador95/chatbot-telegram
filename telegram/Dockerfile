FROM node:18

WORKDIR /app

COPY / package*.json ./

RUN npm install

COPY / .

ENV QUARKUS_PORT=3000
ENV QUARKUS_URL=backend
ENV QUARKUS_BASEURL=http://backend:3000
ENV TELEGRAM_TOKEN=insira-o-token-aqui
ENV API_BACKEND_LOGIN=login
ENV API_BACKEND_PASSWORD=password
ENV PORT=5000

EXPOSE $PORT

CMD ["node", "--max-old-space-size=512", "index.js"]
