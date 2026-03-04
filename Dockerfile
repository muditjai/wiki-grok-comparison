# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Build the backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app

# Copy production dependencies from backend
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy built backend code
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend and serve it statically
COPY --from=frontend-builder /app/frontend/dist ./public

# Add a script to serve static files from the backend
RUN sed -i "/app.use(express.json());/a app.use(express.static('public'));" dist/index.js

EXPOSE 3001

CMD ["node", "dist/index.js"]