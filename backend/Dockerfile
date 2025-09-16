# Use Node.js LTS
FROM node:20

# Install MySQL client for wait-for-db.sh
RUN apt-get update && apt-get install -y default-mysql-client && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your project
COPY . .

# Expose your app port
EXPOSE 3000

# Command to run your app
CMD ["npm", "run", "dev"]
