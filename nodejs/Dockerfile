# This Dockerfile sets up the Node.js backend environment.

# Use an official Node.js runtime as the base image.
FROM node:latest

# Set the working directory inside the container.
WORKDIR /app/nodejs

# Copy package.json and package-lock.json (if available).
# This leverages Docker's cache, so dependencies are only re-installed if these files change.
COPY package*.json ./

# Install the application dependencies.
RUN npm install

# Copy the rest of your application's source code into the container.
COPY . .

# The command to start the application (can be overridden in docker-compose.yml).
CMD ["npm", "start"]
