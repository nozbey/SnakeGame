# Base image olarak Node.js kullan
FROM node:18-alpine

# Çalışma dizinine geç
WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package.json ./
RUN npm install

# Uygulamayı kopyala
COPY . .

# Sunucuyu başlat
CMD ["node", "server.js"]

# Portu aç
EXPOSE 8000
