FROM node:22-slim

# Install git for repository tracking and publishing
RUN apt-get update && apt-get install -y git ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definition
COPY package*.json ./

# Install production dependencies if needed
RUN npm install --omit=dev || true

# Copy project source
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--experimental-strip-types", "scripts/start-telegram-bot.ts"]
