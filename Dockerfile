FROM node:14.17
WORKDIR /app/olm_app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000