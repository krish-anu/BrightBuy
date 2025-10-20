FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./

# Switch to npm install (less strict, better for dev, avoids timeout)
RUN npm install --legacy-peer-deps

COPY . .

# Backend API runs on 8081
EXPOSE 8081
CMD ["npm", "run", "dev"]
