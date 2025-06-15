# This Dockerfile sets up the React development environment.

# Use an official Node.js runtime as the base image.
FROM node:latest

# Set the working directory inside the container.
WORKDIR /app

# Copy package.json and package-lock.json (if available).
COPY package*.json ./

# Install the application dependencies.
RUN npm install

# Copy the rest of your application's source code into the container.
COPY . .

# The command to start the React development server.
# The '--host' flag is necessary to expose the server outside the container.
CMD ["npm", "run", "dev", "--", "--host"]
