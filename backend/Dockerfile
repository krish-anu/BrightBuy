FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./

# Install production dependencies only to keep image small
ENV NODE_ENV=production
RUN npm ci --omit=dev --legacy-peer-deps

COPY . .

# Backend API runs on 8081
EXPOSE 8081
# Default to production start; docker-compose can override if needed
CMD ["npm", "start"]
