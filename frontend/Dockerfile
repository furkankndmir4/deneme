# Aşama 1: Uygulamayı oluştur (build)
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Aşama 2: Oluşturulan uygulamayı bir Nginx sunucusu ile servis et
FROM nginx:alpine

# Varsayılan Nginx yapılandırmasını kaldır
RUN rm /etc/nginx/conf.d/default.conf

# Özel Nginx yapılandırma dosyanı kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build aşamasından oluşturulan statik dosyaları Nginx'in servis edeceği dizine kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 