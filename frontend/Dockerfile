# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Build-time env for Vite (baked into client bundle)
ARG VITE_API_URL=
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL VITE_SUPABASE_URL=$VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and env files
COPY . .

# Create .env file for production build from build args
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env.production && \
    echo "VITE_SUPABASE_URL=${VITE_SUPABASE_URL}" >> .env.production && \
    echo "VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}" >> .env.production

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Install serve to run the app
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5173

# Start the application - serve ONLY the dist folder (absolute path for SPA fallback)
CMD ["serve", "-s", "/app/dist", "-l", "5173"]
