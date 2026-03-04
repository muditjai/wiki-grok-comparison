# Use Node.js as the base image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY --chown=node:node . .

# Build the TypeScript code
RUN npm run build

# Use non-root user 'node' that comes with the node image
USER node

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["npm", "start"]
