FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port and run development server
EXPOSE 3000
CMD ["npm", "run", "dev"]