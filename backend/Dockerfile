FROM node:latest

WORKDIR /app

COPY --chown=node:node . .

RUN apt-get update

RUN npm install --force

ENTRYPOINT [ "sh", "script.sh" ]

CMD [ "npm", "run", "start:dev" ]