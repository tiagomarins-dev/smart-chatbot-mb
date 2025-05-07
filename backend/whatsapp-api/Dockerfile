FROM node:16-alpine

WORKDIR /app

# Instalação de dependências do sistema
RUN apk add --no-cache \
    chromium \
    ffmpeg \
    ca-certificates \
    harfbuzz \
    nss \
    freetype \
    ttf-freefont

# Definir variáveis de ambiente para o Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Criar diretório para armazenar dados do WhatsApp
RUN mkdir -p /app/wa_data

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências do Node.js
RUN npm install

# Copiar o código fonte
COPY . .

# Expor a porta
EXPOSE 3000

# Comando de inicialização
CMD ["node", "index.js"]