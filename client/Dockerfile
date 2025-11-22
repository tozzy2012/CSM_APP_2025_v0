# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install

# Copy source
COPY . .

# Expose port
EXPOSE 3003

# Start dev server
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "3003"]
