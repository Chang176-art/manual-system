# Server stage
FROM node:20-alpine AS server
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --production
COPY server/src ./src
RUN mkdir -p uploads
EXPOSE 3001
CMD ["node", "src/index.js"]

# Client build stage
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Client nginx stage
FROM nginx:alpine AS client
COPY --from=client-build /app/client/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
