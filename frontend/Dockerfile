FROM node:latest

WORKDIR /app

COPY --chown=node:node . .

RUN npm install --force

CMD ["npm", "start"]