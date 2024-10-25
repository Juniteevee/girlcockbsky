#FROM node:22-alpine
FROM node:22.2.0-slim

WORKDIR /app

COPY package*.json ./

RUN npm i -g pnpm && pnpm install

COPY . .

#RUN pnpm run dev

CMD [ "pnpm", "dev" ]
