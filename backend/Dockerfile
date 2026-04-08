FROM node:22

RUN apt-get update && apt-get install -y libreoffice && apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]