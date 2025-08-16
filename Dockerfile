# Dockerfile
FROM node:18
 
# Set working directory
WORKDIR /Backend-Livyco
 
# Copy files
COPY package*.json ./
RUN npm install
COPY . .
 
# Set environment port
ENV PORT=5000
 
# Expose port
EXPOSE 5000
 
# Start app
CMD ["npm", "start"]
