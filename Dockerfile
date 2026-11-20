# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# A placeholder is enough to generate the Prisma client and build; the real URL is provided at runtime.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/seated"
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]
