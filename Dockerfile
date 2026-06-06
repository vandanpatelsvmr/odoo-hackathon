FROM node:20-slim

WORKDIR /app

# Copy package files first
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd backend && npm install

# Copy the rest of the application
COPY . .

# Environment variables
ENV PORT=5000
ENV DB_HOST=db
ENV DB_USER=root
ENV DB_PASSWORD=root
ENV DB_NAME=vendorbridge

EXPOSE 5000

# Start command
CMD ["node", "backend/server.js"]