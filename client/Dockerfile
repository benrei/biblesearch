# FROM node:18 as build
# WORKDIR /app
# COPY . .
# RUN npm install
# RUN npm run build
# RUN ls

# FROM nginx:alpine
# COPY --from=build /app/www /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]


#Pre build version
# Use a base image that includes Nginx
FROM nginx

# Copy the built Angular app from the local machine to the nginx directory
COPY ./www /usr/share/nginx/html

# Create a custom Nginx configuration file that supports client-side routing
RUN echo "\
    server {\n\
    listen 80;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html index.htm;\n\
    location / {\n\
    try_files \$uri \$uri/ /index.html;\n\
    }\n\
    error_page 404 /index.html;\n\
    }\n\
    " > /etc/nginx/conf.d/default.conf

# Expose port 80 to allow external access to the Angular application
EXPOSE 80

# CMD to start nginx and keep it running in the foreground
CMD ["nginx", "-g", "daemon off;"]
