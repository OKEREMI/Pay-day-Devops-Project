# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_AUTH_URL
ARG VITE_PAYMENT_URL

ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_PAYMENT_URL=$VITE_PAYMENT_URL

RUN npm run build

# Runtime stage
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
