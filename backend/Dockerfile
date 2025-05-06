FROM node:18-alpine

WORKDIR /usr/src/app
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install dependencies
COPY package*.json ./
RUN npm install

# Install system dependencies for Chromium
RUN apk add --no-cache chromium nss freetype harfbuzz ttf-freefont

# Copy source code
COPY . .

# Expose port and run development server
EXPOSE 3000
CMD ["npm", "run", "dev"]