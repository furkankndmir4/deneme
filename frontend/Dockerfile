# Development build için
FROM node:20 as dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# .env.docker dosyasını .env olarak kopyala
COPY .env.docker .env
CMD ["npm", "run", "dev"]

# Production build için
FROM node:18 as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Nginx ile serve et
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]