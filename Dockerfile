FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN yarn install

COPY . .

RUN yarn build

EXPOSE 2086
CMD ["node", "dist/main"]
