FROM node:8
WORKDIR /app
COPY ./package*.json ./
RUN npm install --only=production
COPY ./data/historical-data.json ./data/
COPY ./src/ ./src
CMD ['node', './src/index.js']
