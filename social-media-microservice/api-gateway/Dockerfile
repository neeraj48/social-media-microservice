FROM node:18-alpine

WORKDIR /use/src/app

COPY packege*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD [ "node", "src/server.js" ]