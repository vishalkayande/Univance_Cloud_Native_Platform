# Production stage - use pre-built dist folder from local machine
FROM nginx:stable-alpine

# Copy the pre-built dist folder (built locally with npm run build)
COPY dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
