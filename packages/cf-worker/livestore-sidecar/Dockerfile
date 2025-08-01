FROM node:23-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY server.ts ./
COPY schema.ts ./

EXPOSE 8080

CMD ["npm", "start"]