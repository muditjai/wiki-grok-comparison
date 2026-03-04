# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the application using Nginx (Unprivileged)
FROM nginxinc/nginx-unprivileged:alpine

# Switch to root temporarily to set up files
USER root

# Copy the build output from the first stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set proper permissions for the nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html

# Switch back to the non-root nginx user
USER nginx

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
