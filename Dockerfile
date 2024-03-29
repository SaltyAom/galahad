FROM node:16-alpine3.14 as builder

WORKDIR /usr/app

RUN npm install -g pnpm

COPY package.json .
COPY pnpm-lock.yaml .

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# * ====================
FROM node:16-alpine3.14 as modules

WORKDIR /usr/app

RUN npm install -g pnpm

COPY package.json .
COPY pnpm-lock.yaml .
COPY prisma prisma

RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate
RUN pnpm prune --production

# * ====================
FROM node:16-alpine3.14 as main

WORKDIR /usr/app/

COPY --from=modules /usr/app/node_modules node_modules
COPY --from=builder /usr/app/build build
COPY package.json .
COPY public public

ENV NODE_ENV production

CMD ["node", "./build/index.js"]
EXPOSE 8080
