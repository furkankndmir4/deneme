# Node.js 20 imajını temel al
FROM node:20

# Konteyner içinde çalışma dizinini belirle
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyala
# Bağımlılıkları kurmak için önce bunları kopyalıyoruz, böylece kod değiştiğinde bağımlılıklar tekrar kurulmaz
COPY package*.json ./

# Bağımlılıkları kur
RUN npm install

# Geri kalan uygulama kodunu kopyala
COPY . .

# Uygulamanın çalışacağı portu belirt
EXPOSE 5000

# Uygulamayı başlatma komutu
CMD [ "npm", "start" ] 