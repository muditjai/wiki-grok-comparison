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

# Generate self-signed SSL certificate
RUN apk add --no-cache openssl && \
    mkdir -p /etc/ssl/private /etc/ssl/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost" && \
    chown nginx:nginx /etc/ssl/private/nginx-selfsigned.key /etc/ssl/certs/nginx-selfsigned.crt && \
    chmod 600 /etc/ssl/private/nginx-selfsigned.key /etc/ssl/certs/nginx-selfsigned.crt

# Set proper permissions for the nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html

# Switch back to the non-root nginx user
USER nginx

# Expose port 8080 and 8443
EXPOSE 8080
EXPOSE 8443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
