# Сборка витрины и раздача статики через nginx — для Railway
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# Railway подставляет PORT, nginx-шаблон читает его через envsubst
ENV PORT=8080
EXPOSE 8080
